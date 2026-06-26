import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const pld = await prisma.company.findUnique({
    where: { ticker: 'PLD' },
    include: {
      fundamentals: {
        where: { periodType: 'ANNUAL', fiscalYear: 2025 }
      }
    }
  });

  if (pld && pld.fundamentals.length > 0) {
    const f = pld.fundamentals[0];
    console.log(`PLD FY2025 Net Income: ${f.netIncome}`);
  } else {
    console.log('No data found for PLD FY2025');
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
