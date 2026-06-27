import Link from "next/link";
import { formatLargeNumber } from "@/lib/finance/format";

interface StockCardProps {
  ticker: string;
  name: string;
  logoUrl: string | null;
  sharesOutstanding: number | null;
  currentPrice: number | null;
  changePercent: number | null;
  isLoading: boolean;
}

export function StockCard({
  ticker,
  name,
  logoUrl,
  sharesOutstanding,
  currentPrice,
  changePercent,
  isLoading,
}: StockCardProps) {
  // Calculate Market Cap
  const marketCap =
    sharesOutstanding && currentPrice
      ? sharesOutstanding * currentPrice
      : null;

  const isPositive = changePercent ? changePercent >= 0 : true;

  return (
    <Link href={`/stock/${ticker}`} className="block group">
      <div className="bg-card/40 backdrop-blur-sm border border-border/60 hover:bg-card/80 hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-primary/5 hover:-translate-y-1 duration-300 transition-all p-5 rounded-2xl flex flex-col h-full relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-primary/5 p-1 rounded-lg border border-primary/10 flex items-center justify-center shrink-0 w-10 h-10 overflow-hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={ticker}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <span className={`font-bold text-sm ${logoUrl ? "hidden" : ""}`}>
                {ticker[0]}
              </span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-extrabold text-lg truncate group-hover:text-primary transition-colors">
                {ticker}
              </span>
              <span className="text-xs text-muted-foreground truncate w-[100px] sm:w-[120px]">
                {name}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            {isLoading ? (
              <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
            ) : (
              <span className="font-bold text-lg">
                {currentPrice ? `$${currentPrice.toFixed(2)}` : "N/A"}
              </span>
            )}
            
            {isLoading ? (
              <div className="h-4 w-12 bg-muted animate-pulse rounded mt-1"></div>
            ) : (
              changePercent !== null && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {changePercent.toFixed(2)}%
                </span>
              )
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Market Cap</span>
          <span className="text-sm font-semibold text-foreground/90">
            {marketCap ? formatLargeNumber(marketCap) : "N/A"}
          </span>
        </div>
      </div>
    </Link>
  );
}
