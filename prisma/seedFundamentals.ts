import { PrismaClient, PeriodType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding fundamentals (10 years for AAPL & MSFT)...')

  const companies = await prisma.company.findMany({
    where: { ticker: { in: ['AAPL', 'MSFT'] } }
  })

  if (companies.length === 0) {
    console.log('No companies found. Please run main seed first.')
    return
  }

  // Generate 12 years (2014 to 2025)
  const years = Array.from({ length: 12 }, (_, i) => 2014 + i)
  const quarters = [1, 2, 3, 4]

  for (const company of companies) {
    console.log(`Generating data for ${company.ticker}...`)
    
    // Base values for 2014 (AAPL scale roughly)
    let baseRevenue = company.ticker === 'AAPL' ? 40000 : 20000 // In millions
    let baseShares = company.ticker === 'AAPL' ? 24000 : 8000 // In millions

    const dataToInsert = []

    for (const year of years) {
      // Annual accumulators
      let annualRevenue = 0
      let annualCostOfRevenue = 0
      let annualGrossProfit = 0
      let annualRAndD = 0
      let annualSga = 0
      let annualOperatingExpenses = 0
      let annualEbitda = 0
      let annualOperatingIncome = 0
      let annualNetIncome = 0
      let annualOcf = 0
      let annualCapex = 0
      let annualDividends = 0
      let annualCash = 0
      let annualDebt = 0

      const annualSegments: Record<string, number> = company.ticker === 'AAPL' 
        ? { "iPhone": 0, "Mac": 0, "iPad": 0, "Wearables": 0, "Services": 0 }
        : { "Intelligent Cloud": 0, "Productivity & Business": 0, "More Personal Computing": 0 }

      for (const q of quarters) {
        // Grow by ~1.5% per quarter with some random noise
        const growth = 1 + (0.015 + (Math.random() * 0.02 - 0.01))
        baseRevenue *= growth
        baseShares *= 0.995 // 0.5% share buyback per quarter

        // Randomize margin ratios to create a jagged chart
        const costRatio = 0.58 + (Math.random() * 0.04) // between 58% and 62%
        const costOfRevenue = baseRevenue * costRatio
        const grossProfit = baseRevenue - costOfRevenue
        
        const rAndDRatio = 0.045 + (Math.random() * 0.01)
        const sgaRatio = 0.065 + (Math.random() * 0.01)
        const rAndD = baseRevenue * rAndDRatio
        const sga = baseRevenue * sgaRatio
        const operatingExpenses = rAndD + sga
        
        const ebitda = grossProfit - operatingExpenses + (baseRevenue * 0.02) // Fake D&A added back
        const operatingIncome = grossProfit - operatingExpenses
        const netIncome = operatingIncome * 0.75 // 25% tax
        
        const epsDiluted = netIncome / baseShares
        
        const operatingCashFlow = netIncome * 1.2
        const capex = baseRevenue * 0.05
        const freeCashFlow = operatingCashFlow - capex

        const cash = baseRevenue * 1.5
        const totalDebt = baseRevenue * 0.8
        
        // Segments
        const revenueSegments = company.ticker === 'AAPL' ? {
          "iPhone": baseRevenue * 0.55,
          "Mac": baseRevenue * 0.1,
          "iPad": baseRevenue * 0.07,
          "Wearables": baseRevenue * 0.1,
          "Services": baseRevenue * 0.18
        } : {
          "Intelligent Cloud": baseRevenue * 0.4,
          "Productivity & Business": baseRevenue * 0.3,
          "More Personal Computing": baseRevenue * 0.3
        }

        const dividendPerShare = (netIncome * 0.25) / baseShares // 25% payout ratio

        // Accumulate for annual
        annualRevenue += baseRevenue
        annualCostOfRevenue += costOfRevenue
        annualGrossProfit += grossProfit
        annualRAndD += rAndD
        annualSga += sga
        annualOperatingExpenses += operatingExpenses
        annualEbitda += ebitda
        annualOperatingIncome += operatingIncome
        annualNetIncome += netIncome
        annualOcf += operatingCashFlow
        annualCapex += capex
        annualDividends += dividendPerShare
        annualCash = cash // Usually take end of year for balance sheet
        annualDebt = totalDebt

        for (const [key, val] of Object.entries(revenueSegments)) {
          annualSegments[key] += val
        }

        const month = String(q * 3).padStart(2, '0')
        const qDate = new Date(`${year}-${month}-28T00:00:00Z`)

        dataToInsert.push({
          companyId: company.id,
          periodType: PeriodType.QUARTERLY,
          fiscalYear: year,
          fiscalQuarter: q,
          periodEnd: qDate,
          revenue: baseRevenue,
          costOfRevenue: costOfRevenue,
          grossProfit: grossProfit,
          researchAndDevelopment: rAndD,
          sellingGeneralAndAdmin: sga,
          operatingExpenses: operatingExpenses,
          ebitda: ebitda,
          operatingIncome: operatingIncome,
          netIncome: netIncome,
          epsDiluted: epsDiluted,
          sharesOutstanding: baseShares,
          operatingCashFlow: operatingCashFlow,
          capex: capex,
          freeCashFlow: freeCashFlow,
          cash: cash,
          totalDebt: totalDebt,
          grossMargin: grossProfit / baseRevenue,
          operatingMargin: operatingIncome / baseRevenue,
          netMargin: netIncome / baseRevenue,
          roic: (operatingIncome * 0.75) / (totalDebt + baseRevenue), // Fake invested capital
          dividendPerShare: dividendPerShare,
          revenueSegments: revenueSegments
        })
      }

      // Add ANNUAL record
      dataToInsert.push({
        companyId: company.id,
        periodType: PeriodType.ANNUAL,
        fiscalYear: year,
        fiscalQuarter: null,
        periodEnd: new Date(`${year}-12-31`),
        revenue: annualRevenue,
        costOfRevenue: annualCostOfRevenue,
        grossProfit: annualGrossProfit,
        researchAndDevelopment: annualRAndD,
        sellingGeneralAndAdmin: annualSga,
        operatingExpenses: annualOperatingExpenses,
        ebitda: annualEbitda,
        operatingIncome: annualOperatingIncome,
        netIncome: annualNetIncome,
        epsDiluted: annualNetIncome / baseShares,
        sharesOutstanding: baseShares, // end of year shares
        operatingCashFlow: annualOcf,
        capex: annualCapex,
        freeCashFlow: annualOcf - annualCapex,
        cash: annualCash,
        totalDebt: annualDebt,
        grossMargin: annualGrossProfit / annualRevenue,
        operatingMargin: annualOperatingIncome / annualRevenue,
        netMargin: annualNetIncome / annualRevenue,
        roic: (annualOperatingIncome * 0.75) / (annualDebt + annualRevenue),
        dividendPerShare: annualDividends,
        revenueSegments: annualSegments
      })
    }

    // Delete existing fundamentals for clean state
    await prisma.fundamental.deleteMany({ where: { companyId: company.id } })

    // Insert all
    await prisma.fundamental.createMany({
      data: dataToInsert
    })

    console.log(`Created ${dataToInsert.length} fundamentals for ${company.ticker}`)
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
