"use client"

import { useTranslations } from "next-intl"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchCode } from "lucide-react"

export type ScreenerFiltersType = {
  sector: string
  minGrossMargin: number
  minRoic: number
  minRevenue: number
  minDividendYield: number
}

interface ScreenerFiltersProps {
  filters: ScreenerFiltersType
  onChange: (filters: ScreenerFiltersType) => void
}

const SECTORS = [
  "ALL",
  "Technology",
  "Healthcare",
  "Financials",
  "Consumer Discretionary",
  "Communication Services",
  "Industrials",
  "Consumer Staples",
  "Energy",
  "Utilities",
  "Real Estate",
  "Materials",
]

export function ScreenerFilters({ filters, onChange }: ScreenerFiltersProps) {
  const t = useTranslations("screener")

  const handleSliderChange = (key: keyof ScreenerFiltersType, value: number | readonly number[]) => {
    const numValue = Array.isArray(value) || typeof value === 'object' ? value[0] : value;
    onChange({ ...filters, [key]: numValue })
  }

  const handleSectorChange = (value: string | null) => {
    onChange({ ...filters, sector: value || "ALL" })
  }

  return (
    <div className="flex flex-col gap-6 p-6 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 mb-2">
        <SearchCode className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">{t("filters.title")}</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t("filters.sector")}</Label>
          <Select value={filters.sector} onValueChange={handleSectorChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("filters.sectorPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "ALL" ? t("filters.allSectors") : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between">
            <Label>{t("filters.minGrossMargin")}</Label>
            <span className="text-sm text-muted-foreground">{(filters.minGrossMargin * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[filters.minGrossMargin]}
            onValueChange={(val) => handleSliderChange("minGrossMargin", val)}
            max={1}
            step={0.05}
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between">
            <Label>{t("filters.minRoic")}</Label>
            <span className="text-sm text-muted-foreground">{(filters.minRoic * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[filters.minRoic]}
            onValueChange={(val) => handleSliderChange("minRoic", val)}
            max={0.5}
            step={0.01}
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between">
            <Label>{t("filters.minRevenue")}</Label>
            <span className="text-sm text-muted-foreground">
              {filters.minRevenue === 0 ? "0" : `$${(filters.minRevenue / 1e9).toFixed(0)}B`}
            </span>
          </div>
          <Slider
            value={[filters.minRevenue]}
            onValueChange={(val) => handleSliderChange("minRevenue", val)}
            max={100_000_000_000} // 100B
            step={1_000_000_000} // 1B
          />
        </div>

      </div>
    </div>
  )
}
