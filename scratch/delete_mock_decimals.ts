import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const allFundamentals = await prisma.fundamental.findMany({
    select: { id: true, revenue: true }
  });

  let mockIds = [];
  for (const f of allFundamentals) {
    if (f.revenue && f.revenue % 1 !== 0) {
      mockIds.push(f.id);
    }
  }

  console.log(`Found ${mockIds.length} mock records based on decimal revenue.`);

  if (mockIds.length > 0) {
    const res = await prisma.fundamental.deleteMany({
      where: { id: { in: mockIds } }
    });
    console.log(`Deleted ${res.count} mock records.`);
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
