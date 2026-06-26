import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import fetch_edgar_facts

# Check AAPL, AMZN, MSFT for any tag containing 'ebitda'
for cik in ["0001018724", "0000320193", "0000078901"]:
    facts_json = fetch_edgar_facts(cik)
    facts = facts_json.get("facts", {})
    found = False
    
    # Check all namespaces (us-gaap, dei, custom, etc.)
    for namespace, tags in facts.items():
        for tag_name in tags.keys():
            if "ebitda" in tag_name.lower():
                print(f"{cik} ({namespace}): {tag_name}")
                found = True
                
    if not found:
        print(f"{cik}: NO EBITDA TAG FOUND IN ANY NAMESPACE")
