import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const c = await prisma.company.findUnique({where: {ticker: 'MSFT'}});
  console.log(c);
}
main().finally(() => prisma.$disconnect());
