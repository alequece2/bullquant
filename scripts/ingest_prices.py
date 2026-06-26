"""
ingest_prices.py — Ingere preços EOD históricos (10 anos) via Polygon.io.
Cron diário (6h UTC): python scripts/ingest_prices.py

Incremental: por empresa só pede dias novos desde o último registo em prices.
Na primeira corrida pede 10 anos.

Polygon free tier: 5 req/min → sleep 13s entre empresas.
"""

import os
import sys
import time
import datetime
import requests
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

ROOT = os.path.join(os.path.dirname(__file__), "..")
ENV_FILE = os.path.join(ROOT, ".env.dev")

if not os.path.exists(ENV_FILE):
    sys.exit(
        "ERRO: ficheiro .env.dev não encontrado.\n"
        "Cria um projeto Supabase de DEV e preenche .env.dev com as suas credenciais.\n"
        "NUNCA uses .env.local — estes scripts só correm contra a BD de desenvolvimento."
    )

load_dotenv(ENV_FILE)

DIRECT_URL = os.getenv("DIRECT_URL")
POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")

if not DIRECT_URL:
    sys.exit("DIRECT_URL não definida no .env.dev")
if not POLYGON_API_KEY:
    sys.exit("POLYGON_API_KEY não definida no .env.dev")

POLYGON_BASE = "https://api.polygon.io"
HISTORY_YEARS = 10
SLEEP_BETWEEN = 13


def get_companies(cur) -> list[dict]:
    cur.execute('SELECT ticker FROM companies WHERE "isActive" = TRUE ORDER BY ticker')
    return [{"ticker": r[0]} for r in cur.fetchall()]


def get_max_date(cur, ticker: str) -> datetime.date | None:
    cur.execute("SELECT MAX(date) FROM prices WHERE ticker = %s", (ticker,))
    row = cur.fetchone()
    return row[0] if row and row[0] else None


def fetch_polygon(ticker: str, from_date: str, to_date: str) -> list[dict]:
    url = (
        f"{POLYGON_BASE}/v2/aggs/ticker/{ticker}/range/1/day"
        f"/{from_date}/{to_date}"
        f"?adjusted=true&sort=asc&limit=50000&apiKey={POLYGON_API_KEY}"
    )
    try:
        r = requests.get(url, timeout=30)
        if r.status_code in (403, 404):
            return []
        r.raise_for_status()
        data = r.json()
        results = data.get("results") or []
        rows = []
        for item in results:
            date = datetime.datetime.utcfromtimestamp(item["t"] / 1000).date()
            rows.append({
                "ticker": ticker,
                "date": date,
                "open": item.get("o"),
                "high": item.get("h"),
                "low": item.get("l"),
                "close": item["c"],
                "volume": int(item["v"]) if item.get("v") is not None else None,
            })
        return rows
    except Exception as e:
        print(f"    Polygon error para {ticker}: {e}")
        return []


def upsert_prices(cur, rows: list[dict]):
    if not rows:
        return
    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO prices (ticker, date, open, high, low, close, volume)
        VALUES %s
        ON CONFLICT (ticker, date) DO UPDATE SET
            open   = EXCLUDED.open,
            high   = EXCLUDED.high,
            low    = EXCLUDED.low,
            close  = EXCLUDED.close,
            volume = EXCLUDED.volume
        """,
        [(r["ticker"], r["date"], r["open"], r["high"], r["low"], r["close"], r["volume"]) for r in rows],
        template="(%s, %s, %s, %s, %s, %s, %s)",
    )


def main():
    conn = psycopg2.connect(DIRECT_URL)
    conn.autocommit = False

    with conn.cursor() as cur:
        companies = get_companies(cur)

    today = datetime.date.today()
    history_start = today - datetime.timedelta(days=HISTORY_YEARS * 365)
    total = len(companies)
    print(f"{total} empresas a processar. Histórico desde {history_start}.")

    errors = 0
    skipped = 0

    for i, company in enumerate(companies):
        ticker = company["ticker"]

        with conn.cursor() as cur:
            max_date = get_max_date(cur, ticker)

        if max_date and max_date >= today - datetime.timedelta(days=1):
            print(f"[{i+1}/{total}] {ticker} — já atualizado ({max_date}), skip")
            skipped += 1
            continue

        from_date = (max_date + datetime.timedelta(days=1)).isoformat() if max_date else history_start.isoformat()
        to_date = today.isoformat()

        print(f"[{i+1}/{total}] {ticker} {from_date} → {to_date}...", end=" ", flush=True)

        rows = fetch_polygon(ticker, from_date, to_date)
        if not rows:
            print("sem dados")
            errors += 1
            time.sleep(SLEEP_BETWEEN)
            continue

        try:
            with conn.cursor() as cur:
                upsert_prices(cur, rows)
                cur.execute(
                    'UPDATE companies SET "lastPriceUpdate" = NOW(), "updatedAt" = NOW() WHERE ticker = %s',
                    (ticker,),
                )
            conn.commit()
            print(f"{len(rows)} registos")
        except Exception as e:
            conn.rollback()
            print(f"ERRO DB: {e}")
            errors += 1

        time.sleep(SLEEP_BETWEEN)

    conn.close()
    processed = total - skipped - errors
    print(f"\nConcluído. {processed} atualizados, {skipped} já ok, {errors} erros.")


if __name__ == "__main__":
    main()
