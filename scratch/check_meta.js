const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/meta.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

for (const [tag, node] of Object.entries(gaap)) {
  if (node && node.units && node.units.USD) {
    const matching = node.units.USD.filter(e => e.val === 27638000000 || e.val === 55838000000);
    if (matching.length > 0) {
      console.log(`Tag ${tag}:`, matching);
    }
  }
}
