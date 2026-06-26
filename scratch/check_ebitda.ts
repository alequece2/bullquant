import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const total = await prisma.fundamental.count();
  const withEbitda = await prisma.fundamental.count({
    where: { ebitda: { not: null } }
  });
  console.log(`Total fundamentals: ${total}`);
  console.log(`Fundamentals with EBITDA: ${withEbitda}`);
}

main().finally(() => prisma.$disconnect());
