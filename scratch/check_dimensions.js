const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

const tag = "SalesRevenueNet" // or any other
const node = gaap[tag];
if (node && node.units && node.units.USD) {
    const entries = node.units.USD;
    // Find all entries for FY=2018
    const fy2018 = entries.filter(e => e.fy === 2018 && e.fp === "FY");
    console.log(`Found ${fy2018.length} entries for 2018 FY:`, fy2018);
}
const revenues = gaap["Revenues"];
if (revenues && revenues.units && revenues.units.USD) {
    const fy2018 = revenues.units.USD.filter(e => e.fy === 2018 && e.fp === "FY");
    console.log(`Found ${fy2018.length} entries for Revenues 2018 FY:`);
    console.log(fy2018);
}
