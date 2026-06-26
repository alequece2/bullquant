import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import fetch_edgar_facts

facts_json = fetch_edgar_facts("0000789019")
us_gaap = facts_json.get("facts", {}).get("us-gaap", {})

for tag in us_gaap.keys():
    if "depreciation" in tag.lower() or "amortization" in tag.lower():
        print(tag)
