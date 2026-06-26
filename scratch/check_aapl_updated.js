import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const aapl = await prisma.company.findUnique({
    where: { ticker: 'AAPL' },
    include: {
      fundamentals: {
        where: { periodType: 'ANNUAL' },
        orderBy: { fiscalYear: 'asc' }
      }
    }
  })

  console.log("AAPL Revenues updated:")
  for (const f of aapl.fundamentals) {
    console.log(`FY${f.fiscalYear}: $${f.revenue} (updated: ${f.updatedAt})`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
