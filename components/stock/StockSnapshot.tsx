"use client"

import { useEffect, useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import type { Fundamental } from "@prisma/client"

type StockSnapshotProps = {
  ticker: string
  fundamentals: Fundamental[] // 4 quarters or 1 annual
}

function formatVal(value: number | null | undefined, isPercent = false, isCurrency = false, isRatio = false) {
  if (value === null || value === undefined || isNaN(Number(value))) return "---"
  const num = Number(value)

  if (isPercent) {
    return `${(num * 100).toFixed(2)}%`
  }
  
  if (isCurrency) {
    if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    return `$${num.toFixed(2)}`
  }
  
  if (isRatio) {
    return `${num.toFixed(2)}x`
  }
  
  return num.toFixed(2)
}

export function StockSnapshot({ ticker, fundamentals }: StockSnapshotProps) {
  const t = useTranslations("stock.snapshot")
  const [price, setPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`/api/price/${ticker}`)
        if (res.ok) {
          const data = await res.json()
          setPrice(data.currentPrice)
        }
      } catch (err) {
        console.error("Failed to fetch price for snapshot", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 60000)
    return () => clearInterval(interval)
  }, [ticker])

  // Derive TTM data
  const ttm = useMemo(() => {
    if (!fundamentals || fundamentals.length === 0) return null

    const latest = fundamentals[0]
    const isTtm = fundamentals.length === 4

    const sumMetric = (key: keyof Fundamental) => 
      isTtm ? fundamentals.reduce((sum, f) => sum + Number(f[key] || 0), 0) : Number(latest[key] || 0)

    const revenue = sumMetric('revenue')
    const grossProfit = sumMetric('grossProfit')
    const opIncome = sumMetric('operatingIncome')
    const netIncome = sumMetric('netIncome')
    const ebitda = sumMetric('ebitda')
    const opCf = sumMetric('operatingCashFlow')
    const fcf = sumMetric('freeCashFlow')

    return {
      // Flow metrics (summed if TTM)
      revenue,
      grossProfit,
      opIncome,
      netIncome,
      ebitda,
      operatingCashFlow: opCf,
      freeCashFlow: fcf,

      // Computed Margins
      grossMargin: revenue > 0 ? grossProfit / revenue : null,
      operatingMargin: revenue > 0 ? opIncome / revenue : null,
      netMargin: revenue > 0 ? netIncome / revenue : null,

      // Instant metrics (from latest quarter/year)
      cash: Number(latest.cash || 0),
      totalAssets: Number(latest.totalAssets || 0),
      totalDebt: Number(latest.totalDebt || 0),
      totalEquity: Number(latest.totalEquity || 0),
      sharesOutstanding: Number(latest.sharesOutstanding || 0),
    }
  }, [fundamentals])

  // Valuation computations
  const shares = ttm?.sharesOutstanding || null
  const marketCap = (price && shares && shares > 0) ? price * shares : null
  const ev = marketCap !== null ? marketCap + (ttm?.totalDebt || 0) - (ttm?.cash || 0) : null
  
  const pe = (marketCap && ttm?.netIncome && ttm.netIncome > 0) ? marketCap / ttm.netIncome : null
  const ps = (marketCap && ttm?.revenue && ttm.revenue > 0) ? marketCap / ttm.revenue : null
  const evEbitda = (ev && ttm?.ebitda && ttm.ebitda > 0) ? ev / ttm.ebitda : null
  const pb = (marketCap && ttm?.totalEquity && ttm.totalEquity > 0) ? marketCap / ttm.totalEquity : null
  const fcfYield = (marketCap && ttm?.freeCashFlow) ? ttm.freeCashFlow / marketCap : null

  if (!ttm) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Valuation */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('valuation')}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Market Cap</span>
          {isLoading ? <div className="h-4 w-16 bg-muted animate-pulse rounded" /> : <span className="font-bold">{formatVal(marketCap, false, true)}</span>}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">P/E (TTM)</span>
          {isLoading ? <div className="h-4 w-12 bg-muted animate-pulse rounded" /> : <span className="font-bold">{formatVal(pe, false, false, true)}</span>}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">P/Sales</span>
          {isLoading ? <div className="h-4 w-12 bg-muted animate-pulse rounded" /> : <span className="font-bold">{formatVal(ps, false, false, true)}</span>}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">EV/EBITDA</span>
          {isLoading ? <div className="h-4 w-12 bg-muted animate-pulse rounded" /> : <span className="font-bold">{formatVal(evEbitda, false, false, true)}</span>}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">P/Book</span>
          {isLoading ? <div className="h-4 w-12 bg-muted animate-pulse rounded" /> : <span className="font-bold">{formatVal(pb, false, false, true)}</span>}
        </div>
      </div>

      {/* 2. Cash Flow */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('cashFlow')}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Operating CF</span>
          <span className="font-bold">{formatVal(ttm.operatingCashFlow, false, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Free Cash Flow</span>
          <span className="font-bold">{formatVal(ttm.freeCashFlow, false, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">FCF Yield</span>
          {isLoading ? <div className="h-4 w-12 bg-muted animate-pulse rounded" /> : <span className="font-bold">{formatVal(fcfYield, true)}</span>}
        </div>
      </div>

      {/* 3. Margins & Growth */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('marginAndGrowth')}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Gross Margin</span>
          <span className="font-bold">{formatVal(ttm.grossMargin, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Oper. Margin</span>
          <span className="font-bold">{formatVal(ttm.operatingMargin, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Net Margin</span>
          <span className="font-bold">{formatVal(ttm.netMargin, true)}</span>
        </div>
      </div>

      {/* 4. Balance */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('balance')}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Cash</span>
          <span className="font-bold">{formatVal(ttm.cash, false, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Assets</span>
          <span className="font-bold">{formatVal(ttm.totalAssets, false, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Debt</span>
          <span className="font-bold">{formatVal(ttm.totalDebt, false, true)}</span>
        </div>
      </div>

      {/* 5. Health */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('health')}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Equity</span>
          <span className="font-bold">{formatVal(ttm.totalEquity, false, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Net Debt</span>
          <span className="font-bold">{formatVal(ttm.totalDebt - ttm.cash, false, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Shares Out.</span>
          <span className="font-bold">{formatVal(ttm.sharesOutstanding, false, true)}</span>
        </div>
      </div>
    </div>
  )
}
