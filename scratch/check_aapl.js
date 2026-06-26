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

  console.log("AAPL Revenues:")
  for (const f of aapl.fundamentals) {
    console.log(`FY${f.fiscalYear}: ${f.revenue ? "$" + f.revenue : "null"}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
