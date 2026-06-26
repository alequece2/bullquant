import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const fundamentals = await prisma.fundamental.findMany({
    where: { 
      company: { ticker: { in: ['AAPL', 'MSFT', 'PLD'] } },
      periodType: 'ANNUAL'
    },
    orderBy: [
      { company: { ticker: 'asc' } },
      { fiscalYear: 'asc' }
    ]
  });

  for (const f of fundamentals) {
    console.log(`FY${f.fiscalYear} ${f.companyId}: ebitda=${f.ebitda}, opIncome=${f.operatingIncome}`);
  }
}

main().finally(() => prisma.$disconnect());
