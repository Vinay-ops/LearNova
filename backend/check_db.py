import sqlite3
conn = sqlite3.connect('test_casepilot.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("Tables:", c.fetchall())
c.execute("SELECT * FROM alembic_version")
print("Alembic version:", c.fetchall())
c.execute("PRAGMA table_info(users)")
print("Users columns:", c.fetchall())