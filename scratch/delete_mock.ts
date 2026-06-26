import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Deleting mock fundamentals (fiscalYear < 2016)...')
  const result = await prisma.fundamental.deleteMany({
    where: {
      fiscalYear: {
        lt: 2016
      }
    }
  })
  console.log(`Deleted ${result.count} mock records.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
