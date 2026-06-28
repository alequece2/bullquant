import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { StockHeader } from '@/components/stock/StockHeader'
import { StockSnapshot } from '@/components/stock/StockSnapshot'
import { StockPriceChart } from '@/components/stock/StockPriceChart'
import { FinancialsEngine } from '@/components/stock/FinancialsEngine'
import { InsiderActivity } from '@/components/stock/InsiderActivity'

export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const resolvedParams = await params
  const { ticker } = resolvedParams
  const t = await getTranslations('stock')

  // Fetch the company
  const company = await prisma.company.findUnique({
    where: {
      ticker: ticker.toUpperCase(),
    },
  })

  // If company doesn't exist in our DB, 404
  if (!company) {
    notFound()
  }

  // Fetch the latest fundamentals for TTM calculation
  const latestFundamentals = await prisma.fundamental.findMany({
    where: {
      companyId: company.id,
      periodType: 'QUARTERLY'
    },
    orderBy: {
      periodEnd: 'desc',
    },
    take: 4,
  })

  let fundamentalsToPass = latestFundamentals

  if (latestFundamentals.length < 4) {
    // Fallback to the latest ANNUAL record if we don't have enough quarters
    const latestAnnual = await prisma.fundamental.findFirst({
      where: {
        companyId: company.id,
        periodType: 'ANNUAL'
      },
      orderBy: {
        periodEnd: 'desc',
      },
    })
    fundamentalsToPass = latestAnnual ? [latestAnnual] : []
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* 1. Header (Info + Live Finnhub Price) */}
      <StockHeader company={{
        ticker: company.ticker,
        name: company.name,
        exchange: company.exchange,
        logoUrl: company.logoUrl
      }} />

      {/* 2. Fundamentals Snapshot */}
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4 text-foreground">{t('snapshotTitle')}</h2>
        <StockSnapshot ticker={company.ticker} fundamentals={fundamentalsToPass} />
      </div>

      {/* 3. Price History Chart */}
      <StockPriceChart ticker={company.ticker} />

      {/* 4. Financials & Decision Engine */}
      <FinancialsEngine ticker={company.ticker} sector={company.sector} />

      {/* 5. Insider Activity (SEC Form 4) */}
      <InsiderActivity ticker={company.ticker} />
    </div>
  )
}
