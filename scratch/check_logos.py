import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env.dev")

def main():
    conn = psycopg2.connect(os.getenv("DIRECT_URL"))
    cur = conn.cursor()
    cur.execute("SELECT ticker, \"logoUrl\" FROM companies WHERE ticker IN ('AAPL', 'UBER', 'TSLA', 'AMZN', 'GOOGL')")
    rows = cur.fetchall()
    for r in rows:
        print(f"{r[0]}: {r[1]}")

if __name__ == "__main__":
    main()
