const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

const end = '2016-09-24';
for (const tag of Object.keys(gaap)) {
    const lower = tag.toLowerCase();
    if (lower.includes('marketable') || lower.includes('shortterm') || lower.includes('securities')) {
        const node = gaap[tag];
        if (node && node.units && node.units.USD) {
            const matches = node.units.USD.filter(e => e.end === end && (!e.start)); // instantaneous
            if (matches.length > 0) {
                console.log(`${tag}: ${matches[0].val}`);
            }
        }
    }
}
