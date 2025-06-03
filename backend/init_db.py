import sqlite3

# Connect to database (creates if not exists)
conn = sqlite3.connect('orders.db')
c = conn.cursor()

# Drop table if needed (for reset)
c.execute('DROP TABLE IF EXISTS orders')

# Create orders table with all fields
c.execute('''
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    waiter TEXT NOT NULL,
    customer TEXT,
    items TEXT NOT NULL,
    status TEXT NOT NULL,
    time TEXT,
    paymentStatus TEXT
)
''')

conn.commit()
conn.close()

print("✅ Database initialized successfully.")
