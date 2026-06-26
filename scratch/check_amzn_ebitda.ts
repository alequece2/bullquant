import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const amzn = await prisma.company.findUnique({
    where: { ticker: 'AMZN' },
    include: {
      fundamentals: {
        where: { periodType: 'ANNUAL' },
        orderBy: { fiscalYear: 'asc' }
      }
    }
  });

  if (amzn) {
    console.log(`AMZN last updated at: ${amzn.lastFundamentalsUpdate}`);
    for (const f of amzn.fundamentals) {
      console.log(`FY${f.fiscalYear}: ebitda=${f.ebitda}, opIncome=${f.operatingIncome}`);
    }
  } else {
    console.log("AMZN not found");
  }
}

main().finally(() => prisma.$disconnect());
