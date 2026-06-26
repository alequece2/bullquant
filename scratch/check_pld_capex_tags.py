import requests

headers = {"User-Agent": "BullQuant admin@bullocracy.com"}
url = "https://data.sec.gov/api/xbrl/companyfacts/CIK0001045609.json"
r = requests.get(url, headers=headers)
gaap = r.json().get('facts', {}).get('us-gaap', {})

def extract_tag_entries(us_gaap, tag):
    node = us_gaap.get(tag)
    if not node: return []
    for unit_entries in (node.get("units") or {}).values():
        if isinstance(unit_entries, list): return unit_entries
    return []

entries = extract_tag_entries(gaap, "PaymentsForLeasingCostsCommissionsAndTenantImprovements")
import datetime
def is_annual_duration(e):
    if "start" not in e: return False
    days = (datetime.date.fromisoformat(e["end"]) - datetime.date.fromisoformat(e["start"])).days
    return 350 <= days <= 380

pool = [e for e in entries if is_annual_duration(e)]
print(f"Pool size: {len(pool)}")
matches = [e for e in pool if e.get("end") == "2025-12-31"]
print(f"Matches for 2025-12-31: {len(matches)}")
if matches:
    print(matches)

