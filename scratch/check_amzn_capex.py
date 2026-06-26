import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import fetch_edgar_facts

facts_json = fetch_edgar_facts("0001018724") # AMZN CIK
us_gaap = facts_json.get("facts", {}).get("us-gaap", {})

tag = "PaymentsToAcquirePropertyPlantAndEquipment"
entries = us_gaap.get(tag, {}).get("units", {}).get("USD", [])
for e in entries:
    if e.get("fp") == "FY" and e.get("fy") >= 2016:
        print(f"{e.get('fy')}: {e.get('val')}")
