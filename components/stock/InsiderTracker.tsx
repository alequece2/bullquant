"use client";

import { useEffect, useState } from "react";
import { formatLargeNumber, formatPrice } from "@/lib/finance/format";
import { AlertCircle, User, Activity } from "lucide-react";
import { useTranslations } from "next-intl";

interface InsiderTransaction {
  name: string;
  share: number;
  change: number;
  filingDate: string;
  transactionDate: string;
  transactionPrice: number;
  transactionCode: string;
}

interface InsiderTrackerProps {
  ticker: string;
}

export function InsiderTracker({ ticker }: InsiderTrackerProps) {
  const [transactions, setTransactions] = useState<InsiderTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fallback translation if namespace is missing, we use standard English in code as fallback 
  // but let's assume we'll add 'stock' namespace to next-intl
  const t = useTranslations("stock");

  useEffect(() => {
    async function fetchInsiders() {
      try {
        const res = await fetch(`/api/insiders?ticker=${ticker}`);
        if (!res.ok) {
          throw new Error("Failed to fetch insider data");
        }
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsiders();
  }, [ticker]);

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-6 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-8 h-8 text-destructive mb-3" />
        <h3 className="font-semibold">{t("insidersErrorTitle") || "Insider Data Unavailable"}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("insidersErrorDesc") || "Could not load recent insider transactions."}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-6 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-12 w-full bg-muted/50 rounded-lg"></div>
          <div className="h-12 w-full bg-muted/50 rounded-lg"></div>
          <div className="h-12 w-full bg-muted/50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{t("insiderTitle") || "Insider Transactions"}</h3>
            <p className="text-sm text-muted-foreground">{t("recentInsiderBuys") || "Recent Insider Purchases"}</p>
          </div>
        </div>
      </div>

      <div className="p-0 overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <User className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {t("noInsiderBuys") || "No recent open-market buys by insiders detected."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/30 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Insider</th>
                <th className="px-4 py-3 font-medium">Shares Bought</th>
                <th className="px-4 py-3 font-medium">Avg Price</th>
                <th className="px-4 py-3 font-medium text-right">Total Invested</th>
                <th className="px-4 py-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {transactions.map((tx, idx) => {
                const totalInvested = tx.change * tx.transactionPrice;
                return (
                  <tr key={`${tx.name}-${tx.transactionDate}-${idx}`} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-4 font-medium flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                        {tx.name.charAt(0)}
                      </div>
                      <span className="truncate max-w-[150px]" title={tx.name}>{tx.name}</span>
                    </td>
                    <td className="px-4 py-4 text-green-500 font-medium">+{formatLargeNumber(tx.change, "")}</td>
                    <td className="px-4 py-4">{formatPrice(tx.transactionPrice)}</td>
                    <td className="px-4 py-4 text-right font-semibold">{formatPrice(totalInvested)}</td>
                    <td className="px-4 py-4 text-right text-muted-foreground">{tx.transactionDate}</td>
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
