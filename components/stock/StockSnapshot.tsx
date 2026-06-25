import { getTranslations } from "next-intl/server"

// Temporarily, we use any for fundamental since it's a Prisma model that we'll fetch.
// In reality it'll be of type Fundamental (from @prisma/client)
type StockSnapshotProps = {
  fundamental: any | null
}

function formatVal(value: any, isPercent = false, isCurrency = false) {
  if (value === null || value === undefined) return "---"
  const num = Number(value)
  if (isNaN(num)) return "---"

  if (isPercent) {
    return `${(num * 100).toFixed(2)}%`
  }
  
  if (isCurrency) {
    if (Math.abs(num) >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`
    }
    if (Math.abs(num) >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`
    }
    return `$${num.toFixed(2)}`
  }
  
  return num.toFixed(2)
}

export async function StockSnapshot({ fundamental }: StockSnapshotProps) {
  const t = await getTranslations("stock.snapshot")

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Valuation */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('valuation')}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Market Cap</span>
          <span className="font-bold">{formatVal(fundamental?.totalAssets, false, true)}</span> {/* Placeholder till we have real market cap */}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">P/E (TTM)</span>
          <span className="font-bold">---</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">P/Sales</span>
          <span className="font-bold">---</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">EV/EBITDA</span>
          <span className="font-bold">---</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">P/Book</span>
          <span className="font-bold">---</span>
        </div>
      </div>

      {/* 2. Cash Flow */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('cashFlow')}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Operating CF</span>
          <span className="font-bold">{formatVal(fundamental?.operatingCashFlow, false, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Free Cash Flow</span>
          <span className="font-bold">{formatVal(fundamental?.freeCashFlow, false, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">FCF Yield</span>
          <span className="font-bold">---</span>
        </div>
      </div>

      {/* 3. Margins & Growth */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('margins')}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Gross Margin</span>
          <span className="font-bold">{formatVal(fundamental?.grossMargin, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Oper. Margin</span>
          <span className="font-bold">{formatVal(fundamental?.operatingMargin, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Net Margin</span>
          <span className="font-bold">{formatVal(fundamental?.netMargin, true)}</span>
        </div>
      </div>

      {/* 4. Balance */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('balance')}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Cash</span>
          <span className="font-bold">{formatVal(fundamental?.cash, false, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Debt</span>
          <span className="font-bold">{formatVal(fundamental?.totalDebt, false, true)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Equity</span>
          <span className="font-bold">{formatVal(fundamental?.totalEquity, false, true)}</span>
        </div>
      </div>

      {/* 5. Dividend */}
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('dividend')}</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Div Yield</span>
          <span className="font-bold">---</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">DPS</span>
          <span className="font-bold">{formatVal(fundamental?.dividendPerShare, false, true)}</span>
        </div>
      </div>
    </div>
  )
}
