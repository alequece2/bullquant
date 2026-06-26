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

def is_quarterly_duration(e):
    if "start" not in e: return False
    days = (datetime.date.fromisoformat(e["end"]) - datetime.date.fromisoformat(e["start"])).days
    return 80 <= days <= 100

def get_period_info(us_gaap, fy, fp):
    for tag in ["Assets", "NetIncomeLoss", "Revenues", "StockholdersEquity"]:
        entries = extract_tag_entries(us_gaap, tag)
        matches = [e for e in entries if e.get("fy") == fy and e.get("fp") == fp]
        if matches:
            if tag in ["NetIncomeLoss", "Revenues"]:
                if fp == "FY":
                    matches = [e for e in matches if is_annual_duration(e)]
                else:
                    matches = [e for e in matches if is_quarterly_duration(e)]
            if not matches: continue
            matches.sort(key=lambda e: e.get("end") or "", reverse=True)
            period_end = matches[0].get("end")
            matches_for_end = [e for e in matches if e.get("end") == period_end]
            matches_for_end.sort(key=lambda e: e.get("filed") or "", reverse=True)
            return period_end, matches_for_end[0].get("filed")
    return None, None

def best_for_period(entries, expected_end):
    matches = [e for e in entries if e.get("end") == expected_end]
    if not matches: return None
    matches.sort(key=lambda e: e.get("filed") or "", reverse=True)
    return matches[0].get("val")

for year in [2016, 2017, 2018]:
    end_date, filed = get_period_info(us_gaap, year, "FY")
    print(f"FY {year}: end_date={end_date}, filed={filed}")
    
    entries = extract_tag_entries(us_gaap, "SalesRevenueNet") + extract_tag_entries(us_gaap, "Revenues")
    annuals = [e for e in entries if is_annual_duration(e)]
    val = best_for_period(annuals, end_date)
    print(f"Revenue for {year} = {val}")

