import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  const companies = [
    {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      cik: '0000320193',
      exchange: 'NASDAQ',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      country: 'US',
      currency: 'USD',
      logoUrl: 'https://logo.clearbit.com/apple.com',
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
      website: 'https://www.apple.com',
      employees: 161000,
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      cik: '0000789019',
      exchange: 'NASDAQ',
      sector: 'Technology',
      industry: 'Software - Infrastructure',
      country: 'US',
      currency: 'USD',
      logoUrl: 'https://logo.clearbit.com/microsoft.com',
      description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
      website: 'https://www.microsoft.com',
      employees: 221000,
    }
  ]

  for (const company of companies) {
    const created = await prisma.company.upsert({
      where: { ticker: company.ticker },
      update: company,
      create: company,
    })
    console.log(`Upserted company: ${created.ticker}`)
  }

  console.log('Seeding finished.')
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
