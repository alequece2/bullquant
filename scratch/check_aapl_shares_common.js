const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

function checkShares(expectedEnd) {
    console.log(`\nChecking CommonStockSharesOutstanding for end = ${expectedEnd}`);
    const node = gaap["CommonStockSharesOutstanding"];
    if (node && node.units && node.units.shares) {
        const matches = node.units.shares.filter(e => e.end === expectedEnd);
        matches.sort((a, b) => b.filed.localeCompare(a.filed));
        if (matches.length > 0) {
            console.log(`latest filed is ${matches[0].filed} with value ${matches[0].val}`);
            matches.forEach(e => console.log(`  filed: ${e.filed}, val: ${e.val}, frame: ${e.frame || 'none'}`));
        } else {
            console.log(`No matches for end = ${expectedEnd}`);
        }
    }
}

checkShares('2018-09-29');
