const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.dev' });
const prisma = new PrismaClient();

async function run() {
  const companies = await prisma.company.findMany({ select: { ticker: true }, where: { isActive: true } });
  console.log(`Fetching prices for ${companies.length} companies...`);
  
  const results = [];
  const date = new Date();
  date.setHours(0,0,0,0);
  const apiKey = process.env.FINNHUB_API_KEY;
  
  // Finnhub allows 60 req / min -> 1 req per sec.
  for (let i = 0; i < companies.length; i++) {
    const ticker = companies[i].ticker;
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
      const data = await res.json();
      
      if (data && data.c) {
        results.push({
          ticker: ticker,
          date: date,
          open: data.o || data.c,
          high: data.h || data.c,
          low: data.l || data.c,
          close: data.c,
          volume: 0
        });
      }
    } catch (e) {}
    
    process.stdout.write(`\rFetched ${i + 1} / ${companies.length} - Found: ${results.length}`);
    await new Promise(r => setTimeout(r, 1050)); // 1.05 sec delay -> ~ 8.5 minutes total.
  }
  
  console.log(`\nUpserting ${results.length} valid prices to database...`);
  
  for (let i = 0; i < results.length; i += 100) {
    const chunk = results.slice(i, i + 100);
    await prisma.price.createMany({
      data: chunk,
      skipDuplicates: true
    });
  }
  
  console.log('All real prices saved successfully!');
  process.exit(0);
}
run();
