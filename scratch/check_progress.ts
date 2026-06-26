import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentCompanies = await prisma.company.findMany({
    where: {
      lastFundamentalsUpdate: {
        gte: oneHourAgo
      }
    },
    orderBy: {
      lastFundamentalsUpdate: 'desc'
    },
    select: {
      ticker: true,
      lastFundamentalsUpdate: true
    }
  });

  console.log(`\nTotal processed in the last hour: ${recentCompanies.length}`);
  
  if (recentCompanies.length > 0) {
    console.log('\nLast 15 companies processed:');
    recentCompanies.slice(0, 15).forEach(c => {
      console.log(`- ${c.ticker} (at ${c.lastFundamentalsUpdate.toISOString()})`);
    });
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
