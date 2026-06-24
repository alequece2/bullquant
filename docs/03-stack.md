# BullQuant — Stack e Decisões Técnicas

## Stack Completa

| Camada | Tecnologia | Versão alvo |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | 15+ |
| Estilos | Tailwind CSS | 4+ |
| Componentes UI | shadcn/ui | latest |
| Charts | Recharts | 2+ |
| ORM | Prisma | 6+ |
| Base de dados | PostgreSQL via Supabase | — |
| Auth | Supabase Auth | — |
| Hosting app | Vercel | — |
| IA | Google Gemini API (`gemini-1.5-flash`) | — |
| i18n | next-intl | 3+ |
| Jobs de dados | GitHub Actions (scripts Python) | — |
| Validação (forms) | Zod + React Hook Form | — |
| HTTP client | native fetch (Next.js server actions / route handlers) | — |

---

## Decisões e Justificações

### Next.js (App Router) + TypeScript

**Porquê:**
- O mockup de referência (repo do Costa) já é Next.js — confirma que a escolha é adequada
- App Router com Server Components: renderização no servidor por defeito, bom para SEO e para esconder chamadas a APIs externas
- API Routes integradas: não precisa de Express ou servidor separado
- TypeScript + Prisma é uma das melhores combinações para vibe coding com IA — o tipo do schema propaga-se para o frontend automaticamente
- Deploy zero-config no Vercel

**Alternativas consideradas e descartadas:**
- React + Vite + Express (stack do gestArtes): dois processos separados, mais complexo para hospedar, não tem SSR nativo
- Remix: bom mas menos adopted, menos exemplos para a IA usar

### Supabase (PostgreSQL + Auth)

**Porquê:**
- PostgreSQL gerido: zero configuração de servidor
- Auth integrado: resolve registo, login, reset de password, sessões — sem escrever JWT à mão
- Dashboard visual para ver os dados da BD (útil para debugging)
- Prisma conecta directamente ao PostgreSQL do Supabase (connection string standard)
- Free tier: 500MB BD + 1GB storage + 50K utilizadores auth — chega para o MVP

**Nota importante sobre o free tier:**
- 500MB de BD cobre confortavelmente o MVP: users + fundamentais de 1.000 empresas + preços históricos de 1.000 empresas = ~230MB total
- PostgreSQL com índices correctos gere 3.8M linhas de preços em <5ms por query — não é necessário separar preços para object storage

**Alternativas consideradas e descartadas:**
- Oracle Cloud (Autonomous DB): Oracle SQL ≠ PostgreSQL, Prisma não suporta Oracle
- Oracle Cloud (self-hosted PostgreSQL em VM ARM): tecnicamente funciona mas requer gerir servidor — desnecessariamente complexo para vibe coding
- Neon: PostgreSQL serverless, bom, mas free tier 500MB é o mesmo e tem menos features de auth
- PlanetScale: MySQL, já não tem free tier permanente

### Cloudflare R2 (futuro — não no MVP)

R2 é object storage da Cloudflare (como S3, mas sem egress fees). **Não é necessário no MVP.**

A razão pela qual foi considerado inicialmente — guardar preços históricos como ficheiros JSON por empresa — está errada. PostgreSQL com índice composto `(ticker, date)` serve queries de preços históricos em <5ms, não tem race conditions, e 1.000 empresas × 15 anos de preços EOD cabem em ~190MB na BD.

**Quando R2 fará sentido no futuro:**
- Guardar PDFs de relatórios anuais
- Guardar imagens / logos de empresas em alta resolução
- Backups/snapshots da BD
- Qualquer ficheiro binário ou blob grande

Não usar para dados que precisem de `WHERE`, `ORDER BY`, ou filtros — esses ficam sempre em SQL.

### Vercel

**Porquê:**
- Deploy automático com push para GitHub (zero config)
- CDN global incluído
- Vercel Cron Jobs disponível (para jobs periódicos simples)
- Preview deployments por pull request — útil para code review
- Free tier generoso (Hobby plan): suficiente para o MVP

**Limitação conhecida:**
- Vercel Cron Jobs (Hobby): mínimo de 1 execução por dia — suficiente para actualizar dados EOD
- Se precisar de crons mais frequentes, usar GitHub Actions

### GitHub Actions (scripts Python de ingestão)

**Porquê:**
- Os scripts de ingestão de dados são Python (SEC EDGAR parser, Polygon.io fetcher)
- Gratuito para repos públicos (2000 minutos/mês para privados)
- Corre em schedule (`cron: '0 6 * * *'` = todos os dias às 6h UTC)
- Completamente separado da app Next.js — não mistura responsabilidades

**O que os scripts fazem:**
1. `ingest_fundamentals.py`: chama SEC EDGAR, parseia JSON, upsert na tabela `Fundamental` (via Supabase client Python)
2. `ingest_prices.py`: chama Polygon.io, upsert na tabela `Price` em Supabase

### Prisma

**Porquê:**
- Já usado no gestArtes — equipa familiar (mesmo que via IA)
- Type-safe: os tipos do schema propagam-se para todo o código TypeScript
- Migrations controladas — nunca alterar a BD directamente
- Studio (GUI) para ver e editar dados localmente
- Excelente contexto para IA: a IA consegue raciocinar sobre o schema com precisão

**Regra de ouro:** nunca alterar a BD directamente. Sempre migration (`prisma migrate dev`).

### Google Gemini API (`gemini-1.5-flash`)

**Porquê:**
- A equipa já usa Gemini — familiaridade
- `gemini-1.5-flash` é significativamente mais rápido e mais barato que Pro para análise de texto
- Free tier: 15 requests/minuto, 1M tokens/dia — suficiente para o MVP com cache
- Output em JSON estruturado (via `responseMimeType: "application/json"`)

**Controlo de custos:**
- Cache de 24h por empresa: se a análise já foi gerada hoje, não chama o Gemini
- Limite de análises por utilizador por dia (free tier: ~5)
- Prompt curto + output estruturado = baixo consumo de tokens

### next-intl (i18n)

**Porquê:**
- Português primário, Inglês em v1, outros depois
- Estrutura de i18n tem de existir desde o início — adicionar depois é dor a sério
- `next-intl` integra nativamente com Next.js App Router
- Strings em ficheiros JSON separados: `messages/pt.json`, `messages/en.json`

**Implicação prática:**
- Todos os textos de UI (labels, mensagens, tooltips) vão para ficheiros de tradução — nunca hardcoded em JSX
- Dados financeiros (nomes de empresas, tickers) ficam como estão (inglês)

---

## O que NÃO usar e porquê

| Tecnologia | Motivo |
|---|---|
| **Oracle Autonomous Database** | Oracle SQL ≠ PostgreSQL. Prisma não suporta Oracle. Incompatível. |
| **Oracle Cloud self-hosted** | Requer gerir servidor manualmente (updates, backups, segurança). Complexidade desnecessária para vibe coding. |
| **Express separado** | Next.js API Routes / Server Actions substituem completamente. Dois processos = mais complexidade de deploy e debug. |
| **Socket.IO / WebSockets** | O "1s polling" do mockup rebenta com free tiers. Para value investing, 60s chega. |
| **yfinance** | Biblioteca não-oficial do Yahoo Finance. Yahoo proíbe uso comercial nos ToS. Usar Polygon.io. |
| **Scraper europeu (Python)** | Scrapers quebram e ficam bloqueados. Cada bolsa europeia tem estruturas de dados diferentes. Europa completa → v2 com API paga. |
| **MSSQL** | PostgreSQL tem melhor ecossistema cloud, é mais barato e tem melhor suporte em Prisma. |
| **Redis** | Ainda não. Caching começa em PostgreSQL. Redis só se houver problemas de performance real. |
| **React Query / TanStack Query** | Útil mas adiciona complexidade. Server Components do Next.js resolvem a maioria dos casos. Adicionar se necessário. |

---

## Arquitectura de alto nível

```
┌─────────────────────────────────────────────────────┐
│                    VERCEL (app)                      │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │          Next.js App (App Router)            │    │
│  │                                              │    │
│  │  /app                 /app/api               │    │
│  │  ├── (auth)/          ├── price/[ticker]     │    │
│  │  ├── portfolio/       ├── prices/[ticker]    │    │
│  │  ├── stock/[ticker]/  ├── fundamentals/      │    │
│  │  ├── dcf/             ├── ai-insights/       │    │
│  │  └── ai-insights/     └── search/            │    │
│  └──────────────┬────────────────────────────────    │
└─────────────────┼───────────────────────────────────┘
                  │
                  ▼
        ┌──────────────────┐
        │     Supabase     │
        │   PostgreSQL     │
        │                  │
        │  users           │
        │  companies       │
        │  fundamentals    │
        │  prices  ←───────┼── índice composto (ticker, date)
        │  portfolios      │
        │  ai_cache        │
        └──────────────────┘
                  ▲
                  │ (escrita via scripts Python)
                  │
┌─────────────────────────────────────────┐
│           GitHub Actions (cron)          │
│                                          │
│  ingest_fundamentals.py                 │
│  ├── Chama SEC EDGAR API                │
│  ├── Parseia campos XBRL                │
│  └── Upsert → tabela fundamentals       │
│                                          │
│  ingest_prices.py                       │
│  ├── Chama Polygon.io EOD               │
│  └── Upsert → tabela prices             │
└─────────────────────────────────────────┘

APIs externas (só o backend as chama, nunca o browser):
├── SEC EDGAR: fundamentais históricos (gratuito)
├── Polygon.io: preços EOD históricos (gratuito)
├── Finnhub: preço actual on-demand (gratuito)
└── Google Gemini: AI Insights (gratuito com limite)
```

---

## Variáveis de ambiente necessárias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # só no servidor, nunca exposto ao browser

# APIs externas
FINNHUB_API_KEY=
POLYGON_API_KEY=
GEMINI_API_KEY=

# next-intl
NEXT_PUBLIC_DEFAULT_LOCALE=pt
```

---

## Nota sobre vibe coding

A equipa usa IA para gerar todo o código. Isto muda as prioridades:

**O schema Prisma e o sitemap são os artefactos mais críticos** — são o contexto que a IA usa para gerar código coerente. Um schema mal pensado multiplica inconsistências em cascata.

**Simplicidade > poder** — cada camada extra (Redis, message queue, microservices, etc.) é mais superfície para bugs que a IA não consegue diagnosticar sozinha.

**Serviços geridos > self-hosted** — quando algo corre mal com um serviço gerido (Supabase, Vercel, R2), há documentação e suporte. Com self-hosted é uma VM a arder que ninguém sabe debugar.

**Reviews são obrigatórias** — o código gerado por IA funciona mas não é sempre consistente. Antes de cada merge, alguém tem de rever se o código novo é coerente com o schema, com as rotas existentes e com o resto da app. No gestArtes fizeram isto com GitHub Copilot code review — aqui é igual.
