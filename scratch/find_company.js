import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const funds = await prisma.fundamental.findMany({
    where: { 
      fiscalYear: 2018, 
      periodType: 'ANNUAL'
    },
    select: {
      revenue: true,
      company: { select: { ticker: true } }
    }
  })
  
  const target1 = funds.filter(f => f.revenue && f.revenue.toNumber() >= 55000000000 && f.revenue.toNumber() <= 56000000000)
  const target2 = funds.filter(f => f.revenue && f.revenue.toNumber() >= 27000000000 && f.revenue.toNumber() <= 28000000000)
  
  console.log("Found companies around 55B:", target1)
  console.log("Found companies around 27B:", target2)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
