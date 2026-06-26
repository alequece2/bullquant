const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

function checkTag(tag, end) {
    const node = gaap[tag];
    if (node && node.units && node.units.USD) {
        const matches = node.units.USD.filter(e => e.end === end && (!e.start)); // instantaneous
        if (matches.length > 0) {
            matches.sort((a, b) => b.filed.localeCompare(a.filed));
            console.log(`${tag}: filed=${matches[0].filed}, val=${matches[0].val}`);
        } else {
            console.log(`${tag}: no match`);
        }
    }
}

console.log("2016:");
checkTag("CashAndCashEquivalentsAtCarryingValue", "2016-09-24");
checkTag("AvailableForSaleSecuritiesCurrent", "2016-09-24");

console.log("\n2017:");
checkTag("CashAndCashEquivalentsAtCarryingValue", "2017-09-30");
checkTag("AvailableForSaleSecuritiesCurrent", "2017-09-30");
