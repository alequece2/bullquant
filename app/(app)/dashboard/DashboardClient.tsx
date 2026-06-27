"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { StockCard } from "@/components/stock/StockCard";
import { ScreenerCompany } from "@/lib/finance/screener";
import { cn } from "@/lib/utils";

interface PriceData {
  currentPrice?: number;
  changePercent?: number;
  error?: string;
}

interface DashboardClientProps {
  tabs: string[];
  activeTab: string;
  companies: ScreenerCompany[];
}

export function DashboardClient({ tabs, activeTab, companies }: DashboardClientProps) {
  const router = useRouter();
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isPricesLoading, setIsPricesLoading] = useState(true);

  // Fetch prices only when companies array changes (tab changes)
  useEffect(() => {
    let isMounted = true;
    
    async function fetchLivePrices() {
      if (companies.length === 0) return;
      
      setIsPricesLoading(true);
      const tickers = companies.map(c => c.ticker);
      
      try {
        const res = await fetch(`/api/prices/batch?tickers=${tickers.join(",")}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPrices(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch live prices", err);
      } finally {
        if (isMounted) {
          setIsPricesLoading(false);
        }
      }
    }

    fetchLivePrices();

    return () => {
      isMounted = false;
    };
  }, [companies]);

  const handleTabChange = (tab: string) => {
    // Clear prices optimistic UI
    setIsPricesLoading(true);
    setPrices({});
    router.push(`/dashboard?tab=${encodeURIComponent(tab)}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-muted/20">
      {/* Top Hero Section */}
      <div className="pt-12 pb-10 px-6 flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-card to-background border-b border-border/40">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Insights
        </h1>
        <p className="mt-4 text-muted-foreground text-center max-w-xl">
          Explore market trends, discover high-growth opportunities, and track the most discussed stocks across Wall Street.
        </p>
      </div>

      {/* Tabs Section */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center overflow-x-auto no-scrollbar px-6 max-w-[1600px] mx-auto">
          <div className="flex space-x-1 py-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 outline-none",
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {companies.map((company) => {
              const priceData = prices[company.ticker];
              
              return (
                <StockCard
                  key={company.ticker}
                  ticker={company.ticker}
                  name={company.name}
                  logoUrl={company.logoUrl}
                  sharesOutstanding={company.sharesOutstanding}
                  currentPrice={priceData?.currentPrice ?? null}
                  changePercent={priceData?.changePercent ?? null}
                  isLoading={isPricesLoading}
                />
              );
            })}
          </div>
          
          {companies.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No companies found for this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
