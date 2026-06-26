const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

const tag = "Assets";
const node = gaap[tag];
if (node && node.units && node.units.USD) {
    const entries = node.units.USD.filter(e => e.fy === 2018 && e.fp === "FY");
    console.log(`Found ${entries.length} entries for Assets FY2018:`);
    entries.forEach(e => console.log(e.end, e.val));
}
