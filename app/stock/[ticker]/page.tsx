import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { StockHeader } from '@/components/stock/StockHeader'
import { StockSnapshot } from '@/components/stock/StockSnapshot'
import { StockPriceChart } from '@/components/stock/StockPriceChart'

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

  // Fetch the latest fundamental record for the snapshot
  const latestFundamental = await prisma.fundamental.findFirst({
    where: {
      companyId: company.id,
    },
    orderBy: {
      periodEnd: 'desc',
    },
  })

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
        <StockSnapshot fundamental={latestFundamental} />
      </div>

      {/* 3. Price History Chart */}
      <StockPriceChart ticker={company.ticker} />

      {/* Placeholders for future phases */}
      <div className="pt-8 opacity-40 border-t border-border border-dashed">
        <p className="text-sm font-medium text-center">Gráfico Histórico & Motor de Decisão (em breve na S4/S5) 🚧</p>
      </div>
    </div>
  )
}
