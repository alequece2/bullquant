import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const msft = await prisma.company.findUnique({
    where: { ticker: 'MSFT' },
    include: {
      fundamentals: {
        where: { periodType: 'ANNUAL' },
        orderBy: { fiscalYear: 'asc' }
      }
    }
  });

  if (msft) {
    console.log("MSFT Segments:");
    for (const f of msft.fundamentals) {
      console.log(`FY${f.fiscalYear}: ${JSON.stringify(f.revenueSegments)}`);
    }
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
