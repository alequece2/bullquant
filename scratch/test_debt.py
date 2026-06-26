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

def best_for_period(entries, expected_end):
    matches = [e for e in entries if e.get("end") == expected_end]
    if not matches: return None
    matches.sort(key=lambda e: e.get("filed") or "", reverse=True)
    return matches[0].get("val")

end = "2024-09-28"

def get_inst(tags):
    for tag in tags:
        entries = extract_tag_entries(us_gaap, tag)
        val = best_for_period(entries, end)
        if val is not None:
            return val
    return None

longTermDebt = get_inst(["LongTermDebtNoncurrent", "LongTermDebt"])
longTermDebtCurrent = get_inst(["LongTermDebtCurrent"])
shortTermDebt = get_inst(["ShortTermBorrowings", "ShortTermDebt"])
commercialPaper = get_inst(["CommercialPaper"])

print(f"LTD: {longTermDebt}")
print(f"LTDC: {longTermDebtCurrent}")
print(f"ST: {shortTermDebt}")
print(f"CP: {commercialPaper}")

