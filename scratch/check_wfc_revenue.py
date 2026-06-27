import sys
import os
import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import fetch_edgar_facts

def main():
    # WFC CIK: 0000072971
    facts_json = fetch_edgar_facts("0000072971")
    us_gaap = facts_json.get("facts", {}).get("us-gaap", {})
    
    # Let's find tags that contain 'Revenue' or 'Income'
    tags = list(us_gaap.keys())
    rev_tags = [t for t in tags if 'Revenue' in t or 'Income' in t]
    print(f"Possible Revenue tags for WFC: {rev_tags[:20]}")

if __name__ == "__main__":
    main()
