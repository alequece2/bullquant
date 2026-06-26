import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const funds = await prisma.fundamental.findMany({
    where: { 
      company: { ticker: { in: ['AAPL', 'AMZN'] } },
      periodType: 'ANNUAL',
      fiscalYear: { in: [2022, 2023, 2024] }
    },
    orderBy: [
      { company: { ticker: 'asc' } },
      { fiscalYear: 'asc' }
    ]
  });

  for (const f of funds) {
    console.log(`${f.companyId} FY${f.fiscalYear}: ROIC=${f.roic ? (f.roic * 100).toFixed(2) + '%' : 'null'}`);
  }
}

main().finally(() => prisma.$disconnect());
