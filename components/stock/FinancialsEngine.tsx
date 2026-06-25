"use client"

import { useState, useEffect, useMemo } from "react"
import { DecisionChart, ChartConfig } from "./DecisionChart"
import { useTranslations } from "next-intl"

type PeriodType = "QUARTERLY" | "TTM" | "ANNUAL"

export function FinancialsEngine({ ticker }: { ticker: string }) {
  const t = useTranslations("financials")
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>("ANNUAL")
  
  // Ratios internal tab state
  const [ratioTab, setRatioTab] = useState<"ROIC" | "GROSS" | "OPERATING" | "PROFIT">("ROIC")

  useEffect(() => {
    async function fetchFundamentals() {
      try {
        const res = await fetch(`/api/fundamentals/${ticker}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch fundamentals", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFundamentals()
  }, [ticker])

  const processedData = useMemo(() => {
    if (data.length === 0) return []

    if (period === "ANNUAL") {
      const annuals = data.filter(d => d.periodType === "ANNUAL")
      return annuals.map(a => ({
        ...a,
        label: `${a.fiscalYear}`
      }))
    }

    const quarterlies = data.filter(d => d.periodType === "QUARTERLY")

    if (period === "QUARTERLY") {
      return quarterlies.map(q => ({
        ...q,
        label: `Q${q.fiscalQuarter} '${String(q.fiscalYear).slice(2)}`
      }))
    }

    // TTM Calculation
    if (period === "TTM") {
      const ttmData = []
      // Start from the 4th quarter available to calculate a full TTM
      for (let i = 3; i < quarterlies.length; i++) {
        const current = quarterlies[i]
        const last4 = quarterlies.slice(i - 3, i + 1)
        
        // Sum flows
        const revenue = last4.reduce((acc, q) => acc + (q.revenue || 0), 0)
        const netIncome = last4.reduce((acc, q) => acc + (q.netIncome || 0), 0)
        const ebitda = last4.reduce((acc, q) => acc + (q.ebitda || 0), 0)
        const operatingCashFlow = last4.reduce((acc, q) => acc + (q.operatingCashFlow || 0), 0)
        const capex = last4.reduce((acc, q) => acc + (q.capex || 0), 0)
        const freeCashFlow = operatingCashFlow - capex
        const epsDiluted = last4.reduce((acc, q) => acc + (q.epsDiluted || 0), 0)
        const rAndD = last4.reduce((acc, q) => acc + (q.researchAndDevelopment || 0), 0)
        const sga = last4.reduce((acc, q) => acc + (q.sellingGeneralAndAdmin || 0), 0)
        
        // Latest for balance sheet/ratios
        const cash = current.cash
        const totalDebt = current.totalDebt
        const sharesOutstanding = current.sharesOutstanding
        const grossMargin = last4.reduce((acc, q) => acc + (q.grossProfit || 0), 0) / revenue
        const operatingMargin = last4.reduce((acc, q) => acc + (q.operatingIncome || 0), 0) / revenue
        const profitMargin = netIncome / revenue
        const roic = current.roic // Usually TTM ROIC requires average capital, keeping current for simplicity
        const dividendPerShare = last4.reduce((acc, q) => acc + (q.dividendPerShare || 0), 0)

        // Segments
        let segments: any = {}
        last4.forEach(q => {
          if (q.revenueSegments) {
            Object.keys(q.revenueSegments).forEach(k => {
              segments[k] = (segments[k] || 0) + q.revenueSegments[k]
            })
          }
        })

        ttmData.push({
          label: `TTM Q${current.fiscalQuarter} '${String(current.fiscalYear).slice(2)}`,
          revenue, netIncome, ebitda, operatingCashFlow, capex, freeCashFlow, epsDiluted,
          researchAndDevelopment: rAndD, sellingGeneralAndAdmin: sga,
          cash, totalDebt, sharesOutstanding, grossMargin, operatingMargin, profitMargin,
          roic, dividendPerShare, revenueSegments: segments
        })
      }
      return ttmData
    }

    return []
  }, [data, period])

  const calcCAGR = (key: string) => {
    if (processedData.length < 2) return null
    const start = processedData[0][key]
    const end = processedData[processedData.length - 1][key]
    if (!start || !end || start <= 0) return null
    const years = period === "ANNUAL" ? processedData.length - 1 : (processedData.length - 1) / 4
    if (years <= 0) return null
    return Math.pow(end / start, 1 / years) - 1
  }

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center animate-pulse bg-card rounded-xl border border-border/40 mt-8">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    )
  }

  // Pre-process segments for dynamic keys
  let segmentKeys: string[] = []
  if (processedData.length > 0 && processedData[0].revenueSegments) {
    segmentKeys = Object.keys(processedData[0].revenueSegments)
  }

  // Flatten segments into main object for Recharts
  const chartData = processedData.map(d => ({
    ...d,
    profitMargin: d.profitMargin !== undefined ? d.profitMargin : d.netMargin,
    ...d.revenueSegments,
    capexInv: d.capex ? -d.capex : 0 // Negative capex for composed chart
  }))

  const segmentColors = ['#f97316', '#fcd34d', '#fde047', '#86efac', '#38bdf8', '#c084fc']

  return (
    <div className="mt-12 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">{t('engineTitle')}</h2>
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border/40 w-fit">
          {(["QUARTERLY", "TTM", "ANNUAL"] as PeriodType[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                period === p ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(`periods.${p.toLowerCase()}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <DecisionChart 
          title={t('charts.revenue')} 
          data={chartData} 
          type="BAR" 
          config={{ isCurrency: true, dataKeys: [{ key: 'revenue', color: '#3b82f6', type: 'bar' }] }} 
          cagr={calcCAGR('revenue')}
        />

        {segmentKeys.length > 0 && (
          <DecisionChart 
            title={t('charts.revenueBySegment')} 
            data={chartData} 
            type="STACKED_BAR" 
            config={{ 
              isCurrency: true, 
              dataKeys: segmentKeys.map((k, i) => ({ key: k, color: segmentColors[i % segmentColors.length], type: 'bar', stackId: 'a' })) 
            }} 
          />
        )}

        <DecisionChart 
          title={t('charts.epsDiluted')} 
          data={chartData} 
          type="BAR" 
          config={{ dataKeys: [{ key: 'epsDiluted', color: '#8b5cf6', type: 'bar' }] }} 
          cagr={calcCAGR('epsDiluted')}
        />

        <DecisionChart 
          title={t('charts.freeCashFlow')} 
          data={chartData} 
          type="COMPOSED" 
          config={{ 
            isCurrency: true,
            dataKeys: [
              { key: 'operatingCashFlow', name: 'OCF', color: '#10b981', type: 'bar' },
              { key: 'capexInv', name: 'CapEx', color: '#f43f5e', type: 'line' }
            ] 
          }} 
          cagr={calcCAGR('freeCashFlow')}
        />

        <DecisionChart 
          title={t('charts.netIncome')} 
          data={chartData} 
          type="BAR" 
          config={{ isCurrency: true, dataKeys: [{ key: 'netIncome', color: '#14b8a6', type: 'bar' }] }} 
          cagr={calcCAGR('netIncome')}
        />

        <DecisionChart 
          title={t('charts.ebitda')} 
          data={chartData} 
          type="BAR" 
          config={{ isCurrency: true, dataKeys: [{ key: 'ebitda', color: '#f59e0b', type: 'bar' }] }} 
          cagr={calcCAGR('ebitda')}
        />

        <DecisionChart 
          title={t('charts.expenses')} 
          data={chartData} 
          type="STACKED_BAR" 
          config={{ 
            isCurrency: true,
            dataKeys: [
              { key: 'researchAndDevelopment', name: 'R&D', color: '#0ea5e9', type: 'bar', stackId: 'a' },
              { key: 'sellingGeneralAndAdmin', name: 'SG&A', color: '#f43f5e', type: 'bar', stackId: 'a' },
              { key: 'capex', name: 'CapEx', color: '#eab308', type: 'bar', stackId: 'a' }
            ] 
          }} 
        />

        <DecisionChart 
          title={t('charts.cashDebt')} 
          data={chartData} 
          type="BAR" 
          config={{ 
            isCurrency: true,
            dataKeys: [
              { key: 'cash', name: 'Cash', color: '#10b981', type: 'bar' },
              { key: 'totalDebt', name: 'Debt', color: '#f43f5e', type: 'bar' }
            ] 
          }} 
        />

        <DecisionChart 
          title={t('charts.sharesOutstanding')} 
          data={chartData} 
          type="BAR" 
          config={{ dataKeys: [{ key: 'sharesOutstanding', color: '#6366f1', type: 'bar' }], inverseColors: true }} 
          cagr={calcCAGR('sharesOutstanding')}
        />

        <DecisionChart 
          title={t('charts.dividends')} 
          data={chartData} 
          type="BAR" 
          config={{ dataKeys: [{ key: 'dividendPerShare', name: 'Dividend/Share', color: '#ec4899', type: 'bar' }] }} 
          cagr={calcCAGR('dividendPerShare')}
        />

        {/* 4-in-1 Ratios Card */}
        <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm h-[320px] flex flex-col group relative">
          <div className="absolute top-2 right-4 flex bg-muted/50 p-1 rounded-md border border-border/40 z-10 scale-90 origin-top-right">
            {(["ROIC", "GROSS", "OPERATING", "PROFIT"] as const).map(tab => (
              <button
                key={tab}
                onClick={(e) => { e.stopPropagation(); setRatioTab(tab) }}
                className={`px-2 py-1 text-xs font-semibold rounded-sm transition-all ${
                  ratioTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(`ratios.${tab.toLowerCase()}`)}
              </button>
            ))}
          </div>
          <div className="h-full w-full -m-4 p-4">
            {ratioTab === "ROIC" && <DecisionChart title={t('charts.roic')} data={chartData} type="BAR" config={{ isPercentage: true, dataKeys: [{ key: 'roic', color: '#3b82f6', type: 'bar' }] }} />}
            {ratioTab === "GROSS" && <DecisionChart title={t('charts.grossMargin')} data={chartData} type="LINE" config={{ isPercentage: true, dataKeys: [{ key: 'grossMargin', color: '#ec4899', type: 'line' }] }} />}
            {ratioTab === "OPERATING" && <DecisionChart title={t('charts.operatingMargin')} data={chartData} type="LINE" config={{ isPercentage: true, dataKeys: [{ key: 'operatingMargin', color: '#f59e0b', type: 'line' }] }} />}
            {ratioTab === "PROFIT" && <DecisionChart title={t('charts.profitMargin')} data={chartData} type="LINE" config={{ isPercentage: true, dataKeys: [{ key: 'profitMargin', color: '#14b8a6', type: 'line' }] }} />}
          </div>
        </div>

      </div>
    </div>
  )
}
