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
    console.log(`Company: ${pld.ticker}`);
    pld.fundamentals.forEach(f => {
      console.log(`${f.fiscalYear}: OCF=${f.operatingCashFlow}, CapEx=${f.capex}, FCF=${f.freeCashFlow}`);
    });
  } else {
    console.log('Company not found');
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
