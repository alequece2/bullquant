"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, Sunrise, Moon, TrendingUp, TrendingDown } from "lucide-react"

interface EarningsItem {
  id: string
  date: string // YYYY-MM-DD
  hour: "BMO" | "AMC" | "DMH" | "UNKNOWN"
  fiscalYear: number
  fiscalQuarter: number
  epsEstimate: number | null
  epsActual: number | null
  revenueEstimate: number | null
  revenueActual: number | null
  ticker: string
  name: string
  logoUrl: string | null
}

type Scope = "all" | "watchlist"

const fmtDate = (d: Date) => d.toISOString().slice(0, 10)
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0)

// ─────────────────────────────────────────────────────────────
// DEV DEMO: dados ilustrativos para ver o calendário sem BD/ingest.
// Só ativa em `next dev` (NODE_ENV !== production) e só quando a API
// não devolve nada. Em produção, ou com dados reais, isto nunca corre.
// ─────────────────────────────────────────────────────────────
const DEMO_TICKERS = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "MSFT", name: "Microsoft Corp." },
  { ticker: "GOOGL", name: "Alphabet Inc." },
  { ticker: "AMZN", name: "Amazon.com Inc." },
  { ticker: "NVDA", name: "NVIDIA Corp." },
  { ticker: "META", name: "Meta Platforms Inc." },
  { ticker: "TSLA", name: "Tesla Inc." },
  { ticker: "JPM", name: "JPMorgan Chase & Co." },
  { ticker: "V", name: "Visa Inc." },
  { ticker: "KO", name: "The Coca-Cola Company" },
  { ticker: "WMT", name: "Walmart Inc." },
  { ticker: "O", name: "Realty Income Corp." },
]

function makeDemoEvents(monthStart: Date): EarningsItem[] {
  const year = monthStart.getFullYear()
  const month = monthStart.getMonth()
  const daysInMonth = endOfMonth(monthStart).getDate()
  const todayStr = fmtDate(new Date())
  const hours: EarningsItem["hour"][] = ["BMO", "AMC", "AMC", "BMO"]
  const picks = [3, 6, 6, 9, 13, 16, 20, 23, 27, 29]

  return picks.map((dayNum, i) => {
    const day = Math.min(dayNum, daysInMonth)
    const date = new Date(year, month, day)
    const dateStr = fmtDate(date)
    const co = DEMO_TICKERS[i % DEMO_TICKERS.length]
    const reported = dateStr < todayStr
    const epsEstimate = 0.8 + (i % 5) * 0.35
    const epsActual = reported ? epsEstimate + (i % 2 === 0 ? 0.12 : -0.07) : null
    return {
      id: `demo-${dateStr}-${co.ticker}`,
      date: dateStr,
      hour: hours[i % hours.length],
      fiscalYear: year,
      fiscalQuarter: Math.floor(month / 3) + 1,
      epsEstimate,
      epsActual,
      revenueEstimate: null,
      revenueActual: null,
      ticker: co.ticker,
      name: co.name,
      logoUrl: null,
    }
  })
}

export function EarningsCalendar() {
  const t = useTranslations("calendar")
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [scope, setScope] = useState<Scope>("all")
  const [events, setEvents] = useState<EarningsItem[]>([])
  const [loading, setLoading] = useState(true)

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor])
  const monthEnd = useMemo(() => endOfMonth(cursor), [cursor])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      const params = new URLSearchParams({ from: fmtDate(monthStart), to: fmtDate(monthEnd) })
      if (scope === "watchlist") params.set("watchlist", "1")
      const isDev = process.env.NODE_ENV !== "production"
      try {
        const res = await fetch(`/api/earnings?${params.toString()}`)
        const data: EarningsItem[] = res.ok ? await res.json() : []
        const real = Array.isArray(data) ? data : []
        if (active) setEvents(real.length === 0 && isDev ? makeDemoEvents(monthStart) : real)
      } catch {
        if (active) setEvents(isDev ? makeDemoEvents(monthStart) : [])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [monthStart, monthEnd, scope])

  const byDay = useMemo(() => {
    const map = new Map<string, EarningsItem[]>()
    for (const e of events) {
      const arr = map.get(e.date) ?? []
      arr.push(e)
      map.set(e.date, arr)
    }
    return map
  }, [events])

  // Grelha: semanas começam à Segunda (convenção EU/PT).
  const cells = useMemo(() => {
    const firstWeekday = (monthStart.getDay() + 6) % 7 // 0 = Segunda
    const daysInMonth = monthEnd.getDate()
    const out: (Date | null)[] = []
    for (let i = 0; i < firstWeekday; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
    while (out.length % 7 !== 0) out.push(null)
    return out
  }, [monthStart, monthEnd, cursor])

  // Nomes de mês/dias-da-semana via Intl (locale PT) — sem listas hardcoded.
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" }).format(cursor),
    [cursor],
  )
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        // 1 Jan 2024 foi uma Segunda-feira.
        new Intl.DateTimeFormat("pt-PT", { weekday: "short" }).format(new Date(2024, 0, 1 + i)),
      ),
    [],
  )

  const todayStr = fmtDate(new Date())
  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
  const goToday = () => setCursor(startOfMonth(new Date()))

  const scopeBtn = (value: Scope, label: string) => (
    <button
      onClick={() => setScope(value)}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        scope === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            aria-label={t("prevMonth")}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-bold text-lg capitalize min-w-[11rem] text-center">{monthLabel}</span>
          <button
            onClick={goNext}
            aria-label={t("nextMonth")}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="ml-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
          >
            {t("today")}
          </button>
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-card">
          {scopeBtn("all", t("scopeAll"))}
          {scopeBtn("watchlist", t("scopeWatchlist"))}
        </div>
      </div>

      {/* Resumo + legenda */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-medium">{t("summary", { count: events.length })}</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Sunrise className="h-3.5 w-3.5" /> {t("legendBmo")}
          </span>
          <span className="flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5" /> {t("legendAmc")}
          </span>
        </div>
      </div>

      {/* Grelha */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="grid grid-cols-7 bg-muted/50">
          {weekdays.map(w => (
            <div key={w} className="p-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="min-h-[7rem] border-t border-l border-border bg-muted/20" />
            const dayStr = fmtDate(day)
            const dayEvents = byDay.get(dayStr) ?? []
            const isToday = dayStr === todayStr
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            return (
              <div
                key={dayStr}
                className={`min-h-[7rem] border-t border-l border-border p-1.5 flex flex-col transition-colors ${
                  isWeekend ? "bg-muted/20" : ""
                } ${isToday ? "ring-1 ring-inset ring-primary/40" : ""}`}
              >
                <div
                  className={`text-xs font-medium mb-1 ${
                    isToday
                      ? "self-start rounded-full bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {day.getDate()}
                </div>
                {loading ? (
                  <div className="space-y-1">
                    <div className="h-4 rounded bg-muted animate-pulse" />
                    {idx % 3 === 0 && <div className="h-4 rounded bg-muted animate-pulse w-2/3" />}
                  </div>
                ) : (
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 4).map(e => (
                      <EventChip key={e.id} e={e} />
                    ))}
                    {dayEvents.length > 4 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 4} {t("more")}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {!loading && events.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          {t("empty")}
        </div>
      )}
    </div>
  )
}

function EventChip({ e }: { e: EarningsItem }) {
  const reported = e.epsActual !== null && e.epsEstimate !== null
  const beat = reported && e.epsActual! >= e.epsEstimate!
  const HourIcon = e.hour === "BMO" ? Sunrise : e.hour === "AMC" ? Moon : null

  return (
    <Link
      href={`/stock/${e.ticker}`}
      title={`${e.name} · Q${e.fiscalQuarter} ${e.fiscalYear}`}
      className="group flex items-center gap-1.5 rounded px-1 py-0.5 text-[11px] font-semibold truncate transition-colors hover:bg-muted"
    >
      {e.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={e.logoUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="h-3.5 w-3.5 rounded-sm object-contain bg-white shrink-0"
        />
      ) : HourIcon ? (
        <HourIcon className="h-3 w-3 shrink-0 opacity-60" />
      ) : null}
      <span className="truncate text-foreground">{e.ticker}</span>
      {reported &&
        (beat ? (
          <TrendingUp className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
        ) : (
          <TrendingDown className="h-3 w-3 shrink-0 text-red-600 dark:text-red-400" />
        ))}
    </Link>
  )
}
