import json

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

INSTANT_TAGS = {
    "longTermDebt": ["LongTermDebtNoncurrent", "LongTermDebt"],
    "longTermDebtCurrent": ["LongTermDebtCurrent"],
    "shortTermDebt": ["ShortTermBorrowings", "ShortTermDebt"],
    "commercialPaper": ["CommercialPaper"],
    "totalDebt": ["DebtLongtermAndShorttermCombinedAmount", "LongTermDebtAndCapitalLeaseObligations"],
}

inst = {}
for field, tags in INSTANT_TAGS.items():
    inst[field] = get_inst(tags)

print(inst)

total_debt = inst.get("totalDebt")
print(f"Initial total_debt = {total_debt}")
if total_debt is None:
    ltd_nc = inst.get("longTermDebt") or 0
    ltd_c = inst.get("longTermDebtCurrent") or 0
    st = inst.get("shortTermDebt") or inst.get("commercialPaper") or 0
    if ltd_nc > 0 or ltd_c > 0 or st > 0:
        total_debt = ltd_nc + ltd_c + st
print(f"Final total_debt = {total_debt}")
