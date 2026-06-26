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

  console.log("AAPL FCFs:")
  for (const f of aapl.fundamentals) {
    console.log(`FY${f.fiscalYear}: FCF=${f.freeCashFlow} (OpCF=${f.operatingCashFlow}, Capex=${f.capex}) | End: ${f.periodEnd} | Updated: ${f.updatedAt}`)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
