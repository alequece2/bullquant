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
    cur.execute("SELECT id, ticker, cik FROM companies WHERE ticker = 'PLD'")
    company = cur.fetchone()

if company:
    comp_dict = {"id": company[0], "ticker": company[1], "cik": company[2]}
    process_company(conn, comp_dict)
    print("PLD updated")
