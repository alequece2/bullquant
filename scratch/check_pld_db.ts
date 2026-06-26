import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const pld = await prisma.company.findUnique({
    where: { ticker: 'PLD' },
    include: {
      fundamentals: {
        where: { periodType: 'ANNUAL' },
        orderBy: { fiscalYear: 'asc' }
      }
    }
  });

  if (pld) {
    pld.fundamentals.forEach(f => {
      console.log(`FY${f.fiscalYear}: capex=${f.capex}, fcf=${f.freeCashFlow}, updated=${f.updatedAt.toISOString()}`);
    });
  }
}

main().finally(() => prisma.$disconnect());
