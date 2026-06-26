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

  console.log("AAPL Shares Outstanding:")
  for (const f of aapl.fundamentals) {
    console.log(`FY${f.fiscalYear}: ${f.sharesOutstanding}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
