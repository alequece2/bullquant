import requests

headers = {"User-Agent": "BullQuant admin@bullocracy.com"}
url = "https://data.sec.gov/api/xbrl/companyfacts/CIK0001045609.json" # PLD CIK is 1045609
r = requests.get(url, headers=headers)
gaap = r.json().get('facts', {}).get('us-gaap', {})

def search_net_income(gaap):
    for tag in gaap.keys():
        if "NetIncome" in tag or "ProfitLoss" in tag:
            units = gaap[tag].get("units", {}).get("USD", [])
            for e in units:
                if e.get("fy") == 2025 and e.get("fp") == "FY" and e.get("frame") == "CY2025":
                    print(f"{tag}: {e.get('val')}")

search_net_income(gaap)
