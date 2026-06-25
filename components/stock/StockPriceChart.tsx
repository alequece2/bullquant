"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

type PricePoint = {
  date: string
  close: number
}

type TabType = "1m" | "6m" | "1y" | "5y" | "max"

export function StockPriceChart({ ticker }: { ticker: string }) {
  const t = useTranslations("stock.chart")
  const [allData, setAllData] = useState<PricePoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("1y")

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch(`/api/prices/${ticker}`)
        if (res.ok) {
          const data = await res.json()
          setAllData(data)
        }
      } catch (error) {
        console.error("Failed to fetch prices:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPrices()
  }, [ticker])

  const filteredData = useMemo(() => {
    if (allData.length === 0) return []
    
    if (activeTab === "max") return allData

    const now = new Date()
    let monthsToSubtract = 0
    if (activeTab === "1m") monthsToSubtract = 1
    if (activeTab === "6m") monthsToSubtract = 6
    if (activeTab === "1y") monthsToSubtract = 12
    if (activeTab === "5y") monthsToSubtract = 60

    const cutoffDate = new Date(now)
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToSubtract)
    
    return allData.filter(p => new Date(p.date) >= cutoffDate)
  }, [allData, activeTab])

  const startPrice = filteredData.length > 0 ? filteredData[0].close : 0
  const endPrice = filteredData.length > 0 ? filteredData[filteredData.length - 1].close : 0
  const changeValue = endPrice - startPrice
  const changePercent = startPrice > 0 ? (changeValue / startPrice) * 100 : 0
  const isPositive = changeValue >= 0

  const tabs: TabType[] = ["1m", "6m", "1y", "5y", "max"]

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('pt-PT', { month: 'short', year: '2-digit' }).format(d)
  }

  const formatTooltipDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
  }

  if (isLoading) {
    return (
      <div className="w-full h-[400px] bg-card border border-border/40 rounded-xl flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    )
  }

  if (allData.length === 0) {
    return null
  }

  return (
    <div className="w-full bg-card border border-border/40 rounded-xl shadow-sm p-4 md:p-6 mb-8 mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">{t('title')}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-2xl font-extrabold tracking-tight ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? '+' : '-'}${Math.abs(changeValue).toFixed(2)}
            </span>
            <span className={`flex items-center text-sm font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(changePercent).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex bg-muted/50 p-1 rounded-lg border border-border/40 w-fit">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
                activeTab === tab 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888888', fontSize: 12 }}
              minTickGap={30}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#888888', fontSize: 12 }}
              tickFormatter={(val) => `$${val}`}
              width={60}
              orientation="right"
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border border-border/50 p-3 rounded-lg shadow-xl">
                      <p className="text-muted-foreground text-xs font-medium mb-1">
                        {formatTooltipDate(label)}
                      </p>
                      <p className="font-bold text-foreground text-lg">
                        ${Number(payload[0].value).toFixed(2)}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke={isPositive ? '#10b981' : '#f43f5e'} 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
