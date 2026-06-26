const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/aapl.json', 'utf8'));
const gaap = data.facts['us-gaap'] || {};

function getVal(tag, end) {
    const node = gaap[tag];
    if (node && node.units && node.units.USD) {
        const matches = node.units.USD.filter(e => e.end === end);
        if (matches.length === 0) return 0;
        matches.sort((a, b) => b.filed.localeCompare(a.filed));
        return matches[0].val;
    }
    return 0;
}

const end = "2024-09-28";
const ltd = getVal("LongTermDebtNoncurrent", end) || getVal("LongTermDebt", end);
const ltdc = getVal("LongTermDebtCurrent", end);
const cp = getVal("CommercialPaper", end);

console.log(`2024 Debt for AAPL:`);
console.log(`LTD: ${ltd}`);
console.log(`LTD Current: ${ltdc}`);
console.log(`CP: ${cp}`);
console.log(`Total: ${ltd + ltdc + cp}`);

const cash = getVal("CashAndCashEquivalentsAtCarryingValue", end);
const restrictedCash = getVal("RestrictedCashAndCashEquivalentsAtCarryingValue", end);
const marketableCurrent = getVal("MarketableSecuritiesCurrent", end);
const marketableNoncurrent = getVal("MarketableSecuritiesNoncurrent", end);

console.log(`\n2024 Cash for AAPL:`);
console.log(`Cash & Eq: ${cash}`);
console.log(`Marketable Current: ${marketableCurrent}`);
console.log(`Marketable Noncurrent: ${marketableNoncurrent}`);
console.log(`Total Cash & ST Investments: ${cash + marketableCurrent}`);
