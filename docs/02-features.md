# BullQuant — Features

## Critério de priorização

- **MVP:** funcionalidades sem as quais o produto não existe nem tem valor mínimo
- **v1:** funcionalidades que fazem os utilizadores voltar (retenção)
- **v2:** funcionalidades que justificam pagar (monetização)

Problemas do mockup actual (repo do Costa) a NÃO transportar para o código novo: EV/EBITDA errado (3251 vs ~48), P/Book errado (1679 vs ~30), moeda inconsistente (EUR/USD misturado), "1s polling" global, erro de runtime activo ("1 Issue").

---

## MVP — Lançar este verão

### 1. Autenticação

**O que inclui:**
- Registo com email + password
- Login / Logout
- Reset de password por email
- Página de perfil simples (nome, email, plano actual)

**O que NÃO inclui no MVP:**
- OAuth (Google, GitHub) — v1
- 2FA — v1
- Editar email — v1

**Notas técnicas:**
- Implementado via Supabase Auth — não escrever JWT à mão
- O campo `plan` no modelo `User` nasce como `FREE` para todos

---

### 2. Pesquisa de Ticker

**O que inclui:**
- Barra de pesquisa global (header, sempre visível)
- Autocomplete ao escrever: mostra ticker + nome da empresa + exchange + logo
- Resultados instantâneos (debounce de ~300ms)
- Navegação por teclado (↑ ↓ Enter Escape)
- Pesquisas recentes guardadas localmente (localStorage, últimas 5)
- Pesquisar por ticker (AAPL) ou nome da empresa (Apple)
- Ao seleccionar: navega para `/stock/[ticker]`

**O que NÃO inclui no MVP:**
- Pesquisa de ETFs
- Pesquisa de empresas europeias sem ADR no EDGAR
- Filtros (por exchange, sector, etc.) — screener é v1

**Notas técnicas:**
- A pesquisa corre contra a tabela `Company` na BD (não chama APIs externas em tempo real)
- A BD tem de ter as ~500 empresas do S&P 500 pré-carregadas no seed
- Se o utilizador pesquisar uma empresa que não existe na BD, mostrar "Empresa não disponível ainda"

---

### 3. Página de Stock (`/stock/[ticker]`)

A feature mais importante e complexa do produto. Dividida em secções.

#### 3a. Header da Empresa

**O que inclui:**
- Logo da empresa
- Nome completo + ticker + exchange
- Preço actual em USD (actualiza a cada 60 segundos, só enquanto o user está na página)
- Variação diária (€ e %)
- Data dos próximos resultados (earnings date) — se disponível no Finnhub
- Botão "Adicionar ao Portfólio" / "Seguido ✓"
- Badge da fonte de dados (ex: "TTM · Yahoo Finance / SEC")

**O que NÃO inclui no MVP:**
- Alertas de preço — v1
- Partilhar empresa — v1
- Comparar com outra empresa — v1

**Notas técnicas:**
- Preço actual vem do Finnhub, chamado pelo backend `/api/price/[ticker]`
- Backend faz polling a Finnhub a cada 60s; frontend faz polling ao backend a cada 60s
- NÃO fazer polling directo do frontend à Finnhub (expõe a API key)

#### 3b. Fundamentais Snapshot (5 Blocos)

Dados do último período disponível (TTM ou último trimestre).

| Bloco | Métricas |
|---|---|
| **Valuation** | Market Cap, P/E Trailing, Forward P/E, P/Sales, EV/EBITDA, P/Book |
| **Cash Flow** | Operating CF, Free Cash Flow, FCF Yield |
| **Margins & Growth** | Profit Margin, Operating Margin, Gross Margin, Revenue YoY, Earnings YoY |
| **Balance** | Cash, Total Debt, Net Cash |
| **Dividend** | Yield, Payout Ratio |

**Notas técnicas:**
- Métricas calculadas (FCF Yield, EV/EBITDA, etc.) precisam do preço actual — calcular no backend quando o user carrega a página, não guardar na BD (dependem do preço que muda)
- Valores em N/A quando não disponíveis — nunca mostrar 0 quando devia ser N/A
- Cores: valores positivos a verde, negativos a vermelho (só onde faz sentido — não colorir P/E)
- Forward P/E e estimativas de analistas: não disponível a 0€ no MVP → mostrar N/A com tooltip "Disponível em breve"

#### 3c. Price History (Gráfico de Preço)

**O que inclui:**
- Gráfico de linha / área (como no mockup — fundo sombreado roxo)
- Tabs de período: 1M · 6M · 1A · 5A · MÁX
- Dados EOD (end-of-day) — não intraday no MVP
- Tooltip com preço e data ao hover
- Percentagem de variação no período seleccionado

**O que NÃO inclui no MVP:**
- Intraday (dados ao minuto/hora) — caro e desnecessário para value investing
- Comparação com índice (S&P 500 overlay) — v1
- Volume no gráfico — v1

**Notas técnicas:**
- Dados vêm de `Cloudflare R2` → ficheiro `prices/[ticker].json`
- Backend lê o ficheiro R2 e serve ao frontend via `/api/prices/[ticker]`
- Frontend filtra por período (1M, 6M, etc.) após receber o array completo
- Chart library: Recharts (`<AreaChart>`)

#### 3d. Financials & Decision Engine

A secção principal de análise — grelha de gráficos históricos de 15 anos.

**Toggle de período no topo:** Trimestral · TTM · Anual

**Gráficos incluídos no MVP:**

| Gráfico | Tipo | Badge | Notas |
|---|---|---|---|
| Revenue | Barras | TOP-LINE | CAGR no canto superior direito |
| EPS Diluted | Barras | POCKET EARNINGS | CAGR no canto |
| ROIC | Linha | CAPITAL EFFICIENCY | Linha tracejada a 15% (target) |
| Free Cash Flow | Barras | OCF VS CAPEX | Barras OCF + linha CapEx sobrepostas |
| Shares Outstanding | Barras | DILUTION TRACKER | CAGR; vermelho se a subir, verde se a descer |
| Net Income | Barras | — | — |
| Profit Margin | Linha | QUALITY | Linha tracejada da média histórica |
| Gross Margin | Linha | — | — |
| Cash & Debt | Barras agrupadas | — | Cash a verde, Debt a vermelho |

**Comportamento dos gráficos:**
- Tooltip ao hover com valor exacto + período
- Botão de expandir para full-screen (overlay/modal)
- Toggle Gráficos / Tabela (a tabela mostra os mesmos dados em formato tabelar)
- Valores em bilhões (B) ou milhões (M) com auto-formatação

**Rodapé da secção:**
- "Guia de Análise Value Investing" — parágrafo explicativo sobre o que procurar
- Badge "Institutional Data Quality — All historical metrics verified against official SEC Filings" + data do último update

**O que NÃO inclui no MVP:**
- KPIs específicos por empresa (Net Bookings, Lithography Systems Sold) — requer dados curados manualmente, adiar
- Mais de 9 gráficos — adiar para v1

**Notas técnicas:**
- Dados vêm da tabela `Fundamental` na BD, filtrados por `companyId` e ordenados por `periodEnd`
- CAGR calculado: `(valor_final / valor_inicial) ^ (1 / nº_anos) - 1`
- Para o toggle Trimestral/Anual: query diferente (`periodType = QUARTERLY` vs `ANNUAL`)
- TTM (Trailing Twelve Months): soma dos últimos 4 trimestres

---

### 4. Portfólio / Watchlist (`/portfolio`)

No MVP, portfólio e watchlist são a mesma coisa — uma lista de tickers que o utilizador quer acompanhar. Sem tracking de preço de compra nem de ganhos/perdas (isso é v1).

**O que inclui:**
- Ver todos os tickers adicionados
- Para cada ticker: logo, nome, ticker, preço actual, variação diária
- Stats no topo: nº de posições, quantas estão em alta hoje
- Adicionar ticker (via pesquisa)
- Remover ticker
- Clicar num ticker navega para `/stock/[ticker]`
- Estado vazio com sugestões de tickers populares

**O que NÃO inclui no MVP:**
- Preço de compra / ganho/perda — v1
- Múltiplos portfólios — v1
- Ordenação / filtros da lista — v1
- Gráfico de evolução do portfólio — v1
- Cap. agregado real (precisa de preços de compra) — mostrar N/A ou remover do header

**Notas técnicas:**
- Os preços actuais do portfólio: batch request ao Finnhub com todos os tickers quando o user abre a página, não polling contínuo
- Guardar na BD: tabela `PortfolioItem` com `userId` + `companyId`
- Um utilizador tem um portfólio no MVP (sem necessidade de criar/gerir múltiplos)

---

### 5. Calculadora DCF (`/dcf`)

**O que inclui:**

**Painel de configuração (esquerda):**
- Campo de pesquisa de ticker para autopreencher
- Modo manual (sem ticker) também disponível
- Inputs:
  - Preço Actual de Mercado (autopreenche com preço actual)
  - Free Cash Flow inicial em M$ (autopreenche com FCF TTM)
  - Taxa de Crescimento Anos 1-5 (slider 0-50% + input numérico)
  - Taxa de Crescimento Anos 6-10 (slider 0-30% + input numérico)
  - Taxa de Desconto / WACC (slider 5-15%, default 10%)
  - Taxa de Crescimento Terminal (slider 1-4%, default 2.5%)
  - Nº de Acções (autopreenche com shares outstanding)

**Painel de resultados (direita):**
- Fair Value (preço justo por acção) — destaque grande
- Preço Actual — destaque grande
- Margem de Segurança (%) — badge colorido (verde = subavaliada, vermelho = sobreavaliada)
- Barra visual de Margem de Segurança (subavaliada ↔ justa ↔ sobreavaliada)
- Enterprise Value
- Valor Terminal (PV)
- FCF Projetado (PV)

**Comportamento:**
- Resultados actualizam em tempo real à medida que os sliders se movem (sem submit)
- Ao autopreencher com ticker, mostra de onde vêm os dados (SEC EDGAR, data)
- Modo manual: inputs em branco, utilizador preenche tudo

**O que NÃO inclui no MVP:**
- Múltiplos cenários (pessimista/base/optimista) — v1
- Guardar / partilhar análise DCF — v1
- Sensibility table (matriz de fair value por diferentes taxas) — v1

**Notas técnicas:**
- O cálculo DCF corre **no cliente** (JavaScript puro, sem chamada ao backend)
- Fórmula standard: `FCF_n = FCF_0 × (1 + g_n)^n`; `PV = FCF_n / (1 + WACC)^n`; Fair Value = (Σ PV + Terminal Value) / Shares
- Ao autopreencher, o backend serve FCF TTM e Shares Outstanding da BD → `/api/dcf-data/[ticker]`

---

### 6. AI Insights (`/ai-insights`)

**O que inclui:**
- Campo de pesquisa de ticker
- Botão "Analisar"
- Output estruturado:
  - **Resumo Executivo** — 3-5 frases sobre o negócio actual
  - **Vantagem Competitiva (Moat)** — o que protege a empresa da concorrência
  - **Catalisadores de Crescimento** — lista de 3-5 factores que podem fazer o negócio crescer
  - **Riscos Principais** — lista de 3-5 riscos reais
- Loading state enquanto o Gemini processa (~5-15 segundos)
- Timestamp "Análise gerada em [data]" + aviso "Esta análise é informativa, não é conselho de investimento."
- Limite de X análises por utilizador por dia (a definir — sugestão: 5 no free)
- Se a análise já foi gerada hoje para este ticker, serve do cache instantaneamente

**O que NÃO inclui no MVP:**
- Análise gerada com dados financeiros reais da empresa (apenas usa o conhecimento do Gemini sobre a empresa + ticker)
- Comparação entre empresas — v1
- Histórico de análises guardadas — v1
- Partilhar análise — v1

**Notas técnicas:**
- Prompt ao Gemini: inclui o nome da empresa, ticker, sector, e pede output em JSON estruturado `{executive_summary, moat, catalysts: [], risks: []}`
- Cache em `AIInsightCache` na BD com TTL de 24h — verificar antes de chamar o Gemini
- Tracking de uso: tabela `AIUsageLog` para contar análises por utilizador por dia
- Idioma do output: Português (instruir o Gemini no prompt)
- Modelo: `gemini-1.5-flash` (mais rápido e barato que Pro para esta tarefa)

---

## v1 — Pós-lançamento (com feedback real)

Prioridade definida após feedback dos primeiros utilizadores. Ordem indicativa:

| Feature | Porquê v1 (não MVP) |
|---|---|
| **Screener** | Requer dados de muitas empresas indexados e queries complexas — trabalho significativo |
| **Comparação head-to-head** | Útil mas não é o core do produto — adicionar quando a página de stock estiver estável |
| **Tracking de dividendos** | Requer campos extra (ex-dividend date, payment date) e lógica de projecção |
| **Earnings calendar** | Requer fonte de dados de earnings dates (Finnhub tem, mas é outro endpoint a integrar) |
| **Alertas de preço** | Requer sistema de email + job em background que monitoriza preços |
| **OAuth (Google)** | Melhora conversão no registo mas não é bloqueante |
| **Múltiplos portfólios** | Útil para utilizadores avançados, mas 1 portfólio chega para validar |
| **Tracking de ganhos/perdas** | Requer preço de compra, data, cálculo de ganho realizado/não-realizado |
| **Guia educativo** | Context tooltips explicando cada métrica |
| **AI Insights com dados reais** | Versão melhorada que injeta os fundamentais da empresa no prompt |

---

## v2 — Com receita (funcionalidades premium)

| Feature | Notas |
|---|---|
| **ETFs** | Análise e tracking de ETFs (iShares, Vanguard, etc.) |
| **Empresas europeias completas** | Requer API paga (EODHD ou similar, ~20-50€/mês) |
| **AI Insights ilimitados** | Sem limite diário — só no plano Pro |
| **Screener avançado** | 50+ filtros, combinações AND/OR, exportação CSV |
| **App móvel** | iOS / Android — React Native ou Progressive Web App |
| **Alertas por fundamentais** | "Avisa-me quando o ROIC da Apple descer abaixo de 15%" |
| **Sentimento de mercado** | Dados de notícias + sentimento (Finnhub tem endpoint para isto) |
| **Insider trading** | Compras e vendas de insiders (disponível no Finnhub free) |
