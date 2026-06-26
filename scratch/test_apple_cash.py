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

end = "2016-09-24"

marketable_tags = [
    "MarketableSecuritiesCurrent", 
    "AvailableForSaleSecuritiesDebtSecuritiesCurrent", 
    "AvailableForSaleSecuritiesCurrent",
    "AvailableForSaleSecurities",
    "ShortTermInvestments"
]

marketable = None
for tag in marketable_tags:
    entries = extract_tag_entries(us_gaap, tag)
    if not entries:
        print(f"No entries for {tag}")
        continue
    val = best_for_period(entries, end)
    print(f"Val for {tag}: {val}")
    if val is not None:
        marketable = val
        break

print(f"Final marketable: {marketable}")
