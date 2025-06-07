from flask import Flask, request, jsonify
import sqlite3
import json
from flask_cors import CORS
from datetime import datetime
import pytz

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect('orders.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/debug/schema')
def debug_schema():
    conn = get_db_connection()
    result = conn.execute("PRAGMA table_info(orders)").fetchall()
    conn.close()
    return jsonify([{col["name"]: col["type"]} for col in result])

@app.route('/debug/add-completion-columns')
def add_completion_columns():
    conn = get_db_connection()
    try:
        conn.execute("ALTER TABLE orders ADD COLUMN completion_time TEXT;")
        conn.execute("ALTER TABLE orders ADD COLUMN time_taken_minutes INTEGER;")
        conn.commit()
        return "✅ Added completion_time and time_taken_minutes columns!"
    except sqlite3.OperationalError as e:
        return f"Columns already exist: {str(e)}"
    finally:
        conn.close()

@app.route('/debug/fix-custom-order-id')
def fix_custom_order_id():
    conn = get_db_connection()
    conn.execute("ALTER TABLE orders ADD COLUMN custom_order_id TEXT;")
    conn.commit()
    conn.close()
    return "✅ custom_order_id column added!"

@app.route('/debug/clear-all-orders', methods=['POST'])
def clear_all_orders():
    conn = get_db_connection()
    conn.execute('DELETE FROM orders')
    conn.commit()
    conn.close()
    return jsonify({'message': '🧹 All orders cleared successfully!'})

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    print("📦 Received Order Data:", data)
    
    LOCAL_TIMEZONE = pytz.timezone('Europe/Helsinki')
    now = datetime.now(pytz.utc).astimezone(LOCAL_TIMEZONE)
    
    # Set order time if not provided
    order_time = data.get('time') or now.strftime('%d-%m-%y %I:%M %p')
    payment_status = data.get('paymentStatus', 'UNPAID')

    # Generate custom_order_id
    today_prefix = now.strftime('%d%m%y')
    conn = get_db_connection()
    result = conn.execute(
        "SELECT COUNT(*) as count FROM orders WHERE time LIKE ?",
        (now.strftime('%d-%m-%y') + '%',)
    ).fetchone()
    daily_count = result['count'] + 1
    custom_order_id = f"{today_prefix}-{daily_count:03d}"
    
    conn.execute(
        '''INSERT INTO orders 
        (custom_order_id, waiter, customer, items, status, time, paymentStatus) 
        VALUES (?, ?, ?, ?, ?, ?, ?)''',
        (
            custom_order_id,
            data['waiter'],
            data.get('customer', ''),
            json.dumps(data['items']),
            'NEW',
            order_time,
            payment_status
        )
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Order created'}), 201

@app.route('/api/orders', methods=['GET'])
def get_orders():
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders WHERE status = "NEW"').fetchall()
    conn.close()
    return jsonify([
        {
            'id': row['id'],
            'custom_order_id': row['custom_order_id'],
            'waiter': row['waiter'],
            'customer': row['customer'],
            'items': json.loads(row['items']),
            'time': row['time'],
            'paymentStatus': row['paymentStatus']
        }
        for row in orders
    ])

@app.route('/api/orders/<int:order_id>', methods=['PATCH'])
def mark_order_done(order_id):
    LOCAL_TIMEZONE = pytz.timezone('Europe/Helsinki')
    completion_time = datetime.now(pytz.utc).astimezone(LOCAL_TIMEZONE).strftime('%d-%m-%y %I:%M %p')
    
    conn = get_db_connection()
    
    # Get order creation time
    order = conn.execute('SELECT time FROM orders WHERE id = ?', (order_id,)).fetchone()
    if not order:
        conn.close()
        return jsonify({'error': 'Order not found'}), 404
    
    # Calculate time taken in minutes
    try:
        created_time = datetime.strptime(order['time'], '%d-%m-%y %I:%M %p')
        completed_time_dt = datetime.strptime(completion_time, '%d-%m-%y %I:%M %p')
        time_taken = completed_time_dt - created_time
        minutes_taken = int(time_taken.total_seconds() / 60)
    except ValueError as e:
        minutes_taken = 0  # Fallback if time parsing fails
    
    # Update order with completion data
    conn.execute(
        '''UPDATE orders 
        SET status = "DONE", 
            completion_time = ?,
            time_taken_minutes = ?
        WHERE id = ?''',
        (completion_time, minutes_taken, order_id)
    )
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Order marked as done',
        'completion_time': completion_time,
        'time_taken_minutes': minutes_taken
    })

@app.route('/api/orders/completed/today', methods=['GET'])
def get_completed_orders_today():
    LOCAL_TIMEZONE = pytz.timezone('Europe/Helsinki')
    today = datetime.now(pytz.utc).astimezone(LOCAL_TIMEZONE).strftime('%d-%m-%y')

    conn = get_db_connection()
    
    # Get count of today's completed orders
    count_result = conn.execute(
        'SELECT COUNT(*) as total FROM orders WHERE status = "DONE" AND time LIKE ?',
        (f'{today}%',)
    ).fetchone()
    
    # Get average completion time
    avg_result = conn.execute(
        'SELECT AVG(time_taken_minutes) as avg_time FROM orders WHERE status = "DONE" AND time LIKE ?',
        (f'{today}%',)
    ).fetchone()
    
    conn.close()

    return jsonify({
        'completed_orders_today': count_result['total'],
        'avg_completion_time_minutes': round(avg_result['avg_time'], 1) if avg_result['avg_time'] else 0
    })

@app.route('/api/orders/completed/total', methods=['GET'])
def get_completed_orders_total():
    conn = get_db_connection()
    
    # Get total count of completed orders
    count_result = conn.execute(
        'SELECT COUNT(*) as total FROM orders WHERE status = "DONE"'
    ).fetchone()
    
    # Get all-time average completion time
    avg_result = conn.execute(
        'SELECT AVG(time_taken_minutes) as avg_time FROM orders WHERE status = "DONE"'
    ).fetchone()
    
    conn.close()

    return jsonify({
        'completed_orders_total': count_result['total'],
        'avg_completion_time_minutes': round(avg_result['avg_time'], 1) if avg_result['avg_time'] else 0
    })

@app.route('/api/orders/reset-completed', methods=['POST'])
def reset_completed_orders():
    conn = get_db_connection()
    conn.execute('DELETE FROM orders WHERE status = "DONE"')
    conn.commit()
    conn.close()
    return jsonify({'message': '✅ Completed orders reset successfully.'})

@app.route('/api/orders/completed/today/list', methods=['GET'])
def get_today_completed_orders_list():
    LOCAL_TIMEZONE = pytz.timezone('Europe/Helsinki')
    today = datetime.now(pytz.utc).astimezone(LOCAL_TIMEZONE).strftime('%d-%m-%y')

    conn = get_db_connection()
    orders = conn.execute(
        '''SELECT * FROM orders 
        WHERE status = "DONE" AND time LIKE ?
        ORDER BY time DESC''',
        (f'{today}%',)
    ).fetchall()
    conn.close()

    return jsonify([
        {
            'id': row['id'],
            'custom_order_id': row['custom_order_id'],
            'waiter': row['waiter'],
            'customer': row['customer'],
            'items': json.loads(row['items']),
            'time': row['time'],
            'completion_time': row['completion_time'],
            'time_taken_minutes': row['time_taken_minutes'],
            'paymentStatus': row['paymentStatus']
        }
        for row in orders
    ])

@app.route('/api/orders/completed/all', methods=['GET'])
def get_all_completed_orders():
    conn = get_db_connection()
    orders = conn.execute(
        '''SELECT * FROM orders 
        WHERE status = "DONE"
        ORDER BY time DESC'''
    ).fetchall()
    conn.close()

    return jsonify([
        {
            'id': row['id'],
            'custom_order_id': row['custom_order_id'],
            'waiter': row['waiter'],
            'customer': row['customer'],
            'items': json.loads(row['items']),
            'time': row['time'],
            'completion_time': row['completion_time'],
            'time_taken_minutes': row['time_taken_minutes'],
            'paymentStatus': row['paymentStatus']
        }
        for row in orders
    ])

if __name__ == '__main__':
    app.run(debug=True)
