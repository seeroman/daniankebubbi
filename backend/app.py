from flask import Flask, request, jsonify
import sqlite3
import json
from flask_cors import CORS
from datetime import datetime
import pytz
import os
import subprocess

app = Flask(__name__)
CORS(app)

# Database file path (using absolute path for persistence)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'orders.db')


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def initialize_database():
    """Initialize the database with required tables and schema"""
    conn = sqlite3.connect(DB_PATH)
    try:
        # Check if tables exist
        tables = conn.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='orders'
        """).fetchone()
        
        if not tables:
            # Create tables with all necessary columns
            conn.execute("""
                CREATE TABLE orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    custom_order_id TEXT,
                    waiter TEXT NOT NULL,
                    customer TEXT DEFAULT '',
                    items TEXT NOT NULL,
                    status TEXT DEFAULT 'NEW',
                    time TEXT NOT NULL,
                    paymentStatus TEXT DEFAULT 'UNPAID',
                    completion_time TEXT,
                    time_taken_minutes INTEGER,
                    day_of_week INTEGER
                )
            """)
            
            # Create indexes
            conn.execute("CREATE INDEX IF NOT EXISTS idx_orders_time ON orders(time)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)")
            
            conn.commit()
            print("Database initialized with new tables")
        else:
            # Verify all columns exist
            columns = [col[1] for col in conn.execute("PRAGMA table_info(orders)").fetchall()]
            required_columns = [
                'custom_order_id', 'waiter', 'customer', 'items', 'status',
                'time', 'paymentStatus', 'completion_time', 'time_taken_minutes', 'day_of_week'
            ]
            
            for column in required_columns:
                if column not in columns:
                    try:
                        if column in ['completion_time', 'time_taken_minutes']:
                            conn.execute(f"ALTER TABLE orders ADD COLUMN {column} TEXT")
                        elif column == 'day_of_week':
                            conn.execute(f"ALTER TABLE orders ADD COLUMN {column} INTEGER")
                        else:
                            conn.execute(f"ALTER TABLE orders ADD COLUMN {column} TEXT")
                        conn.commit()
                        print(f"Added missing column: {column}")
                    except sqlite3.OperationalError as e:
                        print(f"Column {column} already exists or couldn't be added: {str(e)}")
            
            print("Database already exists, verified schema")
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise
    finally:
        conn.close()

# ========== DEBUG ENDPOINT ==========
@app.route('/debug/schema')
def debug_schema():
    conn = get_db_connection()
    result = conn.execute("PRAGMA table_info(orders)").fetchall()
    conn.close()
    return jsonify([{col["name"]: col["type"]} for col in result])

@app.route('/debug/verify-schema')
def verify_schema():
    required_columns = ['status', 'time_taken_minutes', 'completion_time', 'custom_order_id', 'day_of_week']
    conn = get_db_connection()
    try:
        result = conn.execute("PRAGMA table_info(orders)").fetchall()
        existing_columns = [col['name'] for col in result]
        missing = [col for col in required_columns if col not in existing_columns]
        
        if missing:
            return jsonify({
                'status': 'error',
                'missing_columns': missing,
                'suggestions': [
                    '/debug/add-completion-columns',
                    '/debug/fix-custom-order-id',
                    '/debug/add-day-of-week-column'
                ]
            }), 400
        return jsonify({'status': 'ok', 'columns': existing_columns})
    finally:
        conn.close()

@app.route('/debug/add-completion-columns')
def add_completion_columns():
    conn = get_db_connection()
    try:
        conn.execute("ALTER TABLE orders ADD COLUMN completion_time TEXT;")
        conn.execute("ALTER TABLE orders ADD COLUMN time_taken_minutes INTEGER;")
        conn.commit()
        return jsonify({
            'status': 'success',
            'message': 'Added completion_time and time_taken_minutes columns!'
        })
    except sqlite3.OperationalError as e:
        return jsonify({
            'status': 'exists',
            'message': str(e)
        })
    finally:
        conn.close()

@app.route('/debug/fix-custom-order-id')
def fix_custom_order_id():
    conn = get_db_connection()
    try:
        conn.execute("ALTER TABLE orders ADD COLUMN custom_order_id TEXT;")
        conn.commit()
        return jsonify({
            'status': 'success',
            'message': 'Added custom_order_id column!'
        })
    except sqlite3.OperationalError as e:
        return jsonify({
            'status': 'exists',
            'message': str(e)
        })
    finally:
        conn.close()

@app.route('/debug/add-day-of-week-column')
def add_day_of_week_column():
    conn = get_db_connection()
    try:
        conn.execute("ALTER TABLE orders ADD COLUMN day_of_week INTEGER")
        conn.execute("UPDATE orders SET day_of_week = CAST(strftime('%w', time) AS INTEGER)")
        conn.commit()
        return jsonify({
            'status': 'success', 
            'message': 'Added day_of_week column with calculated values'
        })
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            return jsonify({'status': 'exists', 'message': str(e)})
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()

@app.route('/debug/add-time-index')
def add_time_index():
    conn = get_db_connection()
    try:
        conn.execute("CREATE INDEX IF NOT EXISTS idx_orders_time ON orders(time)")
        conn.commit()
        return jsonify({
            'status': 'success',
            'message': 'Added index on time column for faster queries'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()

@app.route('/debug/test-time-parsing')
def test_time_parsing():
    conn = get_db_connection()
    try:
        sample = conn.execute("SELECT time FROM orders LIMIT 1").fetchone()
        if not sample:
            return jsonify({'error': 'No orders found'}), 404
            
        test = conn.execute("SELECT strftime('%H', time) as hour FROM orders LIMIT 1").fetchone()
        return jsonify({
            'sample_time': sample['time'],
            'parsed_hour': test['hour'],
            'compatible': test['hour'] is not None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/debug/clear-all-orders', methods=['POST'])
def clear_all_orders():
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM orders')
        conn.commit()
        return jsonify({'message': '🧹 All orders cleared successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ========== API ENDPOINTS ==========
@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        LOCAL_TIMEZONE = pytz.timezone('Europe/Helsinki')
        now = datetime.now(pytz.utc).astimezone(LOCAL_TIMEZONE)
        
        if 'waiter' not in data or 'items' not in data:
            return jsonify({'error': 'Missing required fields (waiter or items)'}), 400

        # Use ISO format for time storage
        order_time = data.get('time') or now.strftime('%Y-%m-%d %H:%M:%S')
        payment_status = data.get('paymentStatus', 'UNPAID')

        today_prefix = now.strftime('%d%m%y')
        conn = get_db_connection()
        result = conn.execute(
            "SELECT COUNT(*) as count FROM orders WHERE strftime('%Y-%m-%d', time) = ?",
            (now.strftime('%Y-%m-%d'),)
        ).fetchone()
        daily_count = result['count'] + 1
        custom_order_id = f"{today_prefix}-{daily_count:03d}"
        
        day_of_week = now.weekday()
        if day_of_week == 6:
            day_of_week = 0
        else:
            day_of_week += 1
        
        conn.execute(
            '''INSERT INTO orders 
            (custom_order_id, waiter, customer, items, status, time, paymentStatus, day_of_week) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                custom_order_id,
                data['waiter'],
                data.get('customer', ''),
                json.dumps(data['items']),
                'NEW',
                order_time,
                payment_status,
                day_of_week
            )
        )
        conn.commit()
        
        return jsonify({
            'message': 'Order created',
            'order_id': custom_order_id
        }), 201
    except Exception as e:
        app.logger.error(f"Error creating order: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        conn = get_db_connection()
        orders = conn.execute('SELECT * FROM orders WHERE status = "NEW"').fetchall()
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
    except Exception as e:
        app.logger.error(f"Error fetching orders: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/api/orders/<int:order_id>', methods=['PATCH'])
def mark_order_done(order_id):
    try:
        LOCAL_TIMEZONE = pytz.timezone('Europe/Helsinki')
        completion_time = datetime.now(pytz.utc).astimezone(LOCAL_TIMEZONE).strftime('%Y-%m-%d %H:%M:%S')
        
        conn = get_db_connection()
        order = conn.execute('SELECT time FROM orders WHERE id = ?', (order_id,)).fetchone()
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        try:
            created_time = datetime.strptime(order['time'], '%Y-%m-%d %H:%M:%S')
            completed_time_dt = datetime.strptime(completion_time, '%Y-%m-%d %H:%M:%S')
            minutes_taken = int((completed_time_dt - created_time).total_seconds() / 60)
        except ValueError:
            minutes_taken = 0
        
        conn.execute(
            '''UPDATE orders 
            SET status = "DONE", 
                completion_time = ?,
                time_taken_minutes = ?
            WHERE id = ?''',
            (completion_time, minutes_taken, order_id)
        )
        conn.commit()
        
        return jsonify({
            'message': 'Order marked as done',
            'completion_time': completion_time,
            'time_taken_minutes': minutes_taken
        })
    except Exception as e:
        app.logger.error(f"Error marking order done: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

# NEW ENDPOINT: Delete/Cancel Order
@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    try:
        conn = get_db_connection()
        
        # First check if order exists
        order = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Delete the order
        conn.execute('DELETE FROM orders WHERE id = ?', (order_id,))
        conn.commit()
        
        return jsonify({
            'message': 'Order deleted successfully',
            'deleted_order': {
                'id': order['id'],
                'custom_order_id': order['custom_order_id'],
                'status': order['status']
            }
        })
    except Exception as e:
        app.logger.error(f"Error deleting order: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

# ========== ANALYTICS ENDPOINTS ==========
@app.route('/api/analytics/popular-items', methods=['GET'])
def get_popular_items():
    try:
        conn = get_db_connection()
        
        # Get all completed orders
        orders = conn.execute(
            '''SELECT items FROM orders WHERE status = "DONE"'''
        ).fetchall()
        
        if not orders:
            return jsonify({
                'message': 'No completed orders found',
                'popular_items': []
            }), 200
        
        item_counts = {}
        total_items_processed = 0
        skipped_items = 0
        
        for order in orders:
            try:
                items = json.loads(order['items'])
                if not isinstance(items, list):
                    app.logger.warning(f"Items is not a list: {order['items']}")
                    skipped_items += 1
                    continue
                
                for item in items:
                    if not isinstance(item, dict):
                        app.logger.warning(f"Item is not a dictionary: {item}")
                        skipped_items += 1
                        continue
                    
                    try:
                        item_name = item['name']
                        if not isinstance(item_name, str) or not item_name.strip():
                            app.logger.warning(f"Invalid item name: {item_name}")
                            skipped_items += 1
                            continue
                            
                        item_counts[item_name] = item_counts.get(item_name, 0) + 1
                        total_items_processed += 1
                    except KeyError:
                        app.logger.warning(f"Item missing 'name' field: {item}")
                        skipped_items += 1
                        continue
                        
            except json.JSONDecodeError as e:
                app.logger.error(f"Error parsing items JSON: {str(e)} - Raw data: {order['items']}")
                skipped_items += 1
                continue
            except Exception as e:
                app.logger.error(f"Unexpected error processing order: {str(e)}")
                skipped_items += 1
                continue
        
        if not item_counts:
            return jsonify({
                'message': 'No valid items found in completed orders',
                'popular_items': [],
                'stats': {
                    'total_orders_processed': len(orders),
                    'total_items_processed': total_items_processed,
                    'skipped_items': skipped_items
                }
            }), 200
        
        # Sort by count descending and get top 5
        popular_items = sorted(
            item_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Format response
        response = {
            'popular_items': [{
                'item_name': item[0],
                'order_count': item[1],
                'percentage_of_total': round((item[1] / total_items_processed) * 100, 2)
            } for item in popular_items],
            'stats': {
                'total_orders_processed': len(orders),
                'total_items_processed': total_items_processed,
                'skipped_items': skipped_items
            }
        }
        
        return jsonify(response)
    except Exception as e:
        app.logger.error(f"Error fetching popular items: {str(e)}")
        return jsonify({
            'error': 'Failed to process popular items',
            'details': str(e)
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()
            
@app.route('/api/analytics/hourly-trends', methods=['GET'])
def get_hourly_trends():
    try:
        conn = get_db_connection()
        
        hourly_counts = conn.execute('''
            SELECT strftime('%H', time) as hour, COUNT(*) as order_count
            FROM orders
            GROUP BY hour
            ORDER BY hour
        ''').fetchall()
        
        hourly_avg_times = conn.execute('''
            SELECT strftime('%H', time) as hour, AVG(time_taken_minutes) as avg_time
            FROM orders
            WHERE status = 'DONE'
            GROUP BY hour
            ORDER BY hour
        ''').fetchall()
        
        counts_dict = {row['hour']: row['order_count'] for row in hourly_counts}
        times_dict = {row['hour']: round(row['avg_time'], 1) if row['avg_time'] else 0 
                     for row in hourly_avg_times}
        
        response = []
        for hour in range(24):
            hour_str = f"{hour:02d}"
            response.append({
                'hour': hour_str,
                'order_count': counts_dict.get(hour_str, 0),
                'avg_preparation_time': times_dict.get(hour_str, 0)
            })
            
        return jsonify(response)
    except Exception as e:
        app.logger.error(f"Error fetching hourly trends: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/api/analytics/daily-volume', methods=['GET'])
def get_daily_volume():
    try:
        conn = get_db_connection()
        
        daily_counts = conn.execute('''
            SELECT strftime('%Y-%m-%d', time) as date, COUNT(*) as order_count
            FROM orders
            GROUP BY date
            ORDER BY date DESC
            LIMIT 30
        ''').fetchall()
        
        daily_avg_times = conn.execute('''
            SELECT strftime('%Y-%m-%d', time) as date, AVG(time_taken_minutes) as avg_time
            FROM orders
            WHERE status = 'DONE'
            GROUP BY date
            ORDER BY date DESC
            LIMIT 30
        ''').fetchall()
        
        times_dict = {row['date']: round(row['avg_time'], 1) if row['avg_time'] else 0 
                     for row in daily_avg_times}
        
        response = []
        for row in daily_counts:
            response.append({
                'date': row['date'],
                'order_count': row['order_count'],
                'avg_preparation_time': times_dict.get(row['date'], 0)
            })
            
        return jsonify(response)
    except Exception as e:
        app.logger.error(f"Error fetching daily volume: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/api/analytics/busy-hours', methods=['GET'])
def get_busy_hours():
    try:
        conn = get_db_connection()
        
        busy_hours = conn.execute('''
            SELECT strftime('%H', time) as hour, COUNT(*) as order_count
            FROM orders
            GROUP BY hour
            ORDER BY order_count DESC
            LIMIT 5
        ''').fetchall()
        
        return jsonify([{'hour': row['hour'], 'order_count': row['order_count']} for row in busy_hours])
    except Exception as e:
        app.logger.error(f"Error fetching busy hours: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/api/analytics/busy-days', methods=['GET'])
def get_busy_days():
    try:
        conn = get_db_connection()
        
        busy_days = conn.execute('''
            SELECT day_of_week, COUNT(*) as order_count
            FROM orders
            GROUP BY day_of_week
            ORDER BY order_count DESC
        ''').fetchall()
        
        day_names = {0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 
                    3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'}
        
        return jsonify([{
            'day_name': day_names.get(row['day_of_week'], 'Unknown'),
            'day_number': row['day_of_week'],
            'order_count': row['order_count']
        } for row in busy_days])
    except Exception as e:
        app.logger.error(f"Error fetching busy days: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/api/orders/completed/today', methods=['GET'])
def get_completed_orders_today():
    try:
        today = datetime.now(pytz.utc).astimezone(pytz.timezone('Europe/Helsinki')).strftime('%Y-%m-%d')
        conn = get_db_connection()
        
        count_result = conn.execute(
            'SELECT COUNT(*) as total FROM orders WHERE status = "DONE" AND strftime("%Y-%m-%d", time) = ?',
            (today,)
        ).fetchone()
        
        avg_result = conn.execute(
            'SELECT AVG(time_taken_minutes) as avg_time FROM orders WHERE status = "DONE" AND strftime("%Y-%m-%d", time) = ?',
            (today,)
        ).fetchone()
        
        return jsonify({
            'completed_orders_today': count_result['total'] if count_result else 0,
            'avg_completion_time_minutes': round(avg_result['avg_time'], 1) if avg_result and avg_result['avg_time'] else 0
        })
    except Exception as e:
        app.logger.error(f"Error fetching today's completed orders: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/api/orders/completed/total', methods=['GET'])
def get_completed_orders_total():
    try:
        conn = get_db_connection()
        
        count_result = conn.execute(
            'SELECT COUNT(*) as total FROM orders WHERE status = "DONE"'
        ).fetchone()
        
        avg_result = conn.execute(
            'SELECT AVG(time_taken_minutes) as avg_time FROM orders WHERE status = "DONE"'
        ).fetchone()
        
        return jsonify({
            'completed_orders_total': count_result['total'] if count_result else 0,
            'avg_completion_time_minutes': round(avg_result['avg_time'], 1) if avg_result and avg_result['avg_time'] else 0
        })
    except Exception as e:
        app.logger.error(f"Error fetching total completed orders: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/api/orders/reset-completed', methods=['POST'])
def reset_completed_orders():
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM orders WHERE status = "DONE"')
        conn.commit()
        return jsonify({'message': 'Completed orders reset successfully.'})
    except Exception as e:
        app.logger.error(f"Error resetting completed orders: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/api/orders/completed/today/list', methods=['GET'])
def get_today_completed_orders_list():
    try:
        today = datetime.now(pytz.utc).astimezone(pytz.timezone('Europe/Helsinki')).strftime('%Y-%m-%d')
        conn = get_db_connection()
        orders = conn.execute(
            '''SELECT * FROM orders 
            WHERE status = "DONE" AND strftime("%Y-%m-%d", time) = ?
            ORDER BY time DESC''',
            (today,)
        ).fetchall()
        
        return jsonify([{
            'id': row['id'],
            'custom_order_id': row['custom_order_id'],
            'waiter': row['waiter'],
            'customer': row['customer'],
            'items': json.loads(row['items']),
            'time': row['time'],
            'completion_time': row['completion_time'],
            'time_taken_minutes': row['time_taken_minutes'],
            'paymentStatus': row['paymentStatus']
        } for row in orders])
    except Exception as e:
        app.logger.error(f"Error fetching today's completed orders list: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/api/orders/completed/all', methods=['GET'])
def get_all_completed_orders():
    try:
        conn = get_db_connection()
        orders = conn.execute(
            '''SELECT * FROM orders 
            WHERE status = "DONE"
            ORDER BY time DESC'''
        ).fetchall()
        
        return jsonify([{
            'id': row['id'],
            'custom_order_id': row['custom_order_id'],
            'waiter': row['waiter'],
            'customer': row['customer'],
            'items': json.loads(row['items']),
            'time': row['time'],
            'completion_time': row['completion_time'],
            'time_taken_minutes': row['time_taken_minutes'],
            'paymentStatus': row['paymentStatus']
        } for row in orders])
    except Exception as e:
        app.logger.error(f"Error fetching all completed orders: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

# ========== GOOGLE DRIVE BACKUP FUNCTIONALITY ==========
@app.route('/api/backup', methods=['POST'])
def backup_to_gdrive():
    try:
        # 1. Validate credentials
        creds_file = "credentials.json"
        if not os.path.exists(creds_file):
            if not os.getenv("GDRIVE_CREDS_BASE64"):
                return jsonify({"error": "Google Drive credentials missing"}), 400
            
            try:
                with open(creds_file, "wb") as f:
                    f.write(base64.b64decode(os.getenv("GDRIVE_CREDS_BASE64")))
            except Exception as e:
                return jsonify({"error": f"Invalid credentials: {str(e)}"}), 400

        # 2. Create database dump
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        backup_file = f"backup_{timestamp}.sql"
        
        try:
            if os.getenv("postgresql://rders_production_user:vaqQuge2TLNM4mO9AVhs3qnaZQPb5K3Y@dpg-d1689jggjchc7397eu4g-a/rders_production"):  # PostgreSQL
                cmd = f"pg_dump {os.getenv('DATABASE_URL')} > {backup_file}"
            else:  # SQLite
                cmd = f"sqlite3 orders.db .dump > {backup_file}"
            
            subprocess.run(cmd, shell=True, check=True, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as e:
            return jsonify({"error": f"Database export failed: {e.stderr.decode().strip()}"}), 500

        # 3. Upload to Google Drive
        try:
            flow = InstalledAppFlow.from_client_secrets_file(
                creds_file,
                ["https://www.googleapis.com/auth/drive.file"]
            )
            creds = flow.run_local_server(port=0)
            service = build("drive", "v3", credentials=creds)
            
            file_metadata = {
                "name": backup_file,
                "parents": [os.getenv("1niklBPbmoQmI4Io8NeBfUAQws7uJBiSv", "root")]
            }
            media = MediaFileUpload(backup_file)
            
            file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields="id,name,webViewLink"
            ).execute()

            os.remove(backup_file)
            
            return jsonify({
                "status": "success",
                "file_id": file.get("id"),
                "view_link": file.get("webViewLink")
            })

        except Exception as e:
            return jsonify({"error": f"Google Drive error: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


if __name__ == '__main__':
    initialize_database()
    app.run(host='0.0.0.0', port=5000, debug=True)
