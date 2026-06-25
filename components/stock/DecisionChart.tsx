"use client"

import { useState } from "react"
import { Maximize2, Table2, BarChart3 } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Legend,
  Cell
} from "recharts"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useTranslations } from "next-intl"

export type ChartConfig = {
  dataKeys: { key: string; color: string; type: 'bar' | 'line'; stackId?: string; name?: string }[]
  referenceLine?: { y: number; label: string; color: string }
  isCurrency?: boolean
  isPercentage?: boolean
  inverseColors?: boolean
}

interface DecisionChartProps {
  title: string
  data: any[]
  type: 'BAR' | 'LINE' | 'COMPOSED' | 'STACKED_BAR'
  config: ChartConfig
  cagr?: number | null
}

export function DecisionChart({ title, data, type, config, cagr }: DecisionChartProps) {
  const t = useTranslations("stock.chart")
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return "N/A"
    if (config.isPercentage) return `${(val * 100).toFixed(2)}%`
    if (config.isCurrency) {
      if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(2)}B`
      return `$${Number(val).toFixed(2)}M`
    }
    // For numbers like shares
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(2)}B`
    return Number(val).toFixed(2)
  }

  const formatTooltipValue = (val: any) => {
    if (val === null || val === undefined) return "N/A"
    if (config.isPercentage) return `${(val * 100).toFixed(2)}%`
    if (config.isCurrency) return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getBarColor = (val: number, defaultColor: string) => {
    if (config.inverseColors) {
      return val < 0 ? '#10b981' : '#f43f5e' // For shares diff if we did it, but let's stick to default for now or pass dynamic
    }
    return defaultColor
  }

  const renderChart = (height: number | `${number}%` = "100%") => {
    if (data.length === 0) return <div className="flex items-center justify-center h-full text-muted-foreground">{t('noData')}</div>

    const ChartComponent = type === 'COMPOSED' || type === 'STACKED_BAR' ? ComposedChart : type === 'LINE' ? LineChart : BarChart

    return (
      <div className="w-full h-full outline-none focus:outline-none focus-visible:outline-none" tabIndex={-1}>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333333" opacity={0.2} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#888888', fontSize: 11 }} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={formatValue}
              tick={{ fill: '#888888', fontSize: 11 }}
              width={65}
            />
            <Tooltip 
              formatter={(value: unknown, name: string | number | undefined) => [formatTooltipValue(value), String(name ?? '')]}
              labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', marginBottom: '8px' }}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
            />
            {(type === 'STACKED_BAR' || config.dataKeys.length > 1) && (
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            )}
            {config.referenceLine && (
              <ReferenceLine y={config.referenceLine.y} stroke={config.referenceLine.color} strokeDasharray="3 3" label={{ position: 'top', value: config.referenceLine.label, fill: config.referenceLine.color, fontSize: 11 }} />
            )}
            
            {config.dataKeys.map((k, i) => {
              if (k.type === 'line' || type === 'LINE') {
                return <Line key={k.key} type="monotone" dataKey={k.key} name={k.name || k.key} stroke={k.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              }
              return (
                <Bar key={k.key} dataKey={k.key} name={k.name || k.key} fill={k.color} stackId={k.stackId} radius={type === 'STACKED_BAR' ? 0 : [4, 4, 0, 0]}>
                  {data.map((entry, index) => {
                    let cellColor = k.color
                    if (config.inverseColors) {
                      if (index > 0) {
                        const prev = Number(data[index - 1][k.key]) || 0
                        const curr = Number(entry[k.key]) || 0
                        if (curr < prev) cellColor = '#10b981'
                        else if (curr > prev) cellColor = '#f43f5e'
                      } else {
                        cellColor = '#a1a1aa'
                      }
                    }
                    return <Cell key={`cell-${index}`} fill={cellColor} />
                  })}
                </Bar>
              )
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderTable = () => (
    <div className="overflow-auto h-full w-full custom-scrollbar">
      <table className="w-full text-sm text-left">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur text-muted-foreground text-xs uppercase">
          <tr>
            <th className="px-4 py-2 font-medium">{t('period')}</th>
            {config.dataKeys.map(k => (
              <th key={k.key} className="px-4 py-2 font-medium text-right">{k.name || k.key}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2 font-medium whitespace-nowrap">{row.label}</td>
              {config.dataKeys.map(k => (
                <td key={k.key} className="px-4 py-2 text-right tabular-nums">
                  {formatTooltipValue(row[k.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-foreground text-base leading-tight">{title}</h3>
          {cagr !== undefined && cagr !== null && (
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              CAGR: <span className={cagr >= 0 ? "text-emerald-500" : "text-rose-500"}>{cagr > 0 ? '+' : ''}{(cagr * 100).toFixed(1)}%</span>
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-md border border-border/40">
          <button 
            onClick={() => setViewMode('chart')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'chart' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title={t('chartView')}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'table' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title={t('tableView')}
          >
            <Table2 className="w-4 h-4" />
          </button>
          <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
            <DialogTrigger 
              className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors ml-1"
              title={t('fullScreen')}
            >
              <Maximize2 className="w-4 h-4" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl w-[90vw] h-[80vh] flex flex-col bg-card border-border/50 outline-none focus:outline-none">
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <div className="flex-1 mt-4 min-h-0">
                {viewMode === 'chart' ? renderChart("100%") : renderTable()}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {viewMode === 'chart' ? renderChart("100%") : renderTable()}
      </div>
    </div>
  )

  return (
    <div className="bg-card border border-border/40 rounded-xl p-4 shadow-sm h-[320px] flex flex-col group">
      {content}
    </div>
  )
}
