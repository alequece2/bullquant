import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sector, minGrossMargin, minRoic, minRevenue, minDividendYield } = body

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

    if (minGrossMargin !== undefined) {
      whereClause.grossMargin = { gte: minGrossMargin }
    }

    if (minRoic !== undefined) {
      whereClause.roic = { gte: minRoic }
    }

    if (minRevenue !== undefined) {
      whereClause.revenue = { gte: minRevenue }
    }

    if (minDividendYield !== undefined) {
      whereClause.dividendPerShare = { gte: minDividendYield }
      // Note: In MVP, dividendPerShare is absolute, so filtering by absolute dividend is a proxy.
      // Alternatively, we filter companies that just HAVE a dividend if > 0.
      if (minDividendYield > 0) {
        whereClause.dividendPerShare = { gt: 0 }
      }
    }

    const results = await prisma.fundamental.findMany({
      where: whereClause,
      distinct: ['companyId'],
      orderBy: [
        { companyId: 'asc' },
        { periodEnd: 'desc' }
      ],
      include: {
        company: true
      },
      take: 100, // Limit results for performance
    })

    // Map to a cleaner format for the frontend
    const companies = results.map(fund => ({
      id: fund.company.id,
      ticker: fund.company.ticker,
      name: fund.company.name,
      logoUrl: fund.company.logoUrl,
      sector: fund.company.sector,
      revenue: fund.revenue ? Number(fund.revenue) : null,
      grossMargin: fund.grossMargin ? Number(fund.grossMargin) : null,
      roic: fund.roic ? Number(fund.roic) : null,
      dividendPerShare: fund.dividendPerShare ? Number(fund.dividendPerShare) : null,
    }))

    // Optionally sort by something like revenue desc in memory
    companies.sort((a, b) => (b.revenue || 0) - (a.revenue || 0))

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Failed to fetch screener results:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
