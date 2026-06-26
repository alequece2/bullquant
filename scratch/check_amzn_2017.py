import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import fetch_edgar_facts

facts_json = fetch_edgar_facts("0001018724") # AMZN CIK
us_gaap = facts_json.get("facts", {}).get("us-gaap", {})

def print_tag_for_year(tag, target_year):
    if tag not in us_gaap: return
    for entry in us_gaap[tag].get("units", {}).get("USD", []):
        if entry.get("fy") == target_year and entry.get("fp") == "FY":
            print(f"{tag}: {entry.get('val')}")

print("2017 Data:")
for tag in us_gaap.keys():
    print_tag_for_year(tag, 2017)
