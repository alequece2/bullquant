import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import fetch_edgar_facts, extract_tag_entries, is_annual_duration, best_for_period

def test_ebitda(ticker, cik):
    print(f"--- {ticker} ---")
    facts_json = fetch_edgar_facts(cik)
    us_gaap = facts_json.get("facts", {}).get("us-gaap", {})
    
    tags_da = [
        "DepreciationDepletionAndAmortization",
        "DepreciationAndAmortization",
        "Depreciation"
    ]
    
    tags_op_inc = [
        "OperatingIncomeLoss"
    ]
    
    for year in [2022, 2023, 2024]:
        expected_end = f"{year}-09-30" if ticker == "AAPL" else f"{year}-12-31"
        
        # Op Income
        op_inc = None
        for tag in tags_op_inc:
            entries = extract_tag_entries(us_gaap, tag)
            if not entries: continue
            pool = [e for e in entries if is_annual_duration(e)]
            val = best_for_period(pool, expected_end)
            if val is not None:
                op_inc = val
                break
                
        # D&A
        da = None
        for tag in tags_da:
            entries = extract_tag_entries(us_gaap, tag)
            if not entries: continue
            pool = [e for e in entries if is_annual_duration(e)]
            val = best_for_period(pool, expected_end)
            if val is not None:
                da = val
                break
                
        print(f"{year}: OpInc={op_inc}, D&A={da}, EBITDA={((op_inc or 0) + (da or 0)) if op_inc is not None else None}")

test_ebitda("AAPL", "0000320193")
test_ebitda("MSFT", "0000078901")
