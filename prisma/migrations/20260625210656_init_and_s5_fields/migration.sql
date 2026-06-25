-- CreateEnum
CREATE TYPE "plan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "period_type" AS ENUM ('QUARTERLY', 'ANNUAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "plan" "plan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cik" TEXT,
    "exchange" TEXT NOT NULL,
    "sector" TEXT,
    "industry" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "logoUrl" TEXT,
    "description" TEXT,
    "website" TEXT,
    "employees" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFundamentalsUpdate" TIMESTAMP(3),
    "lastPriceUpdate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fundamentals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodType" "period_type" NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "fiscalQuarter" INTEGER,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "filedAt" TIMESTAMP(3),
    "revenue" DECIMAL(20,4),
    "costOfRevenue" DECIMAL(20,4),
    "grossProfit" DECIMAL(20,4),
    "operatingExpenses" DECIMAL(20,4),
    "researchAndDevelopment" DECIMAL(20,4),
    "sellingGeneralAndAdmin" DECIMAL(20,4),
    "ebitda" DECIMAL(20,4),
    "operatingIncome" DECIMAL(20,4),
    "revenueSegments" JSONB,
    "interestExpense" DECIMAL(20,4),
    "taxExpense" DECIMAL(20,4),
    "netIncome" DECIMAL(20,4),
    "epsDiluted" DECIMAL(10,4),
    "sharesOutstanding" DECIMAL(20,4),
    "operatingCashFlow" DECIMAL(20,4),
    "capex" DECIMAL(20,4),
    "freeCashFlow" DECIMAL(20,4),
    "totalAssets" DECIMAL(20,4),
    "totalCurrentLiab" DECIMAL(20,4),
    "longTermDebt" DECIMAL(20,4),
    "totalDebt" DECIMAL(20,4),
    "cash" DECIMAL(20,4),
    "totalEquity" DECIMAL(20,4),
    "grossMargin" DECIMAL(8,6),
    "operatingMargin" DECIMAL(8,6),
    "netMargin" DECIMAL(8,6),
    "roic" DECIMAL(8,6),
    "returnOnEquity" DECIMAL(8,6),
    "dividendPerShare" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fundamentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "ticker" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "open" DECIMAL(12,4),
    "high" DECIMAL(12,4),
    "low" DECIMAL(12,4),
    "close" DECIMAL(12,4) NOT NULL,
    "volume" BIGINT,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("ticker","date")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'O Meu Portfólio',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_items" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insight_cache" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "moat" TEXT NOT NULL,
    "catalysts" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_insight_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_ticker_key" ON "companies"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cik_key" ON "companies"("cik");

-- CreateIndex
CREATE INDEX "companies_ticker_idx" ON "companies"("ticker");

-- CreateIndex
CREATE INDEX "companies_exchange_idx" ON "companies"("exchange");

-- CreateIndex
CREATE INDEX "companies_sector_idx" ON "companies"("sector");

-- CreateIndex
CREATE INDEX "fundamentals_companyId_periodEnd_idx" ON "fundamentals"("companyId", "periodEnd");

-- CreateIndex
CREATE INDEX "fundamentals_companyId_periodType_fiscalYear_idx" ON "fundamentals"("companyId", "periodType", "fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "fundamentals_companyId_periodType_fiscalYear_fiscalQuarter_key" ON "fundamentals"("companyId", "periodType", "fiscalYear", "fiscalQuarter");

-- CreateIndex
CREATE UNIQUE INDEX "portfolios_userId_key" ON "portfolios"("userId");

-- CreateIndex
CREATE INDEX "portfolio_items_portfolioId_idx" ON "portfolio_items"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_items_portfolioId_companyId_key" ON "portfolio_items"("portfolioId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_insight_cache_companyId_key" ON "ai_insight_cache"("companyId");

-- CreateIndex
CREATE INDEX "ai_insight_cache_companyId_expiresAt_idx" ON "ai_insight_cache"("companyId", "expiresAt");

-- CreateIndex
CREATE INDEX "ai_usage_logs_userId_usedAt_idx" ON "ai_usage_logs"("userId", "usedAt");

-- AddForeignKey
ALTER TABLE "fundamentals" ADD CONSTRAINT "fundamentals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_ticker_fkey" FOREIGN KEY ("ticker") REFERENCES "companies"("ticker") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insight_cache" ADD CONSTRAINT "ai_insight_cache_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
