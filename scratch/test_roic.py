import psycopg2
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import process_company
from dotenv import load_dotenv

load_dotenv('.env')

conn = psycopg2.connect(os.getenv("DIRECT_URL"))
conn.autocommit = False

with conn.cursor() as cur:
    cur.execute("SELECT id, ticker, cik FROM companies WHERE ticker IN ('AAPL', 'AMZN')")
    companies = cur.fetchall()

for c in companies:
    comp_dict = {"id": c[0], "ticker": c[1], "cik": c[2]}
    print(f"Updating {comp_dict['ticker']}...")
    process_company(conn, comp_dict)
    print(f"Done {comp_dict['ticker']}")
