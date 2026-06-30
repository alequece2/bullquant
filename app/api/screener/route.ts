import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Auth check — screener executes heavy DB queries; require a logged-in user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sector, minGrossMargin, minRoic, minRevenue, minDividendYield, minEarningsYield } = body

    // We only want the latest ANNUAL fundamentals.
    const whereClause: any = {
      periodType: 'ANNUAL',
      company: {
        isActive: true,
      },
    }

    if (sector && sector !== 'ALL') {
      whereClause.company.sector = sector
    }

    if (minGrossMargin !== undefined && minGrossMargin > 0) {
      whereClause.grossMargin = { gte: minGrossMargin }
    }

    if (minRoic !== undefined && minRoic > 0) {
      whereClause.roic = { gte: minRoic }
    }

    if (minRevenue !== undefined && minRevenue > 0) {
      whereClause.revenue = { gte: minRevenue }
    }

    // Note: minDividendYield filter is applied in-memory after we compute earningsYield
    // because dividend yield requires price data (dividendPerShare / currentPrice) which
    // is not available at DB query time. The in-memory filter below handles it.

    const results = await prisma.fundamental.findMany({
      where: whereClause,
      distinct: ['companyId'],
      orderBy: [
        { companyId: 'asc' },
        { periodEnd: 'desc' }
      ],
      include: {
        company: {
          include: {
            prices: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        }
      },
      take: 100, // Limit results for performance
    })

    // Map to a cleaner format for the frontend
    let companies = results.map(fund => {
      let earningsYield = null
      let ev = null
      let marketCap = null

      const latestPrice = fund.company.prices?.[0]?.close
      if (latestPrice && fund.sharesOutstanding) {
        marketCap = Number(latestPrice) * Number(fund.sharesOutstanding)
        
        const debt = Number(fund.totalDebt || 0)
        const cash = Number(fund.cash || 0)
        ev = marketCap + debt - cash

        const ebit = Number(fund.operatingIncome || 0)
        if (ev > 0 && ebit !== 0) {
          earningsYield = ebit / ev
        }
      }

      const currentPrice = latestPrice ? Number(latestPrice) : null
      return {
        id: fund.company.id,
        ticker: fund.company.ticker,
        name: fund.company.name,
        logoUrl: fund.company.logoUrl,
        sector: fund.company.sector,
        revenue: fund.revenue ? Number(fund.revenue) : null,
        grossMargin: fund.grossMargin ? Number(fund.grossMargin) : null,
        roic: fund.roic ? Number(fund.roic) : null,
        dividendPerShare: fund.dividendPerShare ? Number(fund.dividendPerShare) : null,
        earningsYield: earningsYield,
        // Internal field for dividend yield filter — not sent to frontend
        _currentPrice: currentPrice,
      }
    })

    if (minEarningsYield !== undefined && minEarningsYield > 0) {
      companies = companies.filter(c => c.earningsYield !== null && c.earningsYield >= minEarningsYield)
    }

    // Dividend yield filter — applied in-memory using real yield = dividendPerShare / currentPrice
    if (minDividendYield !== undefined && minDividendYield > 0) {
      companies = companies.filter(c => {
        if (!c.dividendPerShare || !c._currentPrice) return false
        const yld = c.dividendPerShare / c._currentPrice
        return yld >= minDividendYield
      })
    }

    // Optionally sort by something like revenue desc in memory
    companies.sort((a, b) => (b.revenue || 0) - (a.revenue || 0))

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Failed to fetch screener results:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
