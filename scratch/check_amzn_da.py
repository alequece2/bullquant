import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import fetch_edgar_facts, extract_tag_entries, is_annual_duration, best_for_period

facts_json = fetch_edgar_facts("00000320193") # Wait, this is AAPL. Let me use Amazon's CIK.
