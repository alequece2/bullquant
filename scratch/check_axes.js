const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

const tag = "Revenues";
const node = gaap[tag];
if (node && node.units && node.units.USD) {
    const entries = node.units.USD.filter(e => e.end === '2018-09-29' && !e.axis);
    const withAxis = node.units.USD.filter(e => e.end === '2018-09-29' && e.axis);
    
    console.log("Without axis (Consolidated):", entries.length, "entries");
    entries.forEach(e => console.log(e.val));
    
    console.log("With axis (Segments):", withAxis.length, "entries");
    // withAxis.forEach(e => console.log(e.val, e.axis));
}
