# BullQuant — Schema da Base de Dados (Prisma)

## Ficheiro `schema.prisma`

```prisma
// schema.prisma
// BullQuant — Base de dados PostgreSQL via Supabase
// Gerado e mantido com Prisma ORM

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // necessário para o Supabase com connection pooling
}

// ─────────────────────────────────────────────
// UTILIZADORES E AUTH
// ─────────────────────────────────────────────

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatarUrl String?
  plan      Plan     @default(FREE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relações
  portfolio   Portfolio?
  aiUsageLogs AIUsageLog[]

  @@map("users")
}

enum Plan {
  FREE
  PRO

  @@map("plan")
}

// ─────────────────────────────────────────────
// EMPRESAS
// ─────────────────────────────────────────────

model Company {
  id          String  @id @default(cuid())
  ticker      String  @unique
  name        String
  cik         String? @unique // SEC CIK identifier (ex: "0000320193" para AAPL)
  exchange    String  // "NASDAQ", "NYSE", "NYSEARCA", etc.
  sector      String?
  industry    String?
  country     String  @default("US")
  currency    String  @default("USD") // moeda de reporte (importante para empresas com ADR)
  logoUrl     String?
  description String? @db.Text
  website     String?
  employees   Int?
  isActive    Boolean @default(true)

  // Controlo de actualização
  lastFundamentalsUpdate DateTime?
  lastPriceUpdate        DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relações
  fundamentals   Fundamental[]
  prices         Price[]
  aiInsightCache AIInsightCache?
  portfolioItems PortfolioItem[]

  @@index([ticker])
  @@index([exchange])
  @@index([sector])
  @@map("companies")
}

// ─────────────────────────────────────────────
// DADOS FINANCEIROS FUNDAMENTAIS
// ─────────────────────────────────────────────

model Fundamental {
  id        String @id @default(cuid())
  companyId String

  // Período
  periodType    PeriodType
  fiscalYear    Int
  fiscalQuarter Int? // 1, 2, 3 ou 4 — null para períodos anuais
  periodEnd     DateTime // data de fim do período fiscal
  filedAt       DateTime? // data de filing no SEC

  // ── Income Statement ──────────────────────
  revenue           Decimal? @db.Decimal(20, 4) // receita total
  costOfRevenue     Decimal? @db.Decimal(20, 4) // custo dos bens/serviços
  grossProfit       Decimal? @db.Decimal(20, 4) // receita - custo (pode vir do EDGAR ou calculado)
  operatingExpenses Decimal? @db.Decimal(20, 4) // despesas operacionais (sem custo de receita)
  operatingIncome   Decimal? @db.Decimal(20, 4) // EBIT
  interestExpense   Decimal? @db.Decimal(20, 4)
  taxExpense        Decimal? @db.Decimal(20, 4)
  netIncome         Decimal? @db.Decimal(20, 4)
  epsDiluted        Decimal? @db.Decimal(10, 4) // earnings per share, diluted
  sharesOutstanding Decimal? @db.Decimal(20, 4) // acções em circulação (weighted average diluted)

  // ── Cash Flow Statement ───────────────────
  operatingCashFlow Decimal? @db.Decimal(20, 4) // Operating CF
  capex             Decimal? @db.Decimal(20, 4) // Capital Expenditures (sempre positivo)
  freeCashFlow      Decimal? @db.Decimal(20, 4) // calculado: operatingCashFlow - capex

  // ── Balance Sheet ─────────────────────────
  totalAssets         Decimal? @db.Decimal(20, 4)
  totalCurrentLiab    Decimal? @db.Decimal(20, 4) // passivo corrente (necessário para ROIC)
  longTermDebt        Decimal? @db.Decimal(20, 4)
  totalDebt           Decimal? @db.Decimal(20, 4) // short + long term debt
  cash                Decimal? @db.Decimal(20, 4) // cash + short-term investments
  totalEquity         Decimal? @db.Decimal(20, 4) // stockholders equity

  // ── Métricas calculadas (guardadas para performance) ──
  grossMargin       Decimal? @db.Decimal(8, 6) // grossProfit / revenue (ex: 0.430000 = 43%)
  operatingMargin   Decimal? @db.Decimal(8, 6) // operatingIncome / revenue
  netMargin         Decimal? @db.Decimal(8, 6) // netIncome / revenue
  roic              Decimal? @db.Decimal(8, 6) // return on invested capital
  returnOnEquity    Decimal? @db.Decimal(8, 6) // netIncome / totalEquity

  // ── Dividendos ────────────────────────────
  dividendPerShare Decimal? @db.Decimal(10, 4)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relações
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  // Constraint: uma linha por empresa + tipo de período + ano + trimestre
  @@unique([companyId, periodType, fiscalYear, fiscalQuarter])
  @@index([companyId, periodEnd])
  @@index([companyId, periodType, fiscalYear])
  @@map("fundamentals")
}

enum PeriodType {
  QUARTERLY
  ANNUAL

  @@map("period_type")
}

// ─────────────────────────────────────────────
// PREÇOS HISTÓRICOS EOD
// ─────────────────────────────────────────────

model Price {
  ticker  String
  date    DateTime @db.Date
  open    Decimal? @db.Decimal(12, 4)
  high    Decimal? @db.Decimal(12, 4)
  low     Decimal? @db.Decimal(12, 4)
  close   Decimal  @db.Decimal(12, 4)
  volume  BigInt?

  // Relação
  company Company @relation(fields: [ticker], references: [ticker])

  // Chave primária composta = índice composto automático
  // Garante unicidade (ticker, date) e performance em queries filtradas por ticker + intervalo de datas
  @@id([ticker, date])
  @@map("prices")
}

// ─────────────────────────────────────────────
// PORTFÓLIO / WATCHLIST
// (MVP: portfólio = watchlist, sem tracking de preço de compra)
// ─────────────────────────────────────────────

model Portfolio {
  id        String   @id @default(cuid())
  userId    String   @unique // um portfólio por utilizador no MVP
  name      String   @default("O Meu Portfólio")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relações
  user  User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  items PortfolioItem[]

  @@map("portfolios")
}

model PortfolioItem {
  id          String   @id @default(cuid())
  portfolioId String
  companyId   String
  addedAt     DateTime @default(now())

  // Relações
  portfolio Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  company   Company   @relation(fields: [companyId], references: [id])

  @@unique([portfolioId, companyId]) // não duplicar empresas no mesmo portfólio
  @@index([portfolioId])
  @@map("portfolio_items")
}

// ─────────────────────────────────────────────
// AI INSIGHTS (CACHE)
// ─────────────────────────────────────────────

model AIInsightCache {
  id        String @id @default(cuid())
  companyId String @unique

  // Conteúdo da análise (guardado em texto)
  executiveSummary String @db.Text
  moat             String @db.Text
  catalysts        String @db.Text // JSON array serializado: ["catalisador 1", "catalisador 2", ...]
  risks            String @db.Text // JSON array serializado: ["risco 1", "risco 2", ...]

  // Metadata
  modelVersion String // ex: "gemini-1.5-flash"
  generatedAt  DateTime @default(now())
  expiresAt    DateTime // generatedAt + 24h

  // Relação
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId, expiresAt])
  @@map("ai_insight_cache")
}

// ─────────────────────────────────────────────
// CONTROLO DE USO DE AI (por utilizador/dia)
// ─────────────────────────────────────────────

model AIUsageLog {
  id        String   @id @default(cuid())
  userId    String
  ticker    String // para analytics — que empresas são mais analisadas
  usedAt    DateTime @default(now())

  // Relação
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, usedAt]) // para contar análises de um user num dia específico
  @@map("ai_usage_logs")
}
```

---

## Notas sobre o schema

### Tipos numéricos

Todos os valores monetários usam `Decimal` (não `Float`) para evitar erros de precisão em aritmética financeira. `@db.Decimal(20, 4)` suporta valores até 9.999.999.999.9999 (em USD billions, chega de sobra para qualquer empresa).

As percentagens/rácios usam `@db.Decimal(8, 6)` — ex: `0.430000` = 43%. Sempre guardar como decimal, converter para percentagem no frontend.

### Auth e Supabase

O Supabase Auth gere as sessões (login, registo, tokens JWT). A tabela `users` é gerida por nós mas deve ser sincronizada com a tabela `auth.users` do Supabase via trigger SQL ou via webhook.

**Setup no Supabase:** criar um trigger que insere em `public.users` quando um novo utilizador se regista via Supabase Auth:

```sql
-- trigger no Supabase
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Preços (tabela `prices`)

Os preços históricos EOD estão na tabela `Price` com chave primária composta `(ticker, date)`. Este índice composto é criado automaticamente pelo PostgreSQL e garante:
- Unicidade: não há duplicados para o mesmo ticker + data
- Performance: queries filtradas por ticker e intervalo de datas em <5ms mesmo com milhões de linhas

Query típica para o price chart:
```typescript
const prices = await prisma.price.findMany({
  where: {
    ticker: 'AAPL',
    date: { gte: new Date('2024-01-01') } // filtrar por período
  },
  orderBy: { date: 'asc' },
  select: { date: true, close: true } // só os campos necessários para o gráfico
})
```

O preço actual (on-demand) não está na BD — é chamado ao Finnhub quando o utilizador abre a página.

### Índices

Os índices mais importantes para performance:
- `companies(ticker)` — pesquisa de ticker, feita em todos os page loads
- `fundamentals(companyId, periodEnd)` — buscar todos os dados de uma empresa ordenados por data
- `fundamentals(companyId, periodType, fiscalYear)` — filtrar por Quarterly/Annual
- `ai_usage_logs(userId, usedAt)` — contar análises de IA de um user num dia

### PortfolioItem vs Watchlist

No MVP não há distinção entre portfólio e watchlist — é tudo a mesma tabela. Quando v1 adicionar tracking de preço de compra, acrescenta-se os campos `purchasePrice`, `purchaseDate`, `quantity` ao `PortfolioItem`.

---

## Migrations

**Nunca alterar a BD directamente.** Sempre via:

```bash
# desenvolvimento local
npx prisma migrate dev --name nome_da_migration

# produção (via CI/CD ou manual)
npx prisma migrate deploy
```

**Seed inicial:**

```bash
npx prisma db seed
```

O script de seed (`prisma/seed.ts`) deve inserir as ~500 empresas do S&P 500 na tabela `Company` com ticker, nome, CIK e sector.

---

## Queries mais frequentes

### Price chart — histórico de preços de uma empresa

```typescript
// Preços do último ano para o gráfico de price history
const prices = await prisma.price.findMany({
  where: {
    ticker: 'AAPL',
    date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
  },
  orderBy: { date: 'asc' },
  select: { date: true, close: true, volume: true }
})
```

### Página de stock — fundamentais de uma empresa

```typescript
// Buscar todos os dados trimestrais de uma empresa (para o Decision Engine)
const fundamentals = await prisma.fundamental.findMany({
  where: {
    company: { ticker: 'AAPL' },
    periodType: 'QUARTERLY',
  },
  orderBy: { periodEnd: 'asc' },
  take: 60, // últimos 15 anos = 60 trimestres
})
```

### Portfólio — empresas de um utilizador

```typescript
const portfolio = await prisma.portfolio.findUnique({
  where: { userId: session.user.id },
  include: {
    items: {
      include: { company: true },
      orderBy: { addedAt: 'desc' },
    },
  },
})
```

### AI Insights — verificar cache antes de chamar Gemini

```typescript
const cache = await prisma.aIInsightCache.findFirst({
  where: {
    company: { ticker },
    expiresAt: { gt: new Date() }, // ainda não expirou
  },
})

if (cache) return cache // serve do cache

// senão, chamar Gemini e guardar o resultado
```

### Controlo de uso de AI — contar análises hoje

```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)

const usageToday = await prisma.aIUsageLog.count({
  where: {
    userId: session.user.id,
    usedAt: { gte: today },
  },
})

if (usageToday >= DAILY_LIMIT) throw new Error('Limite diário atingido')
```
