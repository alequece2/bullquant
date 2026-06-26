const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const aapl = await prisma.company.findUnique({
    where: { ticker: 'AAPL' },
    include: {
      fundamentals: {
        where: { periodType: 'ANNUAL' },
        orderBy: { fiscalYear: 'asc' }
      }
    }
  });

  if (!aapl) {
    console.log("AAPL not found");
    return;
  }

  console.log("AAPL Expenses:");
  for (const f of aapl.fundamentals) {
    console.log(`FY${f.fiscalYear}: R&D=${f.researchAndDevelopment} | SG&A=${f.sellingGeneralAndAdmin} | CapEx=${f.capex}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
