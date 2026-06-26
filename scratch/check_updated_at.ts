import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const q4s = await prisma.fundamental.findMany({
    where: { periodType: 'QUARTERLY', fiscalQuarter: 4 },
    take: 5
  });

  for (const f of q4s) {
    console.log(`FY${f.fiscalYear} Q4: createdAt=${f.createdAt.toISOString()} updatedAt=${f.updatedAt.toISOString()}`);
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
