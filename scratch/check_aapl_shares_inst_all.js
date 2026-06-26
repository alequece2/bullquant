const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const dei = data.facts['dei'] || {};
const gaap = data.facts['us-gaap'] || {};

function listShares() {
    const node = dei["EntityCommonStockSharesOutstanding"];
    if (node && node.units && node.units.shares) {
        console.log(`\nAll EntityCommonStockSharesOutstanding:`);
        const matches = node.units.shares.filter(e => e.end.startsWith('2018') || e.end.startsWith('2019'));
        matches.forEach(e => console.log(`  end: ${e.end}, filed: ${e.filed}, val: ${e.val}, frame: ${e.frame || 'none'}`));
    }
}

listShares();
