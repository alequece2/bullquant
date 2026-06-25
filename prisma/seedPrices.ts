import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding mock prices...')
  
  const tickers = ['AAPL', 'MSFT']
  
  // Create 5 years of daily prices (approx 252 trading days per year)
  // To avoid timeouts and excessive inserts, we can insert maybe 5 years of trading days ~ 1250 rows per ticker.
  // We'll generate them in memory and insert in batches.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (const ticker of tickers) {
    console.log(`Generating prices for ${ticker}...`)
    
    // Clear existing prices for the ticker
    await prisma.price.deleteMany({ where: { ticker } })
    
    const prices = []
    let currentPrice = ticker === 'AAPL' ? 100 : 200 // Starting price 5 years ago
    
    // 5 years = approx 1825 days. Let's do 1250 trading days (approx 5 years)
    for (let i = 1250; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Random walk
      const volatility = 0.02 // 2% daily volatility
      const change = 1 + (Math.random() * volatility * 2 - volatility)
      currentPrice = currentPrice * change
      
      const open = currentPrice * (1 - 0.005)
      const high = currentPrice * 1.01
      const low = currentPrice * 0.99
      const close = currentPrice
      const volume = Math.floor(Math.random() * 10000000) + 1000000
      
      prices.push({
        ticker,
        date: new Date(date), // ensure a new Date object
        open,
        high,
        low,
        close,
        volume
      })
    }
    
    // Insert in batches of 500
    for (let i = 0; i < prices.length; i += 500) {
      const batch = prices.slice(i, i + 500)
      await prisma.price.createMany({
        data: batch
      })
    }
    console.log(`Inserted ${prices.length} prices for ${ticker}.`)
  }
  
  console.log('Seeding prices finished.')
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
