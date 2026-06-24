# BullQuant — Documento de Planeamento

> Versão 1.0 — Junho 2026  
> Equipa: Alex, Costa, Nando (Bullocracy)  
> Estado: Fase de Planeamento — pré-desenvolvimento

---

## 1. Visão do Produto

**BullQuant** é uma plataforma web de análise fundamental de ações, orientada para retail investors de nível iniciante a intermédio que praticam (ou querem aprender) value investing.

O objetivo central é dar ao utilizador uma visão clara, visual e histórica dos fundamentais de uma empresa — sem o ruído e sem o custo das plataformas institucionais — e ferramentas para tomar decisões de investimento mais fundamentadas (DCF, AI Insights, portfólio pessoal).

A distribuição inicial é feita pela audiência da **Bullocracy**, que funciona como canal de aquisição orgânico — o mesmo modelo que o Qualtrim (referência principal) usou para crescer via YouTube/Discord.

---

## 2. Público-Alvo

| Atributo | Definição |
|---|---|
| Tipo | Retail investor individual |
| Nível | Iniciante a intermédio |
| Foco | Value investing / análise fundamental |
| Geografia | PT/UE (mercado), dados US-first |
| Idioma | Português (primário), Inglês (2ª fase), outros depois |
| Canal de aquisição | Audiência da Bullocracy (alcance viral) |

**O que eles precisam:**
- Ver 10-15 anos de fundamentais de forma visual e limpa (Revenue, EPS, FCF, ROIC…)
- Calcular se uma ação está sub ou sobreavaliada (DCF)
- Perceber o "porquê" qualitativo de uma empresa (AI Insights)
- Acompanhar o próprio portfólio / watchlist

**O que NÃO são:**
- Day traders (não precisam de cotações ao milissegundo)
- Quants (não precisam de backtesting ou screening avançado — pelo menos no início)
- Investidores profissionais (não precisam de dados institucionais caros)

---

## 3. Análise da Concorrência

### Referência principal: Qualtrim

| Aspeto | Qualtrim | BullQuant (objetivo) |
|---|---|---|
| Foco | Value investing, fundamentais | Idem |
| Dados | 10+ anos, US + algumas EU | 15 anos, US-first |
| DCF | Sim, integrada | Sim, integrada |
| AI | Não (resumo editorial manual) | Sim (Gemini) |
| Idioma | Inglês | Português (primário), Inglês depois |
| Preço | ~$9.99/mês | Gratuito no início |
| Distribuição | Joseph Carlson (YouTube/Discord) | Bullocracy |
| Empresa | 1 pessoa, sem funding | 3 pessoas, sem funding |

**Vantagem do BullQuant vs Qualtrim:** AI Insights genuína, gratuito, em português (se for essa a aposta), e distribuição via comunidade própria.

**Desvantagem honesta:** Qualtrim tem vários anos de dados curados, bugs resolvidos e audiência estabelecida. Não se ganha isso num verão — ganha-se com consistência.

---

## 4. Features

### Critério de priorização

- **MVP (este verão):** funcionalidades sem as quais o produto não existe
- **v1 (pós-lançamento):** funcionalidades que fazem os utilizadores voltar
- **v2 (com receita):** funcionalidades que justificam pagar

---

### MVP — Lançar este verão

| # | Feature | Descrição |
|---|---|---|
| 1 | **Auth** | Registo, login, perfil. Via Supabase Auth. |
| 2 | **Pesquisa de ticker** | Pesquisar empresa por nome ou ticker (US). Autocomplete. |
| 3 | **Página de stock** | Ver fundamentais, histórico de preços e Decision Engine de uma empresa. |
| 3a | Preço atual | Preço live, variação diária, market cap. Atualiza a cada 60s enquanto o user está na página. |
| 3b | Fundamentais (snapshot) | Valuation (P/E, EV/EBITDA…), Cash Flow (FCF, FCF Yield…), Margins (Profit, Operating…), Balance (Cash, Debt…), Dividend (Yield, Payout…). |
| 3c | Price History | Gráfico histórico de preço (1M, 6M, 1Y, 5Y, MAX). |
| 3d | Financials & Decision Engine | Grelha de gráficos históricos (15 anos): Revenue, EPS Diluted, ROIC, FCF, Shares Outstanding, Net Income, Cash & Debt, Profit Margin, Operating Cash Flow. Com badge de categoria (Top-Line, Capital Efficiency, etc.) e linha de target (ex: ROIC > 15%). |
| 4 | **Portfólio / Watchlist** | Adicionar tickers, ver variação de posições, cap. agregado. Uma lista por utilizador. |
| 5 | **Calculadora DCF** | Input: FCF inicial, crescimento anos 1-5, crescimento anos 6-10, taxa de desconto. Output: Fair Value, Margem de Segurança, Enterprise Value, Valor Terminal. Autopreenche a partir de um ticker. |
| 6 | **AI Insights** | Análise qualitativa gerada por Gemini: resumo executivo, vantagem competitiva, catalisadores de crescimento, riscos principais. Limite de X análises por utilizador por dia (a definir). Com cache — a mesma análise não é gerada duas vezes no mesmo dia. |

---

### v1 — Pós-lançamento (com feedback real)

| Feature | Descrição |
|---|---|
| **Screener** | Filtrar empresas por critérios: P/E < X, ROIC > Y, Market Cap, Setor, etc. |
| **Comparação head-to-head** | Comparar 2 empresas lado a lado em todos os fundamentais. |
| **Tracking de dividendos** | Histórico de dividendos, yield atual, payout ratio, projeção de rendimento. |
| **Earnings calendar** | Datas de publicação de resultados das empresas do portfólio do utilizador. |
| **Alertas de preço** | Notificar quando uma ação desce abaixo de X (via email). |
| **Múltiplos portfólios** | Criar mais do que uma lista/portfólio. |
| **Guia educativo** | Explicar o que é ROIC, FCF Yield, Margem de Segurança — context tooltips ou página dedicada. |

---

### v2 — Com receita (premium)

| Feature | Nota |
|---|---|
| ETFs | Análise e tracking de ETFs. |
| Empresas europeias | Dados de empresas EU fora do EDGAR (requer API paga). |
| AI Insights ilimitados | Sem limite diário. |
| Screener avançado | Mais filtros, exportação para CSV. |
| App móvel | iOS / Android. |
| Alertas avançados | Por fundamentais (ex: alertar quando ROIC desce abaixo de 15%). |

---

## 5. Stack Técnica

### Decisões e justificações

| Camada | Tecnologia | Justificação |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | SSR para SEO, rotas API integradas (não precisa de Express à parte), o mockup já usa. |
| Base de dados | **PostgreSQL** (via Supabase) | Relacional + JSONb para dados semi-estruturados, grátis, escala. |
| Auth | **Supabase Auth** | Resolve auth completo (email, OAuth) sem configurar JWT manualmente. |
| ORM | **Prisma** | Já usado no gestArtes, type-safe, migrations controladas. |
| Hosting app | **Vercel** | Deploy automático com GitHub, CDN, grátis no início. |
| Hosting DB | **Supabase** (PostgreSQL) | Postgres gerido, grátis até 500MB. Guarda apenas dados relacionais (users, fundamentals, companies). |
| Object storage | **Cloudflare R2** | Guarda histórico de preços como ficheiros JSON por empresa. 10GB grátis, 1M reads/mês grátis. Não consome quota da BD. |
| IA | **Google Gemini API** | Já usado pela equipa, free tier generoso, bom para análise de texto financeiro. |
| Jobs periódicos | **Vercel Cron Jobs** ou **GitHub Actions** | Para correr os scripts de ingestão de dados (SEC EDGAR + Polygon.io). Correm em Python separado. |
| Charts | **Recharts** | Library React para os gráficos do Decision Engine. Bem suportada, boa documentação para IA gerar. |
| i18n | **next-intl** | Multi-idioma desde a primeira linha. PT preenchido no MVP, EN a seguir. Estrutura preparada para mais idiomas. Adicionar i18n depois seria muito mais caro. |

### O que NÃO usar e porquê

| Tecnologia | Motivo |
|---|---|
| **Oracle Autonomous Database** | Usa Oracle SQL, não PostgreSQL. Prisma não suporta Oracle. Incompatível com a stack. |
| **Oracle Cloud self-hosted PostgreSQL** | Tecnicamente funciona mas requer gerir um servidor (updates, backups, segurança). Desnecessariamente complexo para uma equipa vibe-coding. |
| **yfinance** | Biblioteca não-oficial do Yahoo Finance. Yahoo proíbe uso comercial nos ToS. Funciona no MVP gratuito mas cria problema quando começarem a cobrar. Usar Polygon.io em vez disso. |
| **Scraper europeu** | Scrapers quebram e ficam bloqueados. Cada bolsa europeia tem estruturas diferentes. Não há "EDGAR europeu". Adiar para v2 com API paga. |
| **Socket.IO / polling a 1s** | Reventa limites de API. Para value investing, 60s é mais que suficiente. |
| **Express separado** | Next.js API routes substituem completamente. |
| **MSSQL** | PostgreSQL é mais barato, mais fácil de hospedar e tem melhor ecossistema cloud. |

### Nota sobre o vibe coding

A equipa usa IA (Claude, Copilot, Gemini, etc.) para gerar todo o código. Isto muda as prioridades de planeamento:

- **O schema Prisma e o sitemap são os documentos mais críticos** — são o contexto que a IA usa para gerar código coerente. Um schema mal feito multiplica problemas em cascata.
- **Stack simples > stack poderosa** — menos peças móveis significa menos bugs difíceis de diagnosticar.
- **Serviços geridos > self-hosted** — evitar gerir servidores manualmente.
- **Um "dono da coerência"** — alguém que revê o que a IA gera antes de fazer merge e garante que o schema se mantém consistente (como as GitHub reviews no gestArtes).

---

## 6. Estratégia de Dados

### O problema de base

Dados financeiros de qualidade têm custo. A estratégia para 0€ é ir às fontes primárias oficiais, cachear tudo, e separar inteligentemente o que vai para a base de dados SQL do que vai para object storage.

### Tamanhos reais de dados (normalizado)

| Dado | Nº de linhas estimado | Tamanho |
|---|---|---|
| Companies (1.000 empresas) | 1.000 linhas | ~2MB |
| Fundamentals (1.000 × 60 trimestres) | 60.000 linhas | ~40MB |
| User data + portfolios | Variável | <10MB no início |
| **Total na BD SQL** | | **~50-60MB** |
| Price history JSON files (1.000 × 3.780 dias) | 1.000 ficheiros | ~400MB |

**Conclusão:** os dados relacionais cabem folgadamente no Supabase free (500MB). O histórico de preços vai para object storage, que tem quota separada e maior.

### Fontes por tipo de dado

| Dado | Fonte | Custo | Onde guardar | Frequência |
|---|---|---|---|---|
| Fundamentais históricos (US) | **SEC EDGAR API** | 0€ | Supabase PostgreSQL | 1x/trimestre |
| Histórico de preços (EOD) | **Polygon.io** (free) | 0€ | Cloudflare R2 (JSON files) | 1x/dia |
| Preço atual | **Finnhub** (free) | 0€ | Não guardar — buscar on-demand | On-demand |
| AI Insights | **Google Gemini API** | 0€ (free tier) | Supabase (com TTL de 24h) | On-demand + cache |

### Arquitetura completa

```
Scripts Python (GitHub Actions / Vercel Cron)
│
├── SEC EDGAR API ──► parser ──► Supabase PostgreSQL
│   (fundamentals)     1x/Q      (Companies + Fundamentals)
│
└── Polygon.io ────► parser ──► Cloudflare R2
    (preços EOD)      1x/dia    (prices/AAPL.json, prices/MSFT.json, ...)


Utilizador abre a app
│
├── Next.js API ──► Supabase PostgreSQL ──► fundamentals, userdata
│
├── Next.js API ──► Cloudflare R2 ──────── price history JSON
│
└── Next.js API ──► Finnhub API ──────────  preço atual (só quando user está na página)
                    (15-60s refresh)
```

### Porquê ficheiros para o histórico de preços

O histórico de preços não precisa de SQL — nunca vais fazer `JOIN` entre preços e fundamentais em queries complexas. Quando o utilizador abre uma página de stock, buscas o ficheiro `prices/AAPL.json` inteiro e renderizas o gráfico. É mais rápido, mais simples e não consome quota de base de dados.

### Empresas cobertas no MVP

- **S&P 500 (500 empresas)** pré-carregadas no seed inicial
- Expansão on-demand: quando um utilizador pesquisa uma empresa que não está na BD, o sistema triggera a ingestão automaticamente
- **Empresas europeias:** apenas as que têm ADR/filing no EDGAR (ASML, SAP, LVMH, Nestlé, Shell, etc.) — cobertura parcial mas gratuita e legal

---

## 7. Modelo de Dados — Esquema Inicial (ERD)

### Entidades principais

```
User
├── id
├── email
├── name
├── created_at
└── plan (free | pro)

Company
├── id
├── ticker (ex: AAPL)
├── name (ex: Apple Inc.)
├── cik (SEC identifier)
├── exchange (NASDAQ, NYSE…)
├── sector
├── industry
├── currency
└── last_updated

Fundamental
├── id
├── company_id (FK → Company)
├── period (Q1 2024, FY 2023…)
├── period_type (quarterly | annual)
├── date
├── revenue
├── net_income
├── operating_cf
├── capex
├── free_cash_flow (calculado)
├── eps_diluted
├── shares_outstanding
├── total_debt
├── cash
├── gross_profit
└── roic (calculado)

PriceHistory
├── id
├── company_id (FK → Company)
├── date
├── open
├── high
├── low
├── close
└── volume

Portfolio
├── id
├── user_id (FK → User)
└── name

PortfolioItem
├── id
├── portfolio_id (FK → Portfolio)
├── company_id (FK → Company)
└── added_at

AIInsightCache
├── id
├── company_id (FK → Company)
├── content (JSON: { executive_summary, moat, catalysts, risks })
├── generated_at
└── expires_at
```

---

## 8. Modelo de Negócio e Distribuição

### Fase 1 — MVP (este verão): Gratuito total

Sem monetização. Foco em crescer utilizadores via Bullocracy e validar se o produto tem tração. Custo operacional: 0€/mês (todos os serviços no free tier).

### Fase 2 — v1 (pós-lançamento): Freemium

**Free:**
- Acesso a todas as funcionalidades base
- Limite de X AI Insights por dia
- 1 portfólio

**Pro (~9-15€/mês):**
- AI Insights ilimitados
- Alertas de preço
- Screener avançado
- Múltiplos portfólios
- Funcionalidades v1 completas

### Fase 3 — v2 (com receita): Pro expandido

- ETFs, empresas europeias, app móvel
- Possivelmente plano Enterprise para Discord/comunidades de investimento

### Nota sobre o custo dos dados

Com o crescimento de utilizadores, os custos de infraestrutura escalam, mas os dados não — o SEC EDGAR é gratuito independentemente do número de utilizadores. O custo de escala será Supabase (DB) e Vercel (hosting), que têm planos pagos razoáveis. A IA (Gemini) é o custo variável principal — daí o limite por utilizador.

---

### Distribuição via Bullocracy — análise honesta

**O que é a Bullocracy (junho 2026):**

| Plataforma | Seguidores | Notas |
|---|---|---|
| TikTok | ~4.090 | Canal principal. 1,9M views/365 dias, 46K gostos, 11K partilhas |
| Instagram | ~486 | 83 publicações |
| YouTube | ~75 | 37 vídeos, views baixas (dezenas a centenas) |

Conteúdo: análises de atualidade, economia e política (PT e geopolítica). Algum conteúdo de investimento, mas minoritário.

**Diagnóstico:**

A Bullocracy tem **alcance**, não tem (ainda) **comunidade cativa**. 94,5% das views vêm do "Para Ti" do TikTok — ou seja, tráfego frio de não-seguidores. Os virais são de atualidade/política (Autárquicas, Habitação, Trabalho), não de stock analysis. A audiência atual não é, na maioria, a audiência que o BullQuant precisa.

Isto significa que o "modelo Joseph Carlson" (audiência de nicho leal → produto) **não se aplica diretamente**. A Bullocracy é uma máquina de alcance viral, não uma comunidade de investidores concentrada.

**Estratégia de distribuição corrigida:**

1. **Captura de audiência (fazer JÁ, antes do produto estar pronto):** criar uma newsletter / Discord / lista de email de "early access ao BullQuant". Cada vídeo viral que passa sem capturar contacto é audiência perdida. Chegar ao lançamento com uma lista de interessados vale mais que tráfego frio de FYP.
2. **Aquecimento:** aumentar gradualmente o conteúdo de investimento/value investing nos meses antes do lançamento, para filtrar e alinhar a audiência certa.
3. **Flywheel conteúdo ↔ produto:** análises feitas no BullQuant viram vídeos; vídeos trazem gente ao produto. Isto constrói a comunidade que ainda não existe.

**Expectativa realista de tração no lançamento:** dezenas a baixas centenas de utilizadores ativos iniciais — suficiente para validar e iterar o MVP. Não contar com milhares no dia 1.

**Vantagem real:** a equipa sabe produzir conteúdo com alcance (1,9M/ano não é sorte) e o custo de aquisição é ~0€. Falta o mecanismo de captura no meio do funil.

---

## 9. Documentação Pré-Código

Não seguimos o modelo académico do gestArtes (BPMN, sequence diagrams, use case UML). Para um produto com deadline de verão, cortamos o que não ajuda a lançar.

**O que documentamos:**

| Documento | Propósito | Estado |
|---|---|---|
| Este documento (visão, features, stack, dados) | Guia geral do projeto | ✅ Feito |
| ERD / Schema Prisma | Fonte de verdade da BD | A fazer |
| Sitemap | Formalizar rotas e navegação do mockup | A fazer |
| ADR (Architecture Decision Records) | Registar decisões técnicas e porquê | A fazer |
| Estratégia de dados | Fontes, cache, scripts de ingestão | ✅ Neste doc |

**O que NÃO documentamos (nesta fase):**
- BPMN
- Diagramas de sequência
- Diagramas de casos de uso
- Diagramas de classe UML

---

## 10. Roadmap — Este Verão (12 semanas)

> Início estimado: Semana de 23 de junho 2026

### Semana 1-2: Setup e Infraestrutura
- [ ] Criar repo limpo no GitHub (organização ou repo do Costa como base)
- [ ] Setup Next.js + TypeScript + Prisma + Supabase
- [ ] Definir schema da BD (ERD) e correr primeira migration
- [ ] Setup Supabase Auth (registo + login)
- [ ] Primeiro script de ingestão: SEC EDGAR para 10 empresas teste
- [ ] Deploy inicial no Vercel

### Semana 3-5: Core da Plataforma
- [ ] Pesquisa de ticker (autocomplete, resultados)
- [ ] Página de stock — fundamentais snapshot (5 blocos)
- [ ] Integração Finnhub (preço atual)
- [ ] Price History chart (Polygon.io + Recharts)
- [ ] Decision Engine — grelha de gráficos históricos

### Semana 6-7: Portfólio e DCF
- [ ] Portfólio / Watchlist (adicionar, remover tickers)
- [ ] Calculadora DCF (input manual + autopreencher por ticker)
- [ ] Seed da BD com S&P 500 completo

### Semana 8-9: AI e Polish
- [ ] AI Insights (Gemini API + cache + limite diário)
- [ ] UI polish: estados de loading, empty states, erros
- [ ] Corrigir bugs do mockup (EV/EBITDA, P/Book — ver secção 11)
- [ ] Responsividade mobile

### Semana 10-11: Testes e Beta
- [ ] Testes manuais completos
- [ ] Beta fechado com Bullocracy (grupo pequeno)
- [ ] Recolher feedback e corrigir críticos

### Semana 12: Lançamento
- [ ] Lançamento público via Bullocracy
- [ ] Monitorização (erros, uso, performance)

---

## 11. Problemas Conhecidos do Mockup Atual

A resolver antes de lançar (não transportar bugs do protótipo):

| Problema | Descrição | Como resolver |
|---|---|---|
| EV/EBITDA errado | Mostra 3251.70 (devia ser ~48) | Rever cálculo — provavelmente unidade trocada (B vs M) |
| P/Book errado | Mostra 1679.91 (devia ser ~30) | Idem |
| "1 Issue" no overlay | Erro de runtime não resolvido | Debugar antes de reutilizar qualquer código |
| Moeda inconsistente | ASML reporta em EUR, UI mostra $ sem conversão explícita | Adicionar flag de moeda por empresa; conversão EUR→USD explícita |
| "1s polling" | Reventa limites de API | Substituir por 60s polling on-demand |
| Fonte de dados Yahoo | Uso não-oficial, sem licença comercial | Substituir por SEC EDGAR + Polygon + Finnhub |

---

## 12. Questões em Aberto

A maioria das questões iniciais foi resolvida. **Resolvidas:** idioma (PT primário, EN depois), código (começar do zero, manter o antigo como referência), Bullocracy (alcance viral — ver secção 8).

Restantes:

| # | Questão | Estado / Impacto |
|---|---|---|
| 1 | **Nome final** — "BullQuant", "Bullquant" ou outro? | Em aberto. Nota: manter o "Bull-" cria família de marca com a Bullocracy. Afeta domínio e redes sociais. Não bloqueia o código. |
| 2 | **Divisão de trabalho** entre Alex, Costa e Nando | "Fazemos juntos" por agora. Sugestão: donos *leves* de área (dados/backend, frontend, produto/conteúdo) para evitar conflitos de Git e retrabalho, sem rigidez. |
| 3 | **Mecanismo de captura de audiência** (newsletter/Discord) | A criar JÁ, fora do código — ver estratégia na secção 8. |
| 4 | **Limite de AI Insights** por utilizador/dia no free tier | A definir com base no custo real do Gemini. |

---

## 13. Próximos Passos Imediatos

Por ordem de fazer:

1. **Responder às Questões em Aberto** (especialmente idioma e divisão de trabalho)
2. **Criar o ERD / Schema Prisma** (definir a BD antes de escrever uma linha de código)
3. **Criar o Sitemap** (formalizar rotas e navegação)
4. **Setup do repo limpo** com a stack decidida
5. **Criar a skill do Claude Code** para o BullQuant (quando o schema e sitemap estiverem feitos)

---

*Documento mantido por Alex. Última atualização: Junho 2026.*
