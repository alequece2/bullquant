const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

function checkTag(tag, end) {
    const node = gaap[tag];
    if (node && node.units && node.units.USD) {
        for (const e of node.units.USD) {
            if (e.end === end && (!e.start || (new Date(e.end) - new Date(e.start)) > 300 * 24 * 3600 * 1000)) {
                console.log(`${tag}: ${e.val}`);
            }
        }
    }
}

const end2016 = '2016-09-24';
checkTag('SellingGeneralAndAdministrativeExpense', end2016);
checkTag('ResearchAndDevelopmentExpense', end2016);
checkTag('PaymentsToAcquirePropertyPlantAndEquipment', end2016);
checkTag('PaymentsToAcquireIntangibleAssets', end2016);
