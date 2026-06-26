import json
import datetime

with open('scratch/aapl.json') as f:
    data = json.load(f)

us_gaap = data.get("facts", {}).get("us-gaap", {})

def extract_tag_entries(us_gaap, tag):
    node = us_gaap.get(tag)
    if not node: return []
    for unit_entries in (node.get("units") or {}).values():
        if isinstance(unit_entries, list):
            return unit_entries
    return []

def is_annual_duration(e):
    if "start" not in e: return False
    days = (datetime.date.fromisoformat(e["end"]) - datetime.date.fromisoformat(e["start"])).days
    return 350 <= days <= 380

def best_for_period(entries: list, expected_end: str):
    matches = [e for e in entries if e.get("end") == expected_end]
    if not matches:
        return None
    matches.sort(key=lambda e: e.get("filed") or "", reverse=True)
    return matches[0].get("val")

for tag in ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet", "SalesRevenueServicesNet", "RevenuesNetOfInterestExpense"]:
    entries = extract_tag_entries(us_gaap, tag)
    pool = [e for e in entries if is_annual_duration(e)]
    val = best_for_period(pool, "2018-09-29")
    print(f"Tag {tag}: {val}")
