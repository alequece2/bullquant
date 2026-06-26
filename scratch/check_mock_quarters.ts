import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const msft = await prisma.company.findUnique({
    where: { ticker: 'MSFT' },
    include: {
      fundamentals: {
        where: { periodType: 'QUARTERLY' },
        orderBy: [{ fiscalYear: 'asc' }, { fiscalQuarter: 'asc' }]
      }
    }
  });

  if (msft) {
    console.log("MSFT Quarters:");
    for (const f of msft.fundamentals) {
      console.log(`FY${f.fiscalYear} Q${f.fiscalQuarter}: R&D=${f.researchAndDevelopment} | Rev=${f.revenue}`);
    }
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
