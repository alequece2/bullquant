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

def get_period_info(us_gaap, fy, fp):
    for tag in ["Assets", "NetIncomeLoss", "Revenues", "StockholdersEquity"]:
        entries = extract_tag_entries(us_gaap, tag)
        matches = [e for e in entries if e.get("fy") == fy and e.get("fp") == fp]
        if matches:
            if tag in ["NetIncomeLoss", "Revenues"]:
                if fp == "FY":
                    matches = [e for e in matches if is_annual_duration(e)]
            if not matches: continue
            matches.sort(key=lambda e: e.get("end") or "", reverse=True)
            period_end = matches[0].get("end")
            return period_end
    return None

print(get_period_info(us_gaap, 2018, "FY"))
