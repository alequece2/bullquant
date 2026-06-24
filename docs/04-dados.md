# BullQuant — Estratégia de Dados

## Princípio base

Dados financeiros de qualidade têm custo. A estratégia para 0€ assenta em dois pilares:
1. **Ir às fontes primárias oficiais** — não a intermediários (MacroTrends, Yahoo scraping, etc.)
2. **Cachear tudo em PostgreSQL** — o utilizador nunca fala directamente com APIs externas; todos os dados históricos ficam em Supabase com índices correctos

---

## Estimativas de tamanho (dados normalizados, sem contaminação)

> "Contaminação" = coisas que NÃO guardamos: notas de rodapé EDGAR, dados intraday, raw JSON do EDGAR, campos que não usamos.

| Escala | Fundamentais | Preços EOD | Users + Portfolios | Total em Supabase |
|---|---|---|---|---|
| 500 empresas (MVP) | ~20MB | ~95MB | ~5MB | **~120MB** |
| 1.000 empresas | ~40MB | ~190MB | ~10MB | **~240MB** |
| 5.000 empresas (v1/v2) | ~200MB | ~950MB | ~20MB | **~1,2GB** |

**Breakpoints do Supabase:**
- Free tier (500MB): aguenta confortavelmente até ~1.000 empresas (~240MB)
- Pro tier (~25€/mês, 8GB): aguenta até ~5.000+ empresas
- Para o MVP (~500-1.000 empresas): **0€, sem pagar nada**

**Porquê tudo em PostgreSQL (e não separar preços para object storage):**
- PostgreSQL com índice composto `(ticker, date)` faz queries de price history em <5ms
- 3.8M linhas (1.000 empresas × 15 anos) é trivial para uma BD moderna
- Upsert atómico: sem race conditions na ingestão diária
- Uma única fonte de verdade: não há sincronização entre BD e ficheiros externos

---

## Fontes de dados

### 1. Fundamentais históricos — SEC EDGAR API

**O que é:** API pública e gratuita do regulador americano com todos os relatórios financeiros (10-K anual, 10-Q trimestral) de todas as empresas cotadas nos EUA. É a fonte primária de onde o Qualtrim, FMP, MacroTrends e praticamente todos os serviços de dados financeiros extraem os fundamentais US.

**Endpoint principal:**
```
GET https://data.sec.gov/api/xbrl/companyfacts/{CIK}.json
```
Onde `CIK` é o identificador da empresa no SEC (ex: AAPL = 0000320193).

**Para obter o CIK a partir do ticker:**
```
GET https://efts.sec.gov/LATEST/search-index?q=%22AAPL%22&dateRange=custom&startdt=2020-01-01&enddt=2020-12-31&forms=10-K
```
Ou mais simples, via o ficheiro de mapeamento estático:
```
GET https://www.sec.gov/files/company_tickers.json
```
Este ficheiro tem todos os CIKs e tickers — fazer download uma vez e guardar na BD.

**Campos disponíveis (os que nos interessam):**

```
us-gaap/
├── Revenues (ou RevenueFromContractWithCustomerExcludingAssessedTax)
├── CostOfGoodsSoldAndServicesSold (ou CostOfRevenue)
├── GrossProfit
├── OperatingExpenses
├── OperatingIncomeLoss
├── NetIncomeLoss
├── EarningsPerShareDiluted
├── CommonStockSharesOutstanding
├── NetCashProvidedByUsedInOperatingActivities
├── PaymentsToAcquirePropertyPlantAndEquipment  → CapEx
├── Assets
├── LiabilitiesAndStockholdersEquity
├── LongTermDebt
├── CashAndCashEquivalentsAtCarryingValue
├── StockholdersEquity
└── CommonStockDividendsPerShareDeclared
```

**Atenção à taxonomia:** o EDGAR usa tags XBRL e nem todas as empresas usam exactamente o mesmo tag para o mesmo conceito. Por exemplo, Revenue pode ser `Revenues`, `RevenueFromContractWithCustomerExcludingAssessedTax`, `SalesRevenueNet`, etc. O script de ingestão tem de tentar múltiplos tags por ordem de preferência.

**Rate limits:** o SEC pede que se identifique com um User-Agent (nome + email) e não se façam mais de 10 requests/segundo. Para o script de ingestão inicial do S&P 500 (500 companies), usar sleep de 0.2s entre requests.

**Campos calculados (derivados, não vêm do EDGAR directamente):**
```
Free Cash Flow         = Operating Cash Flow − CapEx
Gross Margin           = Gross Profit / Revenue
Operating Margin       = Operating Income / Revenue
Net Margin (Profit M.) = Net Income / Revenue
ROIC                   = NOPAT / Invested Capital
                         onde NOPAT = Operating Income × (1 − Tax Rate)
                         e Invested Capital = Total Assets − Current Liabilities − Cash
FCF Yield              = Free Cash Flow / Market Cap  (precisa do preço actual)
CAGR                   = (valor_final / valor_inicial) ^ (1 / nº_anos) − 1
```

**Cobertura:** todas as empresas US. Empresas europeias com ADR nos EUA (ASML, SAP, LVMH, Nestlé, Shell, HSBC, etc.) também estão no EDGAR via filing 20-F, mas com menos campos padronizados.

---

### 2. Preços EOD históricos — Polygon.io

**O que é:** API de dados de mercado com um free tier permanente que inclui preços históricos EOD (End of Day) ilimitados para empresas US.

**Endpoint:**
```
GET https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}?apiKey={KEY}
```

**Exemplo:**
```
GET https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2010-01-01/2025-06-01?adjusted=true&apiKey=...
```

**Response:**
```json
{
  "results": [
    { "t": 1262390400000, "o": 214.0, "h": 215.5, "l": 212.0, "c": 213.5, "v": 70200000 },
    ...
  ]
}
```
Onde `t` é timestamp Unix em ms, `o/h/l/c` são open/high/low/close, `v` é volume.

**Como guardar (Supabase PostgreSQL — tabela `prices`):**

O script de ingestão converte o timestamp Unix em data e faz upsert linha a linha:

```python
# Para cada resultado do Polygon.io:
date = datetime.fromtimestamp(result['t'] / 1000).strftime('%Y-%m-%d')

supabase.table('prices').upsert({
    'ticker': ticker,
    'date': date,
    'open': result['o'],
    'high': result['h'],
    'low': result['l'],
    'close': result['c'],
    'volume': result['v']
}).execute()
```

`upsert` = inserir se não existe, actualizar se existe. Sem race conditions, sem ficheiros corrompidos.

**Rate limits free tier:** 5 requests/minuto. Para ingestão inicial de 500 empresas: usar sleep de 13s entre requests (≈ 40 minutos para as 500). Correr em background (GitHub Actions).

**Actualização diária:** o script só pede os dias novos (SELECT MAX(date) FROM prices WHERE ticker = 'AAPL' → pedir a partir daí), não o histórico completo. Muito mais rápido.

---

### 3. Preço actual — Finnhub

**O que é:** API de dados de mercado com free tier que inclui preço actual com 15-minutos de delay para o mercado global, e tempo-real para US via IEX.

**Endpoint:**
```
GET https://finnhub.io/api/v1/quote?symbol={ticker}&token={KEY}
```

**Response:**
```json
{
  "c": 213.49,   // current price
  "d": -1.51,    // change
  "dp": -0.70,   // percent change
  "h": 215.0,    // high today
  "l": 211.5,    // low today
  "o": 214.5,    // open today
  "pc": 215.0    // previous close
}
```

**Como usar:**
- Nunca em batch para todas as empresas em background
- Só quando o utilizador abre uma página de stock (`/stock/[ticker]`)
- Backend faz a chamada a Finnhub e serve ao frontend (a API key nunca vai ao browser)
- Frontend polling ao próprio backend a cada 60s **enquanto o utilizador está na página** (via `useEffect` com `setInterval` + cleanup)

**Rate limits free tier:** 60 calls/minuto — mais que suficiente para este padrão de uso.

**Campos adicionais úteis do Finnhub (gratuitos):**
- Earnings dates: `GET /earnings-calendar?from=...&to=...&symbol=...`
- Insider trading: `GET /stock/insider-transactions?symbol=...` (v1)
- News sentiment: `GET /company-news?symbol=...` (v1)

---

### 4. AI Insights — Google Gemini API

**Modelo:** `gemini-1.5-flash` (mais rápido e mais barato que Pro para análise de texto)

**Free tier:** 15 requests/minuto, 1 milhão de tokens/dia — mais que suficiente com cache.

**Prompt base (em português):**
```
És um analista de investimentos especializado em value investing.
Analisa a empresa {company_name} ({ticker}), do sector {sector}.

Responde APENAS em JSON válido com esta estrutura exacta:
{
  "executive_summary": "3-5 frases sobre o negócio actual e posição competitiva",
  "moat": "2-4 frases sobre a vantagem competitiva sustentável da empresa",
  "catalysts": ["catalisador 1", "catalisador 2", "catalisador 3"],
  "risks": ["risco 1", "risco 2", "risco 3"]
}

A análise deve ser em português de Portugal.
Foca-te em factos, não em especulação. Sê directo e informativo.
Aviso obrigatório no final do executive_summary: 'Esta análise é informativa e não constitui conselho de investimento.'
```

**Controlo de custos:**
- Cache de 24h: verificar `AIInsightCache` antes de chamar o Gemini
- Limite de análises por utilizador por dia: verificar `AIUsageLog`
- Se a empresa é desconhecida para o Gemini, responder com "Dados insuficientes para análise" em vez de alucinar

---

## Arquitectura de ingestão

### Script 1: `ingest_fundamentals.py`

```
Trigger: GitHub Actions cron — 1x por semana (domingo às 3h UTC)
         + manualmente quando se adiciona empresas novas

Fluxo:
1. Ler lista de empresas activas da BD (ticker + CIK)
2. Para cada empresa:
   a. GET https://data.sec.gov/api/xbrl/companyfacts/{CIK}.json
   b. Extrair campos relevantes (com fallback entre múltiplos tags XBRL)
   c. Calcular FCF, margens, ROIC
   d. Upsert na tabela Fundamental (criar se não existe, actualizar se existe)
   e. Sleep 0.2s (respeitar rate limits do SEC)
3. Actualizar Company.lastFundamentalsUpdate
4. Log de erros (empresas sem dados, campos em falta, etc.)
```

### Script 2: `ingest_prices.py`

```
Trigger: GitHub Actions cron — todos os dias às 6h UTC (após fecho do mercado US)

Fluxo:
1. Ler lista de empresas activas da BD
2. Para cada empresa:
   a. SELECT MAX(date) FROM prices WHERE ticker = '{ticker}'
   b. Se a última data é hoje (ou ontem para não-trading days): skip
   c. GET Polygon.io desde última data até hoje
   d. Para cada resultado: upsert na tabela prices (ticker, date, open, high, low, close, volume)
   e. Sleep 13s (5 requests/minuto = 12s mínimo, 13s para segurança)
3. Actualizar Company.lastPriceUpdate
```

### Script 3: `seed_companies.py`

```
Trigger: manual (uma vez no início)

Fluxo:
1. Download de https://www.sec.gov/files/company_tickers.json → mapeamento CIK→ticker
2. Filtrar por S&P 500 (lista hardcoded de 500 tickers)
3. Inserir na tabela Company (ticker, nome, CIK, exchange, sector, industry)
4. Para cada empresa:
   a. Tentar buscar logo (Finnhub tem endpoint de logo gratuito)
   b. Guardar logoUrl na Company
```

---

## Fluxo completo por feature

### Quando o utilizador abre `/stock/AAPL`

```
1. Next.js Server Component
   ├── Prisma query: Company WHERE ticker = 'AAPL'
   ├── Prisma query: Fundamental WHERE companyId = ... ORDER BY periodEnd DESC
   └── Prisma query: Price WHERE ticker = 'AAPL' ORDER BY date ASC (últimos 15 anos)

2. Next.js API Route: GET /api/price/AAPL
   └── Fetch Finnhub: /quote?symbol=AAPL (preço actual)

3. Frontend:
   ├── Renderiza tudo com dados do Server Component
   └── Polling /api/price/AAPL a cada 60s (useEffect + setInterval)
```

### Quando o utilizador pede AI Insights para AAPL

```
1. Frontend: POST /api/ai-insights { ticker: 'AAPL' }

2. Next.js API Route:
   ├── Verificar AIUsageLog: utilizador já usou X análises hoje?
   │   └── Se sim: return 429 Too Many Requests
   ├── Verificar AIInsightCache: existe cache não-expirada para AAPL?
   │   └── Se sim: return cache (instantâneo)
   └── Chamar Gemini API com o prompt
       ├── Parsear JSON da response
       ├── Guardar em AIInsightCache (TTL 24h)
       ├── Registar em AIUsageLog
       └── Return ao frontend

3. Frontend:
   ├── Loading state enquanto aguarda (~5-15s)
   └── Renderiza os 4 blocos (summary, moat, catalysts, risks)
```

---

## O que NÃO guardar (fontes de contaminação a evitar)

| Dado | Porquê NÃO guardar |
|---|---|
| Notas de rodapé EDGAR (texto dos relatórios) | Enorme, irrelevante para os gráficos, aumenta o tamanho 10x |
| Raw JSON do EDGAR | Milhares de campos que não usamos; extrair só o que precisamos |
| Dados intraday (1min, 5min) | 252x mais dados que EOD, caro, desnecessário para value investing |
| Forward earnings / estimativas de analistas | Não disponível a 0€ de forma fiável |
| Notícias / sentiment | v1 (Finnhub tem endpoint gratuito quando for necessário) |
| Transcrições de earnings calls | Caro, fora do scope |
