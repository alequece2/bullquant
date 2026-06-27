import { prisma } from "@/lib/prisma";

export type ScreenerCompany = {
  ticker: string;
  name: string;
  logoUrl: string | null;
  sharesOutstanding: number | null;
};

export async function getCategoryCompanies(category: string, limit = 20): Promise<ScreenerCompany[]> {
  let whereClause = {};
  let tickersIn: string[] = [];

  switch (category) {
    case 'S&P 500':
      tickersIn = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'BRK.B', 'LLY', 'AVGO', 'JPM', 'TSLA', 'WMT', 'UNH', 'V', 'XOM', 'MA', 'PG', 'JNJ', 'ORCL', 'HD'];
      whereClause = { ticker: { in: tickersIn } };
      break;
    case 'Artificial Intelligence':
      tickersIn = ['NVDA', 'MSFT', 'GOOGL', 'META', 'AMD', 'AVGO', 'QCOM', 'INTC', 'IBM', 'MU', 'CRM', 'ADBE'];
      whereClause = { ticker: { in: tickersIn } };
      break;
    case 'Dividend Growth':
      tickersIn = ['JNJ', 'PG', 'KO', 'PEP', 'MMM', 'ABBV', 'TGT', 'WMT', 'CVX', 'XOM', 'MCD', 'CAT', 'CL', 'LOW', 'HD'];
      whereClause = { ticker: { in: tickersIn } };
      break;
    case 'Growth':
      tickersIn = ['NVDA', 'CRWD', 'PLTR', 'SNOW', 'DDOG', 'MNDY', 'NET', 'ZS', 'NOW', 'UBER', 'DASH', 'ABNB'];
      whereClause = { ticker: { in: tickersIn } };
      break;
    case 'Buyback Machines':
      tickersIn = ['AAPL', 'GOOGL', 'META', 'MSFT', 'ORCL', 'QCOM', 'BK', 'Lowe\'s', 'HD', 'TXN'];
      whereClause = { ticker: { in: tickersIn } };
      break;
    case 'Most Trending':
      tickersIn = ['TSLA', 'NVDA', 'AAPL', 'AMD', 'PLTR', 'SMCI', 'GME', 'AMC', 'MSTR', 'COIN'];
      whereClause = { ticker: { in: tickersIn } };
      break;
    default:
      whereClause = {};
  }

  const companies = await prisma.company.findMany({
    where: whereClause,
    take: limit,
    select: {
      ticker: true,
      name: true,
      logoUrl: true,
      fundamentals: {
        orderBy: { periodEnd: 'desc' },
        take: 1,
        select: { sharesOutstanding: true }
      }
    }
  });

  // Map to a simpler format
  const mapped = companies.map(c => ({
    ticker: c.ticker,
    name: c.name,
    logoUrl: c.logoUrl,
    sharesOutstanding: c.fundamentals[0]?.sharesOutstanding ? Number(c.fundamentals[0].sharesOutstanding) : null
  }));

  // Preserve the exact order requested in tickersIn
  if (tickersIn.length > 0) {
    return mapped.sort((a, b) => tickersIn.indexOf(a.ticker) - tickersIn.indexOf(b.ticker));
  }

  return mapped;
}
