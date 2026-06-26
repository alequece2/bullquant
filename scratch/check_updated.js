import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const updated = await prisma.fundamental.findMany({
    where: {
      updatedAt: { gte: new Date('2026-06-26T16:09:00Z') }
    },
    select: { company: { select: { ticker: true } } },
    distinct: ['companyId']
  })
  const tickers = updated.map(u => u.company.ticker).sort()
  console.log("Updated tickers:", tickers)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
