"use client"

import * as React from "react"
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react"

type BriefEvent = {
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL"
  title: string
  date: string
  content: string
}

type BriefData = {
  events: BriefEvent[]
}

export function StockBrief({ ticker }: { ticker: string }) {
  const [data, setData] = React.useState<BriefData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    async function fetchBrief() {
      try {
        const res = await fetch(`/api/ai/brief?ticker=${ticker}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        setData(json.brief)
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchBrief()
  }, [ticker])

  if (error) return null

  if (loading) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            BullQuant Brief <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">A nossa IA está a analisar os acontecimentos recentes...</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.events.length === 0) return null

  return (
    <div className="bg-[#1A1A24] border border-[#2D2D3D] rounded-xl p-6 shadow-lg text-slate-300">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          BullQuant Brief <Sparkles className="w-5 h-5 text-amber-400" />
        </h2>
        <p className="text-sm text-slate-400 mt-1">Um resumo estratégico dos desenvolvimentos recentes (Powered by AI)</p>
      </div>

      <ul className="space-y-6 list-disc pl-5 marker:text-slate-600">
        {data.events.map((event, idx) => {
          let SentimentIcon = Minus
          let sentimentColor = "text-slate-400"
          let sentimentText = "Neutral"

          if (event.sentiment === "BULLISH") {
            SentimentIcon = TrendingUp
            sentimentColor = "text-bull"
            sentimentText = "Bullish"
          } else if (event.sentiment === "BEARISH") {
            SentimentIcon = TrendingDown
            sentimentColor = "text-bear"
            sentimentText = "Bearish"
          }

          return (
            <li key={idx} className="pl-2">
              <div className="flex items-center gap-2 font-bold text-white mb-2 text-lg">
                <span className={`flex items-center gap-1 ${sentimentColor} text-sm bg-background/50 px-2 py-0.5 rounded-md`}>
                  <SentimentIcon className="w-4 h-4" />
                  ({sentimentText})
                </span>
                <span>{event.title}</span>
              </div>
              <p className="text-sm text-slate-400 mb-2 font-medium">Date: {event.date}</p>
              <p className="text-slate-300 leading-relaxed text-sm">
                {event.content}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
