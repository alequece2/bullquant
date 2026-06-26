import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import fetch_edgar_facts

facts_json = fetch_edgar_facts("0001018724") # AMZN CIK
us_gaap = facts_json.get("facts", {}).get("us-gaap", {})

for tag, data in us_gaap.items():
    entries = data.get("units", {}).get("USD", [])
    for e in entries:
        if e.get("fy") == 2017 and e.get("fp") == "FY" and e.get("val") == 11955000000:
            print(tag)
