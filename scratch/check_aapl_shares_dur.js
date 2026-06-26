const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

function checkShares(expectedEnd) {
    console.log(`\nChecking shares for end = ${expectedEnd}`);
    for (const tag of ["WeightedAverageNumberOfDilutedSharesOutstanding", "WeightedAverageNumberOfSharesOutstandingBasic"]) {
        const node = gaap[tag];
        if (node && node.units && node.units.shares) {
            const matches = node.units.shares.filter(e => {
                if (e.end !== expectedEnd) return false;
                if (!e.start) return false;
                const d1 = new Date(e.start);
                const d2 = new Date(e.end);
                const days = (d2 - d1) / (1000 * 60 * 60 * 24);
                return days >= 350 && days <= 380;
            });
            matches.sort((a, b) => b.filed.localeCompare(a.filed));
            if (matches.length > 0) {
                console.log(`Tag ${tag}: latest filed is ${matches[0].filed} with value ${matches[0].val}`);
            } else {
                console.log(`Tag ${tag}: No annual duration matches`);
            }
        }
    }
}

checkShares('2018-09-29');
