"""
seed_companies.py — Popula a tabela companies com as 500 empresas do S&P 500.
Corre uma vez manualmente: python scripts/seed_companies.py

Fontes:
  - Lista S&P 500: Wikipedia (pandas.read_html) — ticker, nome, sector, industry, CIK
  - Dados adicionais: Finnhub /stock/profile2 — logo, website, description, employees
"""

import os
import sys
import time
import uuid
import requests
import psycopg2
import pandas as pd
from dotenv import load_dotenv

# Carrega variáveis do .env.local (raiz do projeto)
ROOT = os.path.join(os.path.dirname(__file__), "..")
load_dotenv(os.path.join(ROOT, ".env.local"))

DIRECT_URL = os.getenv("DIRECT_URL")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")

if not DIRECT_URL:
    sys.exit("DIRECT_URL não definida no .env.local")
if not FINNHUB_API_KEY:
    sys.exit("FINNHUB_API_KEY não definida no .env.local")


def new_id() -> str:
    return uuid.uuid4().hex


def fetch_sp500_from_wikipedia() -> pd.DataFrame:
    """Devolve DataFrame com colunas: ticker, name, sector, industry, cik."""
    print("A obter lista S&P 500 da Wikipedia...")
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    tables = pd.read_html(url, header=0)
    df = tables[0]

    # A tabela da Wikipedia pode mudar de nome nas colunas — normalizar
    df.columns = [c.strip() for c in df.columns]

    col_map = {
        "Symbol": "ticker",
        "Security": "name",
        "GICS Sector": "sector",
        "GICS Sub-Industry": "industry",
        "CIK": "cik",
    }
    df = df.rename(columns=col_map)

    keep = [c for c in ["ticker", "name", "sector", "industry", "cik"] if c in df.columns]
    df = df[keep].copy()

    # Normalizar ticker (BRK.B → BRK-B para Finnhub; guardar o original para EDGAR)
    df["ticker"] = df["ticker"].str.strip()

    # CIK pode estar em formato int ou string; normalizar para string zero-padded
    if "cik" in df.columns:
        df["cik"] = df["cik"].apply(
            lambda x: str(int(x)).zfill(10) if pd.notna(x) and str(x).strip() != "" else None
        )
    else:
        df["cik"] = None

    print(f"  {len(df)} empresas encontradas na Wikipedia.")
    return df


def fetch_finnhub_profile(ticker: str) -> dict:
    """Chama Finnhub e devolve logo, website, description, employees, exchange."""
    # Finnhub usa '-' para BRK.B → BRK-B
    symbol = ticker.replace(".", "-")
    url = f"https://finnhub.io/api/v1/stock/profile2?symbol={symbol}&token={FINNHUB_API_KEY}"
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        return {
            "logo_url": data.get("logo") or None,
            "website": data.get("weburl") or None,
            "description": None,  # Finnhub free não devolve description
            "employees": None,    # Finnhub free não devolve employees
            "exchange": data.get("exchange") or "NYSE",
            "currency": data.get("currency") or "USD",
            "country": data.get("country") or "US",
        }
    except Exception as e:
        print(f"    Finnhub error para {ticker}: {e}")
        return {}


def upsert_company(cur, company: dict):
    cur.execute(
        """
        INSERT INTO companies (
            id, ticker, name, cik, exchange, sector, industry,
            country, currency, logo_url, website, description, employees,
            is_active, created_at, updated_at
        ) VALUES (
            %(id)s, %(ticker)s, %(name)s, %(cik)s, %(exchange)s, %(sector)s, %(industry)s,
            %(country)s, %(currency)s, %(logo_url)s, %(website)s, %(description)s, %(employees)s,
            TRUE, NOW(), NOW()
        )
        ON CONFLICT (ticker) DO UPDATE SET
            name        = EXCLUDED.name,
            cik         = COALESCE(EXCLUDED.cik, companies.cik),
            exchange    = EXCLUDED.exchange,
            sector      = COALESCE(EXCLUDED.sector, companies.sector),
            industry    = COALESCE(EXCLUDED.industry, companies.industry),
            logo_url    = COALESCE(EXCLUDED.logo_url, companies.logo_url),
            website     = COALESCE(EXCLUDED.website, companies.website),
            description = COALESCE(EXCLUDED.description, companies.description),
            employees   = COALESCE(EXCLUDED.employees, companies.employees),
            updated_at  = NOW()
        """,
        company,
    )


def main():
    df = fetch_sp500_from_wikipedia()
    conn = psycopg2.connect(DIRECT_URL)
    conn.autocommit = False

    total = len(df)
    errors = 0

    for i, row in df.iterrows():
        ticker = row["ticker"]
        print(f"[{i+1}/{total}] {ticker}...", end=" ", flush=True)

        profile = fetch_finnhub_profile(ticker)

        company = {
            "id": new_id(),
            "ticker": ticker,
            "name": row.get("name", ticker),
            "cik": row.get("cik") or None,
            "exchange": profile.get("exchange") or "NYSE",
            "sector": row.get("sector") or None,
            "industry": row.get("industry") or None,
            "country": profile.get("country") or "US",
            "currency": profile.get("currency") or "USD",
            "logo_url": profile.get("logo_url") or None,
            "website": profile.get("website") or None,
            "description": profile.get("description") or None,
            "employees": profile.get("employees") or None,
        }

        try:
            with conn.cursor() as cur:
                upsert_company(cur, company)
            conn.commit()
            print("ok")
        except Exception as e:
            conn.rollback()
            print(f"ERRO: {e}")
            errors += 1

        # Finnhub free tier: 60 req/min → 1s de intervalo é suficiente
        time.sleep(1)

    conn.close()
    print(f"\nConcluído. {total - errors}/{total} empresas inseridas/atualizadas. {errors} erros.")


if __name__ == "__main__":
    main()
