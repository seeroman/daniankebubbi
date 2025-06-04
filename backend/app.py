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

@app.route('/debug/fix-custom-order-id')
def fix_custom_order_id():
    conn = get_db_connection()
    conn.execute("ALTER TABLE orders ADD COLUMN custom_order_id TEXT;")
    conn.commit()
    conn.close()
    return "✅ custom_order_id column added!"

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    print("📦 Received Order Data:", data)
    # Add current timestamp
    LOCAL_TIMEZONE = pytz.timezone('Europe/Helsinki')  # Change if needed
    order_time = data.get('time')
    if not order_time:
        now = datetime.now(pytz.utc).astimezone(LOCAL_TIMEZONE)
        order_time = now.strftime('%d-%m-%y %I:%M %p')  # e.g., 04-06-25 11:57 AM
    payment_status = data.get('paymentStatus', 'UNPAID')  # Default to UNPAID

     # Generate custom_order_id
    today_prefix = now.strftime('%d%m%y')  # e.g. 040625
    conn = get_db_connection()
    result = conn.execute(
        "SELECT COUNT(*) as count FROM orders WHERE time LIKE ?",
        (now.strftime('%d-%m-%y') + '%',)
    ).fetchone()
    daily_count = result['count'] + 1
    custom_order_id = f"{today_prefix}-{daily_count:03d}"  # e.g. 040625-001
    
    conn.execute(
        'INSERT INTO orders (custom_order_id, waiter, customer, items, status, time, paymentStatus) VALUES (?, ?, ?, ?, ?, ?,?)',
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
    conn = get_db_connection()
    conn.execute('UPDATE orders SET status = "DONE" WHERE id = ?', (order_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Order marked as done'})

@app.route('/api/orders/completed/today', methods=['GET'])
def get_completed_orders_today():
    LOCAL_TIMEZONE = pytz.timezone('Europe/Helsinki')
    today = datetime.now(pytz.utc).astimezone(LOCAL_TIMEZONE).strftime('%d-%m-%y')

    conn = get_db_connection()
    orders = conn.execute(
        'SELECT COUNT(*) as total FROM orders WHERE status = "DONE" AND time LIKE ?',
        (f'{today}%',)
    ).fetchone()
    conn.close()

    return jsonify({'completed_orders_today': orders['total']})

@app.route('/api/orders/completed/total', methods=['GET'])
def get_completed_orders_total():
    conn = get_db_connection()
    orders = conn.execute('SELECT COUNT(*) as total FROM orders WHERE status = "DONE"').fetchone()
    conn.close()

    return jsonify({'completed_orders_total': orders['total']})


@app.route('/api/orders/reset-completed', methods=['POST'])
def reset_completed_orders():
    conn = get_db_connection()
    conn.execute('DELETE FROM orders WHERE status = "DONE"')
    conn.commit()
    conn.close()
    return jsonify({'message': '✅ Completed orders reset successfully.'})
