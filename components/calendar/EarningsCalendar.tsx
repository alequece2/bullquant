"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, Sunrise, Moon, TrendingUp, TrendingDown } from "lucide-react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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
      try {
        const res = await fetch(`/api/earnings?${params.toString()}`)
        const data: EarningsItem[] = res.ok ? await res.json() : []
        if (active) setEvents(Array.isArray(data) ? data : [])
      } catch {
        if (active) setEvents([])
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
  const t = useTranslations("calendar")
  const reported = e.epsActual !== null && e.epsEstimate !== null
  const beat = reported && e.epsActual! >= e.epsEstimate!
  const HourIcon = e.hour === "BMO" ? Sunrise : e.hour === "AMC" ? Moon : null

  const formatCurrency = (val: number | null) => {
    if (val === null) return "-"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(val)
  }
  
  const formatCompact = (val: number | null) => {
    if (val === null) return "-"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(val)
  }

  return (
    <Dialog>
      <DialogTrigger
        title={`${e.name} · Q${e.fiscalQuarter} ${e.fiscalYear}`}
        className="w-full text-left group flex items-center gap-1.5 rounded px-1 py-0.5 text-[11px] font-semibold truncate transition-colors hover:bg-muted"
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
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {e.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={e.logoUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="h-5 w-5 rounded-sm object-contain bg-white shrink-0"
              />
            )}
            {e.name} ({e.ticker})
          </DialogTitle>
          <DialogDescription>
            Q{e.fiscalQuarter} {e.fiscalYear} · {e.hour === "BMO" ? t("legendBmo") : e.hour === "AMC" ? t("legendAmc") : e.hour}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="rounded-xl border border-border p-3 flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">Earnings Per Share</span>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-muted-foreground">Estimativa</span>
              <span className="font-medium">{formatCurrency(e.epsEstimate)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-border/50 pt-1">
              <span className="text-muted-foreground">Reportado</span>
              <span className={`font-semibold ${reported ? (beat ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400") : ""}`}>
                {formatCurrency(e.epsActual)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">Revenue</span>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-muted-foreground">Estimativa</span>
              <span className="font-medium">{formatCompact(e.revenueEstimate)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-border/50 pt-1">
              <span className="text-muted-foreground">Reportado</span>
              <span className={`font-semibold ${e.revenueActual !== null && e.revenueEstimate !== null ? (e.revenueActual >= e.revenueEstimate ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400") : ""}`}>
                {formatCompact(e.revenueActual)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between items-center mt-4">
          <DialogClose render={<Button variant="ghost" />}>
            Fechar
          </DialogClose>
          <Link href={`/stock/${e.ticker}`} prefetch={false}>
            <Button>Ver {e.ticker} no Terminal</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
