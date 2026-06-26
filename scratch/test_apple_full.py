import sys
sys.path.append('.')
from scripts.ingest_fundamentals import extract_all_metrics, build_row
import json

with open('scratch/aapl.json') as f:
    facts = json.load(f).get("facts", {})

periods = [(2016, "FY"), (2017, "FY")]
period_ends = {(2016, "FY"): "2016-09-24", (2017, "FY"): "2017-09-30"}

dur_map, inst_map = extract_all_metrics(facts, periods, period_ends)

print("2016:")
print("Cash:", inst_map[(2016, "FY")].get("cash"))
print("Marketable:", inst_map[(2016, "FY")].get("marketableSecuritiesCurrent"))
row_2016 = build_row("aapl", 2016, "FY", "2016-09-24", None, dur_map[(2016, "FY")], inst_map[(2016, "FY")])
print("Final Cash 2016:", row_2016["cash"])
print("Final Debt 2016:", row_2016["totalDebt"])

print("\n2017:")
print("Cash:", inst_map[(2017, "FY")].get("cash"))
print("Marketable:", inst_map[(2017, "FY")].get("marketableSecuritiesCurrent"))
row_2017 = build_row("aapl", 2017, "FY", "2017-09-30", None, dur_map[(2017, "FY")], inst_map[(2017, "FY")])
print("Final Cash 2017:", row_2017["cash"])
print("Final Debt 2017:", row_2017["totalDebt"])
