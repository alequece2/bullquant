import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const amzn = await prisma.company.findUnique({ where: { ticker: 'AMZN' } })
  if (!amzn) {
    console.log("No AMZN")
    return
  }

  const funds = await prisma.fundamental.findMany({
    where: { companyId: amzn.id, periodType: 'ANNUAL' },
    orderBy: { periodEnd: 'asc' }
  })

  for (const f of funds) {
    console.log(`${f.periodEnd}: OCF=${f.operatingCashFlow}, CapEx=${f.capex}, FCF=${f.freeCashFlow}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
