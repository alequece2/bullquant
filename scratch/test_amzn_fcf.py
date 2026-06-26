import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from scripts.ingest_fundamentals import fetch_edgar_facts, extract_tag_entries, get_period_info, build_row

def main():
    facts_json = fetch_edgar_facts("0000320193")
    us_gaap = facts_json.get("facts", {}).get("us-gaap", {})
    
    for fy in range(2016, 2026):
        period_end, filed_at = get_period_info(us_gaap, fy, "FY")
        if not period_end:
            continue
        
        # Manually extract dur values
        dur = {}
        for tag in ["NetCashProvidedByUsedInOperatingActivities"]:
            entries = extract_tag_entries(us_gaap, tag)
            matches = [e for e in entries if e.get("end") == period_end]
            if matches:
                dur["operatingCashFlow"] = matches[0].get("val")

        capex_tags = [
            "PaymentsToAcquirePropertyPlantAndEquipment",
            "PaymentsToAcquireProductiveAssets",
            "PaymentsForProceedsFromProductiveAssets",
            "PaymentsForCapitalImprovements",
            "PaymentsForLeasingCostsCommissionsAndTenantImprovements",
        ]
        
        capex_val = None
        for tag in capex_tags:
            entries = extract_tag_entries(us_gaap, tag)
            matches = [e for e in entries if e.get("end") == period_end]
            if matches:
                capex_val = matches[0].get("val")
                break
        
        dur["capex"] = capex_val
        
        row = build_row("fake", fy, "FY", period_end, filed_at, dur, {})
        print(f"{fy}: OCF={row.get('operatingCashFlow')}, CapEx={row.get('capex')}, FCF={row.get('freeCashFlow')}")

if __name__ == "__main__":
    main()
