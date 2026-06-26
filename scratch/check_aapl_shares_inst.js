const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['dei'] || {};

function checkShares(expectedEnd) {
    console.log(`\nChecking shares for end = ${expectedEnd}`);
    for (const tag of ["EntityCommonStockSharesOutstanding", "CommonStockSharesOutstanding"]) {
        const node = gaap[tag];
        if (node && node.units && node.units.shares) {
            const matches = node.units.shares.filter(e => e.end === expectedEnd);
            matches.sort((a, b) => b.filed.localeCompare(a.filed));
            if (matches.length > 0) {
                console.log(`Tag ${tag}: latest filed is ${matches[0].filed} with value ${matches[0].val}`);
                console.log(`All entries for this end date:`);
                matches.forEach(e => console.log(`  filed: ${e.filed}, val: ${e.val}, frame: ${e.frame || 'none'}`));
            }
        }
    }
}

checkShares('2018-10-26');
checkShares('2019-10-18');
