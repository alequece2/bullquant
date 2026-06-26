"""
ingest_fundamentals.py — Ingere fundamentais históricos (10 anos) via SEC EDGAR XBRL.
Cron semanal (domingo 3h UTC): python scripts/ingest_fundamentals.py

https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json
User-Agent obrigatório pelo SEC; ≤10 req/s → sleep 0.2s entre empresas.

Cada registo = 1 período fiscal (QUARTERLY ou ANNUAL).
Métricas derivadas (FCF, margens, ROIC, ROE) calculadas e guardadas.
"""

import os
import sys
import time
import datetime
import uuid
import requests
import psycopg2
from dotenv import load_dotenv

ROOT = os.path.join(os.path.dirname(__file__), "..")

if os.environ.get("GITHUB_ACTIONS") == "true":
    pass
else:
    ENV_FILE = os.path.join(ROOT, ".env.dev")
    if not os.path.exists(ENV_FILE):
        sys.exit(
            "ERRO: ficheiro .env.dev não encontrado.\n"
            "Cria um projeto Supabase de DEV e preenche .env.dev com as suas credenciais.\n"
            "NUNCA uses .env.local — estes scripts só correm contra a BD de desenvolvimento."
        )
    load_dotenv(ENV_FILE)

DIRECT_URL = os.getenv("DIRECT_URL")
if not DIRECT_URL:
    sys.exit("DIRECT_URL não definida")

EDGAR_BASE = "https://data.sec.gov/api/xbrl/companyfacts"
EDGAR_HEADERS = {"User-Agent": "BullQuant admin@bullocracy.com"}
SLEEP_BETWEEN = 0.2
HISTORY_YEARS = 10

# ── Tags XBRL com fallbacks (ordem = prioridade) ─────────────────────────────

DURATION_TAGS = {
    "revenue": [
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "Revenues",
        "SalesRevenueNet",
        "RevenueFromContractWithCustomerIncludingAssessedTax",
        "SalesRevenueGoodsNet",
    ],
    "costOfRevenue": [
        "CostOfRevenue",
        "CostOfGoodsAndServicesSold",
        "CostOfGoodsSold",
        "CostOfServices",
    ],
    "grossProfit": ["GrossProfit"],
    "operatingExpenses": ["OperatingExpenses"],
    "operatingIncome": ["OperatingIncomeLoss"],
    "interestExpense": ["InterestExpense", "InterestAndDebtExpense", "InterestExpenseDebt"],
    "taxExpense": ["IncomeTaxExpenseBenefit"],
    "netIncome": [
        "NetIncomeLoss",
        "ProfitLoss",
        "NetIncomeLossAvailableToCommonStockholdersBasic",
    ],
    "epsDiluted": ["EarningsPerShareDiluted"],
    "sharesOutstandingDur": [
        "WeightedAverageNumberOfDilutedSharesOutstanding",
        "WeightedAverageNumberOfSharesOutstandingBasic",
    ],
    "operatingCashFlow": ["NetCashProvidedByUsedInOperatingActivities"],
    "capex": [
        "PaymentsToAcquirePropertyPlantAndEquipment",
        "PaymentsForCapitalImprovements",
        "PaymentsForLeasingCostsCommissionsAndTenantImprovements",
    ],
    "intangibles": [
        "PaymentsToAcquireIntangibleAssets",
        "PaymentsToDevelopSoftware",
    ],
    "dividendPerShare": [
        "CommonStockDividendsPerShareDeclared",
        "CommonStockDividendsPerShareCashPaid",
    ],
    "researchAndDevelopment": [
        "ResearchAndDevelopmentExpense",
        "ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost",
    ],
    "sellingGeneralAndAdmin": [
        "SellingGeneralAndAdministrativeExpense",
        "GeneralAndAdministrativeExpense",
    ],
    "ebitda": ["EarningsBeforeInterestTaxesDepreciationAndAmortization"],
}

INSTANT_TAGS = {
    "totalAssets": ["Assets"],
    "totalCurrentLiab": ["LiabilitiesCurrent"],
    "totalLiabilities": ["Liabilities"],
    "longTermDebt": ["LongTermDebtNoncurrent", "LongTermDebt"],
    "longTermDebtCurrent": ["LongTermDebtCurrent"],
    "shortTermDebt": ["ShortTermBorrowings", "ShortTermDebt"],
    "commercialPaper": ["CommercialPaper"],
    "totalDebt": ["DebtLongtermAndShorttermCombinedAmount", "LongTermDebtAndCapitalLeaseObligations"],
    "cash": [
        "CashAndCashEquivalentsAtCarryingValue",
        "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
        "Cash",
    ],
    "marketableSecuritiesCurrent": [
        "MarketableSecuritiesCurrent", 
        "AvailableForSaleSecuritiesDebtSecuritiesCurrent", 
        "AvailableForSaleSecuritiesCurrent",
        "AvailableForSaleSecurities",
        "ShortTermInvestments"
    ],
    "totalEquity": [
        "StockholdersEquity",
        "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
    ],
    "sharesOutstandingInst": ["CommonStockSharesOutstanding"],
}


def new_id() -> str:
    return uuid.uuid4().hex


def get_companies_with_cik(cur) -> list[dict]:
    cur.execute(
        'SELECT id, ticker, cik FROM companies WHERE "isActive" = TRUE AND cik IS NOT NULL ORDER BY ticker'
    )
    return [{"id": r[0], "ticker": r[1], "cik": r[2]} for r in cur.fetchall()]


def fetch_edgar_facts(cik: str) -> dict | None:
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
        return r.json()
    except Exception as e:
        print(f"    EDGAR error: {e}")
        return None


def extract_tag_entries(us_gaap: dict, tag: str) -> list[dict]:
    node = us_gaap.get(tag)
    if not node:
        return []
    for unit_entries in (node.get("units") or {}).values():
        if isinstance(unit_entries, list):
            return unit_entries
    return []


def is_annual_duration(e: dict) -> bool:
    if "start" not in e:
        return False
    days = (datetime.date.fromisoformat(e["end"]) - datetime.date.fromisoformat(e["start"])).days
    return 350 <= days <= 380


def is_quarterly_duration(e: dict) -> bool:
    if "start" not in e:
        return False
    days = (datetime.date.fromisoformat(e["end"]) - datetime.date.fromisoformat(e["start"])).days
    return 80 <= days <= 100


def best_for_period(entries: list[dict], expected_end: str) -> float | None:
    matches = [e for e in entries if e.get("end") == expected_end]
    if not matches:
        return None
    matches.sort(key=lambda e: e.get("filed") or "", reverse=True)
    return matches[0].get("val")


def extract_all_metrics(us_gaap: dict, periods: list[tuple], period_ends: dict) -> tuple[dict, dict]:
    """Extrai métricas duration e instant para todos os períodos.
    Devolve (dur_map, inst_map): {(fy, fp): {campo: val}}.
    """
    dur_map: dict = {p: {} for p in periods}
    inst_map: dict = {p: {} for p in periods}

    for field, tags in DURATION_TAGS.items():
        for (fy, fp) in periods:
            expected_end = period_ends.get((fy, fp))
            if not expected_end:
                continue
            for tag in tags:
                entries = extract_tag_entries(us_gaap, tag)
                if not entries:
                    continue
                pool = [e for e in entries if is_annual_duration(e)] if fp == "FY" else [e for e in entries if is_quarterly_duration(e)]
                val = best_for_period(pool, expected_end)
                if val is not None:
                    dur_map[(fy, fp)][field] = val
                    break

    for field, tags in INSTANT_TAGS.items():
        for (fy, fp) in periods:
            expected_end = period_ends.get((fy, fp))
            if not expected_end:
                continue
            for tag in tags:
                entries = extract_tag_entries(us_gaap, tag)
                if not entries:
                    continue
                val = best_for_period(entries, expected_end)
                if val is not None:
                    inst_map[(fy, fp)][field] = val
                    break

    return dur_map, inst_map


def safe_div(a, b):
    if a is None or b is None or b == 0:
        return None
    return round(a / b, 6)


def safe_clamp(v, lo, hi):
    if v is None:
        return None
    return max(lo, min(hi, v))


def get_period_info(us_gaap: dict, fy: int, fp: str) -> tuple[str | None, str | None]:
    """Devolve (period_end, filed_at) para um período."""
    for tag in ["Assets", "NetIncomeLoss", "Revenues", "StockholdersEquity"]:
        entries = extract_tag_entries(us_gaap, tag)
        matches = [e for e in entries if e.get("fy") == fy and e.get("fp") == fp]
        if matches:
            if tag in ["NetIncomeLoss", "Revenues"]:
                if fp == "FY":
                    matches = [e for e in matches if is_annual_duration(e)]
                else:
                    matches = [e for e in matches if is_quarterly_duration(e)]
            if not matches:
                continue
            matches.sort(key=lambda e: e.get("end") or "", reverse=True)
            period_end = matches[0].get("end")
            matches_for_end = [e for e in matches if e.get("end") == period_end]
            matches_for_end.sort(key=lambda e: e.get("filed") or "", reverse=True)
            return period_end, matches_for_end[0].get("filed")
    return None, None


def build_row(company_id: str, fy: int, fp: str, period_end: str, filed_at: str | None,
              dur: dict, inst: dict) -> dict:
    shares = dur.get("sharesOutstandingDur") or inst.get("sharesOutstandingInst")
    capex_raw = dur.get("capex")
    capex = abs(capex_raw) if capex_raw is not None else None
    op_cf = dur.get("operatingCashFlow")
    fcf = (op_cf - capex) if (op_cf is not None and capex is not None) else None

    revenue = dur.get("revenue")
    gross_profit = dur.get("grossProfit")
    op_income = dur.get("operatingIncome")
    net_income = dur.get("netIncome")
    tax_expense = dur.get("taxExpense")
    total_assets = inst.get("totalAssets")
    curr_liab = inst.get("totalCurrentLiab")
    
    total_debt = inst.get("totalDebt")
    if total_debt is None:
        ltd_nc = inst.get("longTermDebt") or 0
        ltd_c = inst.get("longTermDebtCurrent") or 0
        st = inst.get("shortTermDebt") or inst.get("commercialPaper") or 0
        if ltd_nc > 0 or ltd_c > 0 or st > 0:
            total_debt = ltd_nc + ltd_c + st

    cash = inst.get("cash")
    if cash is not None:
        marketable = inst.get("marketableSecuritiesCurrent") or 0
        cash = cash + marketable

    total_equity = inst.get("totalEquity")

    gross_margin = safe_div(gross_profit, revenue)
    op_margin = safe_div(op_income, revenue)
    net_margin = safe_div(net_income, revenue)

    roic = None
    if op_income is not None and total_assets is not None:
        if net_income is not None and tax_expense is not None:
            pre_tax = net_income + tax_expense
            tax_rate = safe_clamp(safe_div(tax_expense, pre_tax), 0, 0.5) or 0.21
        else:
            tax_rate = 0.21
        nopat = op_income * (1 - tax_rate)
        inv_cap = (total_assets or 0) - (curr_liab or 0) - (cash or 0)
        roic = safe_div(nopat, inv_cap) if inv_cap > 0 else None

    roe = safe_div(net_income, total_equity) if total_equity and total_equity > 0 else None

    if fp == "FY":
        period_type = "ANNUAL"
        fiscal_quarter = None
    else:
        period_type = "QUARTERLY"
        fiscal_quarter = int(fp[1]) if fp.startswith("Q") else None

    return {
        "id": new_id(),
        "companyId": company_id,
        "periodType": period_type,
        "fiscalYear": fy,
        "fiscalQuarter": fiscal_quarter,
        "periodEnd": period_end,
        "filedAt": filed_at,
        "revenue": revenue,
        "costOfRevenue": dur.get("costOfRevenue"),
        "grossProfit": gross_profit,
        "operatingExpenses": dur.get("operatingExpenses"),
        "operatingIncome": op_income,
        "interestExpense": dur.get("interestExpense"),
        "taxExpense": tax_expense,
        "netIncome": net_income,
        "epsDiluted": dur.get("epsDiluted"),
        "sharesOutstanding": shares,
        "operatingCashFlow": op_cf,
        "capex": capex,
        "freeCashFlow": fcf,
        "totalAssets": total_assets,
        "totalCurrentLiab": curr_liab,
        "longTermDebt": inst.get("longTermDebt"),
        "totalDebt": total_debt,
        "cash": cash,
        "totalEquity": total_equity,
        "grossMargin": gross_margin,
        "operatingMargin": op_margin,
        "netMargin": net_margin,
        "roic": roic,
        "returnOnEquity": roe,
        "dividendPerShare": dur.get("dividendPerShare"),
        "researchAndDevelopment": dur.get("researchAndDevelopment"),
        "sellingGeneralAndAdmin": dur.get("sellingGeneralAndAdmin"),
        "ebitda": dur.get("ebitda"),
    }


def delete_period(cur, company_id: str, period_type: str, fy: int, fq):
    if fq is None:
        cur.execute(
            """DELETE FROM fundamentals WHERE "companyId" = %s AND "periodType" = %s::"period_type"
               AND "fiscalYear" = %s AND "fiscalQuarter" IS NULL""",
            (company_id, period_type, fy),
        )
    else:
        cur.execute(
            """DELETE FROM fundamentals WHERE "companyId" = %s AND "periodType" = %s::"period_type"
               AND "fiscalYear" = %s AND "fiscalQuarter" = %s""",
            (company_id, period_type, fy, fq),
        )


def insert_fundamental(cur, row: dict):
    cur.execute(
        """
        INSERT INTO fundamentals (
            id, "companyId", "periodType", "fiscalYear", "fiscalQuarter",
            "periodEnd", "filedAt",
            revenue, "costOfRevenue", "grossProfit", "operatingExpenses",
            "operatingIncome", "interestExpense", "taxExpense",
            "netIncome", "epsDiluted", "sharesOutstanding",
            "operatingCashFlow", capex, "freeCashFlow",
            "totalAssets", "totalCurrentLiab", "longTermDebt", "totalDebt",
            cash, "totalEquity",
            "grossMargin", "operatingMargin", "netMargin", roic, "returnOnEquity",
            "dividendPerShare", "researchAndDevelopment", "sellingGeneralAndAdmin", ebitda,
            "createdAt", "updatedAt"
        ) VALUES (
            %(id)s, %(companyId)s, %(periodType)s::"period_type", %(fiscalYear)s, %(fiscalQuarter)s,
            %(periodEnd)s, %(filedAt)s,
            %(revenue)s, %(costOfRevenue)s, %(grossProfit)s, %(operatingExpenses)s,
            %(operatingIncome)s, %(interestExpense)s, %(taxExpense)s,
            %(netIncome)s, %(epsDiluted)s, %(sharesOutstanding)s,
            %(operatingCashFlow)s, %(capex)s, %(freeCashFlow)s,
            %(totalAssets)s, %(totalCurrentLiab)s, %(longTermDebt)s, %(totalDebt)s,
            %(cash)s, %(totalEquity)s,
            %(grossMargin)s, %(operatingMargin)s, %(netMargin)s, %(roic)s, %(returnOnEquity)s,
            %(dividendPerShare)s, %(researchAndDevelopment)s, %(sellingGeneralAndAdmin)s, %(ebitda)s,
            NOW(), NOW()
        )
        """,
        row,
    )


def process_company(conn, company: dict) -> int:
    company_id = company["id"]
    cik = company["cik"]

    facts_json = fetch_edgar_facts(cik)
    if not facts_json:
        return 0

    us_gaap = (facts_json.get("facts") or {}).get("us-gaap") or {}
    if not us_gaap:
        return 0

    min_fy = datetime.date.today().year - HISTORY_YEARS
    periods: set = set()

    # Descobrir todos os (fy, fp) disponíveis nos últimos 10 anos
    for sample_tags in [["NetIncomeLoss", "Assets", "Revenues"]]:
        for tag in sample_tags:
            for e in extract_tag_entries(us_gaap, tag):
                fy = e.get("fy")
                fp = e.get("fp")
                if fy and fp and fy >= min_fy and fp in ("FY", "Q1", "Q2", "Q3", "Q4"):
                    periods.add((fy, fp))

    if not periods:
        return 0

    periods_list = sorted(periods)
    
    period_ends = {}
    period_filed = {}
    for (fy, fp) in periods_list:
        p_end, p_filed = get_period_info(us_gaap, fy, fp)
        period_ends[(fy, fp)] = p_end
        period_filed[(fy, fp)] = p_filed

    dur_map, inst_map = extract_all_metrics(us_gaap, periods_list, period_ends)

    inserted = 0
    for (fy, fp) in periods_list:
        period_end = period_ends.get((fy, fp))
        filed_at = period_filed.get((fy, fp))
        if not period_end:
            continue

        dur = dur_map.get((fy, fp)) or {}
        inst = inst_map.get((fy, fp)) or {}
        if not dur and not inst:
            continue

        row = build_row(company_id, fy, fp, period_end, filed_at, dur, inst)

        try:
            with conn.cursor() as cur:
                delete_period(cur, company_id, row["periodType"], fy, row["fiscalQuarter"])
                insert_fundamental(cur, row)
            conn.commit()
            inserted += 1
        except Exception as e:
            conn.rollback()
            print(f"    DB error {fy}/{fp}: {e}")

    try:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE companies SET "lastFundamentalsUpdate" = NOW(), "updatedAt" = NOW() WHERE id = %s',
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
    print(f"\nConcluído. {total_periods} períodos inseridos. {errors} erros.")


if __name__ == "__main__":
    main()
