import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env.dev")

def main():
    conn = psycopg2.connect(os.getenv("DIRECT_URL"))
    cur = conn.cursor()
    cur.execute("SELECT ticker, \"logoUrl\" FROM companies WHERE ticker = 'AAPL'")
    row = cur.fetchone()
    print(f"AAPL Logo URL: {row[1]}")

if __name__ == "__main__":
    main()
