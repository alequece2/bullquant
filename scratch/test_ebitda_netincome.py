import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import fetch_edgar_facts, extract_tag_entries, is_annual_duration, best_for_period

def test_formula(cik, name):
    facts_json = fetch_edgar_facts(cik)
    us_gaap = facts_json.get("facts", {}).get("us-gaap", {})

    tags_da = ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization", "Depreciation"]
    tags_ni = ["NetIncomeLoss", "ProfitLoss"]
    tags_tax = ["IncomeTaxExpenseBenefit"]
    tags_int = ["InterestExpense", "InterestExpenseDebt"]
    tags_op = ["OperatingIncomeLoss"]

    def get_val(tags, year):
        expected_end = f"{year}-12-31" if cik != "0000320193" else f"{year}-09-30" # AAPL ends in Sep
        for tag in tags:
            entries = extract_tag_entries(us_gaap, tag)
            if not entries: continue
            pool = [e for e in entries if is_annual_duration(e)]
            val = best_for_period(pool, expected_end)
            if val is not None: return val
        return 0

    print(f"--- {name} ---")
    for year in [2017, 2022, 2023]:
        ni = get_val(tags_ni, year)
        tax = get_val(tags_tax, year)
        interest = get_val(tags_int, year)
        da = get_val(tags_da, year)
        op = get_val(tags_op, year)

        ebitda_ni = ni + tax + interest + da
        ebitda_op = op + da
        print(f"{year}: Op+DA={ebitda_op} | NI+Tax+Int+DA={ebitda_ni}")

test_formula("0001018724", "AMZN")
test_formula("0000320193", "AAPL")
test_formula("0000078901", "MSFT")
