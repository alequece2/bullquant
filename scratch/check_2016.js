const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

function checkTag(tag, end) {
    const node = gaap[tag];
    if (node && node.units && node.units.USD) {
        const matches = node.units.USD.filter(e => e.end === end);
        if (matches.length > 0) {
            matches.sort((a, b) => b.filed.localeCompare(a.filed));
            console.log(`${tag}: ${matches[0].val}`);
        } else {
            console.log(`${tag}: null`);
        }
    } else {
        console.log(`${tag}: NOT FOUND`);
    }
}

const end = '2016-09-24';
console.log(`Checking AAPL for ${end}:\n`);

checkTag("CashAndCashEquivalentsAtCarryingValue", end);
checkTag("MarketableSecuritiesCurrent", end);
checkTag("AvailableForSaleSecuritiesDebtSecuritiesCurrent", end);
checkTag("ShortTermInvestments", end);

console.log("\nDebt Tags:");
checkTag("LongTermDebtNoncurrent", end);
checkTag("LongTermDebt", end);
checkTag("LongTermDebtCurrent", end);
checkTag("ShortTermBorrowings", end);
checkTag("ShortTermDebt", end);
checkTag("CommercialPaper", end);
checkTag("DebtLongtermAndShorttermCombinedAmount", end);
checkTag("LongTermDebtAndCapitalLeaseObligations", end);

