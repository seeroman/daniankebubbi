from flask import Flask, request, jsonify
import sqlite3
import json
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect('orders.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    print("📦 Received Order Data:", data)
    # Add current timestamp if not provided
    order_time = data.get('time') or datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    payment_status = data.get('paymentStatus', 'UNPAID')  # Default to UNPAID

    conn = get_db_connection()
    conn.execute(
        'INSERT INTO orders (waiter, customer, items, status, time, paymentStatus) VALUES (?, ?, ?, ?, ?, ?)',
        (
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
