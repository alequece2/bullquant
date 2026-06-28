"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLargeNumber } from "@/lib/finance/format";

interface InsiderTxn {
  id: string;
  insiderName: string;
  title: string | null;
  type: "BUY" | "SELL" | "OTHER";
  shares: number;
  price: number | null;
  value: number | null;
  transactionDate: string;
}

interface InsiderSummary {
  windowDays: number;
  buyCount: number;
  sellCount: number;
  buyValue: number;
  sellValue: number;
}

export function InsiderActivity({ ticker }: { ticker: string }) {
  const t = useTranslations("insider");
  const [txns, setTxns] = useState<InsiderTxn[] | null>(null);
  const [summary, setSummary] = useState<InsiderSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/insider/${ticker}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setTxns(d.transactions ?? []);
        setSummary(d.summary ?? null);
      })
      .catch(() => active && setTxns([]));
    return () => {
      active = false;
    };
  }, [ticker]);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {summary && (summary.buyCount > 0 || summary.sellCount > 0) && (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <SummaryChip
              dir="up"
              label={t("buysWindow", { n: summary.buyCount, days: summary.windowDays })}
              value={summary.buyValue}
            />
            <SummaryChip
              dir="down"
              label={t("sellsWindow", { n: summary.sellCount, days: summary.windowDays })}
              value={summary.sellValue}
            />
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {txns === null ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : txns.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">{t("emptyTitle")}</p>
            <p className="max-w-sm text-xs text-muted-foreground">{t("emptyDesc")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">{t("col.insider")}</th>
                <th className="hidden px-4 py-2.5 text-left font-medium sm:table-cell">{t("col.type")}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t("col.shares")}</th>
                <th className="hidden px-4 py-2.5 text-right font-medium md:table-cell">{t("col.price")}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t("col.value")}</th>
                <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">{t("col.date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {txns.map((tx) => {
                const isBuy = tx.type === "BUY";
                const isSell = tx.type === "SELL";
                return (
                  <tr key={tx.id} className="transition-colors hover:bg-accent/50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-foreground">{tx.insiderName}</div>
                      {tx.title && (
                        <div className="text-[11px] text-muted-foreground">{tx.title}</div>
                      )}
                    </td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">
                      <TypeBadge type={tx.type} label={t(`type.${tx.type.toLowerCase()}`)} />
                    </td>
                    <td
                      className={cn(
                        "nums px-4 py-2.5 text-right font-medium",
                        isBuy && "text-bull",
                        isSell && "text-bear",
                      )}
                    >
                      {isSell ? "−" : isBuy ? "+" : ""}
                      {tx.shares.toLocaleString("en-US")}
                    </td>
                    <td className="nums hidden px-4 py-2.5 text-right text-muted-foreground md:table-cell">
                      {tx.price ? `$${tx.price.toFixed(2)}` : "N/A"}
                    </td>
                    <td className="nums px-4 py-2.5 text-right font-medium text-foreground/90">
                      {tx.value ? `$${formatLargeNumber(tx.value)}` : "N/A"}
                    </td>
                    <td className="nums hidden px-4 py-2.5 text-right text-muted-foreground sm:table-cell">
                      {tx.transactionDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TypeBadge({ type, label }: { type: "BUY" | "SELL" | "OTHER"; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        type === "BUY" && "bg-bull/10 text-bull",
        type === "SELL" && "bg-bear/10 text-bear",
        type === "OTHER" && "bg-muted text-muted-foreground",
      )}
    >
      {type === "BUY" && <ArrowUpRight className="h-3 w-3" />}
      {type === "SELL" && <ArrowDownRight className="h-3 w-3" />}
      {label}
    </span>
  );
}

function SummaryChip({
  dir,
  label,
  value,
}: {
  dir: "up" | "down";
  label: string;
  value: number;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-end rounded-lg border px-3 py-1.5",
        dir === "up" ? "border-bull/20 bg-bull/5" : "border-bear/20 bg-bear/5",
      )}
    >
      <span className={cn("text-[11px] font-medium", dir === "up" ? "text-bull" : "text-bear")}>
        {label}
      </span>
      <span className="nums text-xs font-semibold text-foreground/80">
        ${formatLargeNumber(value)}
      </span>
    </div>
  );
}
