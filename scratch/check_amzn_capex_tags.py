import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import fetch_edgar_facts

facts_json = fetch_edgar_facts("0001018724") # AMZN CIK
us_gaap = facts_json.get("facts", {}).get("us-gaap", {})

for tag in us_gaap.keys():
    if "paymentstoacquire" in tag.lower() or "propertyplantandequipment" in tag.lower():
        print(tag)
