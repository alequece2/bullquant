import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env.dev")
conn = psycopg2.connect(os.getenv("DIRECT_URL"))
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM companies WHERE ceo IS NOT NULL")
count = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM companies")
total = cur.fetchone()[0]
print(f"CEOs populados: {count} de {total}")
