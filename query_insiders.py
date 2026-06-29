import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env.dev")
conn = psycopg2.connect(os.getenv("DIRECT_URL"))
cur = conn.cursor()
cur.execute("""
    SELECT "insiderName", "type", "shares", "price", "value", "transactionDate"
    FROM "insider_transactions"
    JOIN "companies" c ON c.id = "companyId"
    WHERE c.ticker = 'ABBV'
    ORDER BY "transactionDate" DESC
    LIMIT 20;
""")
for row in cur.fetchall():
    print(row)
