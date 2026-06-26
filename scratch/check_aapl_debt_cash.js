const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

function checkTags(keywords) {
    console.log(`\nSearching tags containing: ${keywords.join(' or ')}`);
    for (const tag of Object.keys(gaap)) {
        const lower = tag.toLowerCase();
        if (keywords.some(k => lower.includes(k))) {
            const node = gaap[tag];
            if (node && node.units && node.units.USD) {
                const annuals = node.units.USD.filter(e => e.fp === "FY" || e.frame && e.frame.startsWith("CY"));
                if (annuals.length > 0) {
                    console.log(`Tag: ${tag} (${annuals.length} entries)`);
                }
            }
        }
    }
}

checkTags(['debt', 'borrowing', 'commercialpaper', 'notespayable']);
checkTags(['cash', 'marketablesecurities']);
