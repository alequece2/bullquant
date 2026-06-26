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

  if (!msft) {
    console.log("MSFT not found");
    return;
  }

  console.log("MSFT Fundamentals:");
  for (const f of msft.fundamentals) {
    console.log(`FY${f.fiscalYear}: R&D=${f.researchAndDevelopment} | Rev=${f.revenue}`);
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
