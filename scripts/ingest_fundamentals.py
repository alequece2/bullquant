"""
ingest_fundamentals.py — Ingere fundamentais históricos (10 anos) via SEC EDGAR XBRL.
Cron semanal (domingo 3h UTC): python scripts/ingest_fundamentals.py

Fontes:
  https://data.sec.gov/api/xbrl/companyfacts/{CIK}.json
  User-Agent obrigatório: ≤10 req/s → sleep 0.2s entre empresas.

Cada registo em fundamentals = 1 período fiscal (QUARTERLY ou ANNUAL).
Métricas derivadas (FCF, margens, ROIC, ROE) calculadas aqui e guardadas.
"""

import os
import sys
import time
import datetime
import uuid
import requests
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

ROOT = os.path.join(os.path.dirname(__file__), "..")
load_dotenv(os.path.join(ROOT, ".env.local"))

DIRECT_URL = os.getenv("DIRECT_URL")
if not DIRECT_URL:
    sys.exit("DIRECT_URL não definida no .env.local")

EDGAR_BASE = "https://data.sec.gov/api/xbrl/companyfacts"
# User-Agent obrigatório pelo SEC (formato: "Nome email@dominio.com")
EDGAR_HEADERS = {"User-Agent": "BullQuant admin@bullocracy.com"}
SLEEP_BETWEEN = 0.2   # segundos entre empresas (≤10 req/s)
HISTORY_YEARS = 10

# ── Mapeamento de tags EDGAR → campos do schema ──────────────────────────────
# Para cada campo, lista de tags XBRL a tentar por ordem (primeiro match ganha).
# Itens "duration" têm start+end; itens "instant" só têm end.

DURATION_TAGS = {
    "revenue": [
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "Revenues",
        "SalesRevenueNet",
        "RevenueFromContractWithCustomerIncludingAssessedTax",
        "SalesRevenueGoodsNet",
    ],
    "cost_of_revenue": [
        "CostOfRevenue",
        "CostOfGoodsAndServicesSold",
        "CostOfGoodsSold",
        "CostOfServices",
    ],
    "gross_profit": ["GrossProfit"],
    "operating_expenses": ["OperatingExpenses"],
    "operating_income": ["OperatingIncomeLoss"],
    "interest_expense": ["InterestExpense", "InterestAndDebtExpense", "InterestExpenseDebt"],
    "tax_expense": ["IncomeTaxExpenseBenefit"],
    "net_income": [
        "NetIncomeLoss",
        "ProfitLoss",
        "NetIncomeLossAvailableToCommonStockholdersBasic",
    ],
    "eps_diluted": ["EarningsPerShareDiluted"],
    "shares_outstanding_dur": [
        "WeightedAverageNumberOfDilutedSharesOutstanding",
        "WeightedAverageNumberOfSharesOutstandingBasic",
    ],
    "operating_cash_flow": ["NetCashProvidedByUsedInOperatingActivities"],
    "capex": [
        "PaymentsToAcquirePropertyPlantAndEquipment",
        "PaymentsForCapitalImprovements",
    ],
    "dividend_per_share": [
        "CommonStockDividendsPerShareDeclared",
        "CommonStockDividendsPerShareCashPaid",
    ],
}

INSTANT_TAGS = {
    "total_assets": ["Assets"],
    "total_current_liab": ["LiabilitiesCurrent"],
    "long_term_debt": ["LongTermDebt", "LongTermDebtNoncurrent"],
    "total_debt": ["DebtLongtermAndShorttermCombinedAmount", "LongTermDebtAndCapitalLeaseObligations"],
    "cash": [
        "CashAndCashEquivalentsAtCarryingValue",
        "CashCashEquivalentsAndShortTermInvestments",
        "Cash",
    ],
    "total_equity": [
        "StockholdersEquity",
        "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
    ],
    "shares_outstanding_inst": ["CommonStockSharesOutstanding"],
}


def new_id() -> str:
    return uuid.uuid4().hex


def get_companies_with_cik(cur) -> list[dict]:
    cur.execute(
        """
        SELECT id, ticker, cik
        FROM companies
        WHERE is_active = TRUE AND cik IS NOT NULL
        ORDER BY ticker
        """
    )
    return [{"id": r[0], "ticker": r[1], "cik": r[2]} for r in cur.fetchall()]


def fetch_edgar_facts(cik: str) -> dict | None:
    """Busca o JSON de companyfacts do SEC EDGAR para um CIK."""
    padded = cik.zfill(10)
    url = f"{EDGAR_BASE}/CIK{padded}.json"
    try:
        r = requests.get(url, headers=EDGAR_HEADERS, timeout=30)
        if r.status_code == 404:
            return None
        if r.status_code == 429:
            print("    429 rate limit — a aguardar 60s...")
            time.sleep(60)
            r = requests.get(url, headers=EDGAR_HEADERS, timeout=30)
            r.raise_for_status()
        else:
            r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"    EDGAR error: {e}")
        return None


def extract_tag(us_gaap: dict, tag: str) -> list[dict]:
    """Devolve os entries de um tag XBRL, ou [] se não existir."""
    node = us_gaap.get(tag)
    if not node:
        return []
    units = node.get("units") or {}
    # Suporta USD, shares, USD/shares
    for unit_entries in units.values():
        if isinstance(unit_entries, list):
            return unit_entries
    return []


def is_annual_duration(entry: dict) -> bool:
    """True se o entry cobre ≈ 1 ano (350-380 dias)."""
    if "start" not in entry:
        return False
    start = datetime.date.fromisoformat(entry["start"])
    end = datetime.date.fromisoformat(entry["end"])
    days = (end - start).days
    return 350 <= days <= 380


def is_quarterly_duration(entry: dict) -> bool:
    """True se o entry cobre ≈ 1 trimestre (80-100 dias)."""
    if "start" not in entry:
        return False
    start = datetime.date.fromisoformat(entry["start"])
    end = datetime.date.fromisoformat(entry["end"])
    days = (end - start).days
    return 80 <= days <= 100


def best_value_for_period(entries: list[dict], fy: int, fp: str, is_instant: bool) -> tuple[float | None, str | None]:
    """
    De todos os entries para um período (fy, fp), devolve o valor da
    filing mais recente e a data de filed.
    """
    matches = [e for e in entries if e.get("fy") == fy and e.get("fp") == fp]
    if not matches:
        return None, None
    # Ordenar por data de filing mais recente
    matches.sort(key=lambda e: e.get("filed") or "", reverse=True)
    best = matches[0]
    return best.get("val"), best.get("filed")


def extract_metric_map(us_gaap: dict, tags_dict: dict, periods: list[tuple], is_instant: bool) -> dict:
    """
    Para cada campo e lista de tags XBRL, tenta extrair o valor para cada período.
    periods = lista de (fy, fp).
    Devolve dict: {(fy, fp): {campo: valor}}.
    """
    result = {p: {} for p in periods}

    for field, tags in tags_dict.items():
        for tag in tags:
            entries = extract_tag(us_gaap, tag)
            if not entries:
                continue
            # Filtrar por período adequado
            if not is_instant:
                annual_entries = [e for e in entries if is_annual_duration(e)]
                quarterly_entries = [e for e in entries if is_quarterly_duration(e)]
                filtered = {"FY": annual_entries, "Q": quarterly_entries}
            else:
                filtered = {"all": entries}

            found_any = False
            for (fy, fp) in periods:
                key = "FY" if fp == "FY" else ("Q" if not is_instant else "all")
                pool = filtered.get(key) or filtered.get("all") or entries
                val, _ = best_value_for_period(pool, fy, fp, is_instant)
                if val is not None and field not in result[(fy, fp)]:
                    result[(fy, fp)][field] = val
                    found_any = True

            if found_any:
                break  # Este tag resolveu o campo — não tentar o próximo

    return result


def safe_div(a, b):
    if a is None or b is None or b == 0:
        return None
    return round(a / b, 6)


def safe_clamp(val, lo, hi):
    if val is None:
        return None
    return max(lo, min(hi, val))


def build_fundamental_row(company_id: str, fy: int, fp: str, period_end: str,
                          filed_at: str | None, dur: dict, inst: dict) -> dict:
    """Constrói o dicionário para inserção na tabela fundamentals."""

    # Selecionar shares_outstanding: preferir instant, fallback para duration
    shares = inst.get("shares_outstanding_inst") or dur.get("shares_outstanding_dur")

    # Capex sempre positivo — EDGAR pode devolver negativo para "Payments"
    capex_raw = dur.get("capex")
    capex = abs(capex_raw) if capex_raw is not None else None

    op_cf = dur.get("operating_cash_flow")
    fcf = (op_cf - capex) if (op_cf is not None and capex is not None) else None

    revenue = dur.get("revenue")
    gross_profit = dur.get("gross_profit")
    op_income = dur.get("operating_income")
    net_income = dur.get("net_income")
    tax_expense = dur.get("tax_expense")
    total_assets = inst.get("total_assets")
    curr_liab = inst.get("total_current_liab")
    cash = inst.get("cash")
    total_equity = inst.get("total_equity")

    # Margens
    gross_margin = safe_div(gross_profit, revenue)
    op_margin = safe_div(op_income, revenue)
    net_margin = safe_div(net_income, revenue)

    # ROIC = NOPAT / Invested Capital
    # NOPAT = Operating Income × (1 − tax_rate)
    # Invested Capital = Total Assets − Current Liabilities − Cash
    roic = None
    if op_income is not None and total_assets is not None:
        # Tax rate aproximada
        if net_income is not None and tax_expense is not None:
            pre_tax = net_income + tax_expense
            tax_rate = safe_clamp(safe_div(tax_expense, pre_tax), 0, 0.5) or 0.21
        else:
            tax_rate = 0.21
        nopat = op_income * (1 - tax_rate)
        invested_capital = (total_assets or 0) - (curr_liab or 0) - (cash or 0)
        roic = safe_div(nopat, invested_capital) if invested_capital > 0 else None

    # ROE
    roe = safe_div(net_income, total_equity) if total_equity and total_equity > 0 else None

    # Tipo de período
    if fp == "FY":
        period_type = "ANNUAL"
        fiscal_quarter = None
    else:
        period_type = "QUARTERLY"
        fiscal_quarter = int(fp[1]) if fp.startswith("Q") else None

    return {
        "id": new_id(),
        "company_id": company_id,
        "period_type": period_type,
        "fiscal_year": fy,
        "fiscal_quarter": fiscal_quarter,
        "period_end": period_end,
        "filed_at": filed_at,
        "revenue": dur.get("revenue"),
        "cost_of_revenue": dur.get("cost_of_revenue"),
        "gross_profit": gross_profit,
        "operating_expenses": dur.get("operating_expenses"),
        "operating_income": op_income,
        "interest_expense": dur.get("interest_expense"),
        "tax_expense": tax_expense,
        "net_income": net_income,
        "eps_diluted": dur.get("eps_diluted"),
        "shares_outstanding": shares,
        "operating_cash_flow": op_cf,
        "capex": capex,
        "free_cash_flow": fcf,
        "total_assets": total_assets,
        "total_current_liab": curr_liab,
        "long_term_debt": inst.get("long_term_debt"),
        "total_debt": inst.get("total_debt"),
        "cash": cash,
        "total_equity": total_equity,
        "gross_margin": gross_margin,
        "operating_margin": op_margin,
        "net_margin": net_margin,
        "roic": roic,
        "return_on_equity": roe,
        "dividend_per_share": dur.get("dividend_per_share"),
    }


def get_filed_at_for_period(us_gaap: dict, fy: int, fp: str) -> str | None:
    """Tenta inferir a data de filed a partir de qualquer tag do período."""
    for tag in ["NetIncomeLoss", "Revenues", "Assets"]:
        entries = extract_tag(us_gaap, tag)
        matches = [e for e in entries if e.get("fy") == fy and e.get("fp") == fp]
        if matches:
            matches.sort(key=lambda e: e.get("filed") or "", reverse=True)
            return matches[0].get("filed")
    return None


def get_period_end_for_period(us_gaap: dict, fy: int, fp: str) -> str | None:
    for tag in ["Assets", "NetIncomeLoss", "Revenues", "StockholdersEquity"]:
        entries = extract_tag(us_gaap, tag)
        matches = [e for e in entries if e.get("fy") == fy and e.get("fp") == fp]
        if matches:
            matches.sort(key=lambda e: e.get("filed") or "", reverse=True)
            return matches[0].get("end")
    return None


def delete_existing_period(cur, company_id: str, period_type: str, fy: int, fq):
    """Apaga registo existente para o mesmo período (NULL-safe)."""
    if fq is None:
        cur.execute(
            """
            DELETE FROM fundamentals
            WHERE company_id = %s
              AND period_type = %s::period_type
              AND fiscal_year = %s
              AND fiscal_quarter IS NULL
            """,
            (company_id, period_type, fy),
        )
    else:
        cur.execute(
            """
            DELETE FROM fundamentals
            WHERE company_id = %s
              AND period_type = %s::period_type
              AND fiscal_year = %s
              AND fiscal_quarter = %s
            """,
            (company_id, period_type, fy, fq),
        )


def insert_fundamental(cur, row: dict):
    cur.execute(
        """
        INSERT INTO fundamentals (
            id, company_id, period_type, fiscal_year, fiscal_quarter,
            period_end, filed_at,
            revenue, cost_of_revenue, gross_profit, operating_expenses,
            operating_income, interest_expense, tax_expense,
            net_income, eps_diluted, shares_outstanding,
            operating_cash_flow, capex, free_cash_flow,
            total_assets, total_current_liab, long_term_debt, total_debt,
            cash, total_equity,
            gross_margin, operating_margin, net_margin, roic, return_on_equity,
            dividend_per_share,
            created_at, updated_at
        ) VALUES (
            %(id)s, %(company_id)s, %(period_type)s::period_type, %(fiscal_year)s, %(fiscal_quarter)s,
            %(period_end)s, %(filed_at)s,
            %(revenue)s, %(cost_of_revenue)s, %(gross_profit)s, %(operating_expenses)s,
            %(operating_income)s, %(interest_expense)s, %(tax_expense)s,
            %(net_income)s, %(eps_diluted)s, %(shares_outstanding)s,
            %(operating_cash_flow)s, %(capex)s, %(free_cash_flow)s,
            %(total_assets)s, %(total_current_liab)s, %(long_term_debt)s, %(total_debt)s,
            %(cash)s, %(total_equity)s,
            %(gross_margin)s, %(operating_margin)s, %(net_margin)s, %(roic)s, %(return_on_equity)s,
            %(dividend_per_share)s,
            NOW(), NOW()
        )
        """,
        row,
    )


def process_company(conn, company: dict) -> int:
    """Processa uma empresa. Devolve o número de períodos inseridos."""
    ticker = company["ticker"]
    company_id = company["id"]
    cik = company["cik"]

    facts_json = fetch_edgar_facts(cik)
    if not facts_json:
        return 0

    us_gaap = (facts_json.get("facts") or {}).get("us-gaap") or {}
    if not us_gaap:
        return 0

    # Descobrir todos os períodos disponíveis nos últimos HISTORY_YEARS anos
    min_fy = datetime.date.today().year - HISTORY_YEARS
    periods = set()

    for tag in list(DURATION_TAGS.values())[0] + list(INSTANT_TAGS.values())[0]:
        entries = extract_tag(us_gaap, tag)
        for e in entries:
            fy = e.get("fy")
            fp = e.get("fp")
            if fy and fp and fy >= min_fy and fp in ("FY", "Q1", "Q2", "Q3", "Q4"):
                periods.add((fy, fp))

    if not periods:
        return 0

    periods = sorted(periods)

    # Extrair métricas para todos os períodos
    dur_map = extract_metric_map(us_gaap, DURATION_TAGS, periods, is_instant=False)
    inst_map = extract_metric_map(us_gaap, INSTANT_TAGS, periods, is_instant=True)

    inserted = 0
    for (fy, fp) in periods:
        period_end = get_period_end_for_period(us_gaap, fy, fp)
        if not period_end:
            continue
        filed_at = get_filed_at_for_period(us_gaap, fy, fp)

        dur = dur_map.get((fy, fp)) or {}
        inst = inst_map.get((fy, fp)) or {}

        # Ignorar períodos completamente vazios
        if not dur and not inst:
            continue

        row = build_fundamental_row(company_id, fy, fp, period_end, filed_at, dur, inst)

        try:
            with conn.cursor() as cur:
                delete_existing_period(cur, company_id, row["period_type"], fy, row["fiscal_quarter"])
                insert_fundamental(cur, row)
            conn.commit()
            inserted += 1
        except Exception as e:
            conn.rollback()
            print(f"    DB error em {ticker} {fy}/{fp}: {e}")

    # Atualizar timestamp na empresa
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE companies SET last_fundamentals_update = NOW(), updated_at = NOW() WHERE id = %s",
                (company_id,),
            )
        conn.commit()
    except Exception:
        conn.rollback()

    return inserted


def main():
    conn = psycopg2.connect(DIRECT_URL)
    conn.autocommit = False

    with conn.cursor() as cur:
        companies = get_companies_with_cik(cur)

    total = len(companies)
    print(f"{total} empresas com CIK a processar.")

    total_periods = 0
    errors = 0

    for i, company in enumerate(companies):
        ticker = company["ticker"]
        print(f"[{i+1}/{total}] {ticker}...", end=" ", flush=True)

        try:
            n = process_company(conn, company)
            print(f"{n} períodos")
            total_periods += n
        except Exception as e:
            print(f"ERRO: {e}")
            errors += 1

        time.sleep(SLEEP_BETWEEN)

    conn.close()
    print(f"\nConcluído. {total_periods} períodos inseridos. {errors} erros de empresa.")


if __name__ == "__main__":
    main()
