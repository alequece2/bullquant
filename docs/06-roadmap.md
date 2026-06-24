# BullQuant — Roadmap

## Contexto

- **Início:** semana de 23 de Junho de 2026
- **Prazo:** fim do verão (~12 semanas)
- **Equipa:** Alex, Costa, Nando (vibe coding com IA)
- **Objectivo do prazo:** produto funcional e lançado publicamente, com as 6 features MVP

---

## Princípios

**O schema Prisma vem primeiro.** Nenhum código de app se escreve antes do schema estar validado. É a fundação de tudo.

**Deploy desde o dia 1.** O ambiente de produção (Vercel + Supabase + R2) deve estar configurado na semana 1. Assim detecta-se problemas de infraestrutura cedo, não na véspera do lançamento.

**Uma feature de cada vez.** Não começar a feature seguinte sem a anterior estar funcional de ponta a ponta. Features a meio não servem de nada.

**Beta fechado antes do lançamento público.** Pelo menos 1-2 semanas de utilizadores reais (da Bullocracy) antes de anunciar para toda a gente.

---

## Semana 1 — Fundações (23-29 Jun)

**Objectivo:** infraestrutura pronta, schema na produção, primeiros dados reais na BD.

### Setup de infra
- [ ] Criar organização/repo limpo no GitHub (nome definitivo a decidir)
- [ ] Inicializar projecto Next.js 15 + TypeScript + Tailwind + shadcn/ui
- [ ] Configurar ESLint + Prettier
- [ ] Setup Supabase: criar projecto, copiar connection strings
- [ ] Setup Cloudflare R2: criar bucket `bullquant-prices`, gerar access keys
- [ ] Configurar variáveis de ambiente (`.env.local` + Vercel environment variables)
- [ ] Primeiro deploy no Vercel (página em branco — só para confirmar que o pipeline funciona)

### Schema e BD
- [ ] Escrever schema Prisma completo (ver `05-schema.md`)
- [ ] Correr `prisma migrate dev --name init` localmente
- [ ] Correr `prisma migrate deploy` para produção (Supabase)
- [ ] Configurar trigger Supabase para sync de auth → tabela users
- [ ] Escrever e correr `seed_companies.py`: inserir S&P 500 na tabela Company

### Primeiros dados
- [ ] Escrever `ingest_fundamentals.py` para 5 empresas teste (AAPL, MSFT, NVDA, AMZN, GOOG)
- [ ] Verificar dados no Supabase Dashboard — confirmar que os campos estão correctos
- [ ] Escrever `ingest_prices.py` para as mesmas 5 empresas
- [ ] Verificar ficheiros JSON no R2

**Entregável da semana:** infra configurada, schema em produção, dados reais de 5 empresas na BD.

---

## Semana 2 — Auth e Pesquisa (30 Jun - 6 Jul)

**Objectivo:** utilizador consegue registar-se, fazer login e pesquisar empresas.

### Auth
- [ ] Página de registo (`/auth/register`) — email + password
- [ ] Página de login (`/auth/login`)
- [ ] Logout
- [ ] Reset de password (Supabase Auth gere o email)
- [ ] Página de perfil básica (`/profile`) — nome, email, plano
- [ ] Middleware de protecção de rotas (redirecionar para login se não autenticado)

### Pesquisa
- [ ] API Route `GET /api/search?q={query}` — pesquisa na tabela Company por ticker e nome
- [ ] Componente `SearchBar` com autocomplete (debounce 300ms)
- [ ] Mostrar logo, nome, ticker, exchange nos resultados
- [ ] Navegação por teclado (↑ ↓ Enter Escape)
- [ ] Pesquisas recentes em localStorage (últimas 5)
- [ ] Ao seleccionar: navegar para `/stock/[ticker]`

### i18n
- [ ] Configurar `next-intl` com ficheiros `messages/pt.json` e `messages/en.json`
- [ ] Todos os textos de UI já em ficheiro de tradução (não hardcoded)

**Entregável da semana:** utilizador consegue criar conta, entrar e pesquisar empresas.

---

## Semana 3 — Página de Stock: Parte 1 (7-13 Jul)

**Objectivo:** página `/stock/[ticker]` com header, preço actual e fundamentais snapshot.

### Header da empresa
- [ ] Layout da página de stock (`/stock/[ticker]/page.tsx`)
- [ ] Buscar dados da Company e Fundamental mais recente da BD
- [ ] Mostrar: logo, nome, ticker, exchange, sector
- [ ] API Route `GET /api/price/[ticker]` — chama Finnhub, devolve preço actual
- [ ] Mostrar preço, variação diária (€ e %)
- [ ] Polling a cada 60s com `useEffect` + `setInterval` + cleanup
- [ ] Botão "Adicionar ao Portfólio" (ligado mais tarde — semana 6)

### Fundamentais snapshot (5 blocos)
- [ ] Componente `FundamentalsSnapshot` com os 5 blocos
- [ ] Valuation: Market Cap, P/E Trailing, P/Sales, EV/EBITDA, P/Book
- [ ] Cash Flow: Operating CF, Free Cash Flow, FCF Yield
- [ ] Margins & Growth: Profit Margin, Operating Margin, Gross Margin, Revenue YoY, Earnings YoY
- [ ] Balance: Cash, Total Debt, Net Cash
- [ ] Dividend: Yield, Payout Ratio
- [ ] Valores "N/A" quando o campo é null (nunca mostrar 0 quando devia ser N/A)
- [ ] Cores: verde/vermelho onde semanticamente correcto

**Entregável da semana:** página de stock com header e fundamentais snapshot funcionais.

---

## Semana 4 — Página de Stock: Parte 2 (14-20 Jul)

**Objectivo:** Price History chart e início do Decision Engine.

### Price History
- [ ] API Route `GET /api/prices/[ticker]` — lê ficheiro JSON do R2, devolve ao frontend
- [ ] Componente `PriceChart` com Recharts `<AreaChart>`
- [ ] Tabs de período: 1M · 6M · 1A · 5A · MÁX
- [ ] Filtro de período no frontend (não nova chamada API — filtrar o array recebido)
- [ ] Tooltip com preço e data ao hover
- [ ] Percentagem de variação no período seleccionado (no header do gráfico)

### Decision Engine — primeiros gráficos
- [ ] Toggle de período: Trimestral · TTM · Anual
- [ ] API Route `GET /api/fundamentals/[ticker]?period=quarterly` — devolve array de fundamentais
- [ ] Componente `DecisionEngine` com grelha responsiva
- [ ] Implementar 3 primeiros gráficos: Revenue, EPS Diluted, Net Income (barras simples)
- [ ] Badges de categoria (TOP-LINE, POCKET EARNINGS, etc.)
- [ ] CAGR calculado e mostrado no canto de cada gráfico
- [ ] Toggle Gráficos / Tabela (a tabela mostra os mesmos dados)

**Entregável da semana:** página de stock completa com gráfico de preço e início do Decision Engine.

---

## Semana 5 — Decision Engine: Completo (21-27 Jul)

**Objectivo:** todos os gráficos do Decision Engine implementados.

- [ ] ROIC (linha) com linha tracejada a 15% (target)
- [ ] Free Cash Flow (barras OCF + linha CapEx sobrepostas)
- [ ] Shares Outstanding (barras, CAGR, vermelho se sobe/verde se desce)
- [ ] Profit Margin (linha com linha da média histórica)
- [ ] Gross Margin (linha)
- [ ] Cash & Debt (barras agrupadas, cash verde, debt vermelho)
- [ ] Tooltips consistentes em todos os gráficos
- [ ] Botão de expandir (full-screen modal por gráfico)
- [ ] Rodapé: "Guia de Análise Value Investing" + badge de data quality
- [ ] Testes manuais com 10 empresas diferentes — verificar dados e cálculos

**Entregável da semana:** Decision Engine completo com todos os 9 gráficos.

---

## Semana 6 — Portfólio (28 Jul - 3 Ago)

**Objectivo:** utilizador consegue criar e gerir o seu portfólio.

- [ ] Criar portfólio automaticamente para utilizador novo (no trigger de auth)
- [ ] API Route `GET /api/portfolio` — devolve itens do portfólio do utilizador autenticado
- [ ] API Route `POST /api/portfolio/add` — adicionar empresa ao portfólio
- [ ] API Route `DELETE /api/portfolio/remove` — remover empresa do portfólio
- [ ] Página `/portfolio` com lista de empresas
- [ ] Para cada empresa: logo, nome, ticker, preço actual, variação diária
- [ ] Stats no topo: nº de posições, quantas em alta hoje
- [ ] Botão "Adicionar ticker" com o SearchBar
- [ ] Estado vazio com sugestões (AAPL, MSFT, NVDA, AMZN, GOOG)
- [ ] Ligar botão "Adicionar ao Portfólio" na página de stock
- [ ] Botão "Seguido ✓" quando empresa já está no portfólio

**Entregável da semana:** portfólio funcional — utilizador consegue seguir empresas e ver watchlist.

---

## Semana 7 — Calculadora DCF (4-10 Ago)

**Objectivo:** calculadora DCF funcional com autopreencher e modo manual.

- [ ] API Route `GET /api/dcf-data/[ticker]` — devolve FCF TTM, preço actual, shares outstanding
- [ ] Página `/dcf` com layout dois painéis
- [ ] SearchBar para autopreencher (chama `/api/dcf-data`)
- [ ] Inputs: Preço Actual, FCF Inicial, Crescimento 1-5 (slider + input), Crescimento 6-10, WACC, Terminal Growth
- [ ] Cálculo DCF em JavaScript puro no cliente (não precisa de backend)
- [ ] Actualização em tempo real com cada mudança de slider
- [ ] Painel de resultados: Fair Value, Margem de Segurança, badge colorido, barra visual, Enterprise Value, Valor Terminal, FCF PV
- [ ] Modo manual (inputs em branco, utilizador preenche tudo)
- [ ] Aviso: "Esta calculadora é uma ferramenta educativa, não é conselho de investimento."

**Entregável da semana:** calculadora DCF completa e funcional.

---

## Semana 8 — AI Insights (11-17 Ago)

**Objectivo:** AI Insights funcional com cache e controlo de uso.

- [ ] Configurar Gemini API (`@google/generative-ai` SDK)
- [ ] API Route `POST /api/ai-insights` — com verificação de cache, limite diário e chamada Gemini
- [ ] Página `/ai-insights` com SearchBar e botão "Analisar"
- [ ] Loading state (spinner ou skeleton enquanto Gemini processa)
- [ ] Componente de resultado com 4 blocos: Resumo Executivo, Moat, Catalisadores, Riscos
- [ ] Timestamp "Análise gerada em [data]"
- [ ] Mensagem quando cache é servido ("Análise de hoje · Gerada às HH:MM")
- [ ] Mensagem quando limite atingido (com texto amigável, não só erro 429)
- [ ] Aviso obrigatório: "Esta análise é informativa e não constitui conselho de investimento."
- [ ] Definir limite diário (sugestão: 5 no free, ilimitado em Pro)

**Entregável da semana:** AI Insights funcional com cache e limites de uso.

---

## Semana 9 — Ingestão de Dados em Escala + Polish (18-24 Ago)

**Objectivo:** dados das 500 empresas do S&P 500 na BD; UI polida.

### Ingestão completa
- [ ] Correr `ingest_fundamentals.py` para as 500 empresas do S&P 500 (vai demorar ~100 minutos)
- [ ] Correr `ingest_prices.py` para as 500 empresas (~110 minutos)
- [ ] Verificar e corrigir empresas com dados em falta ou campos errados
- [ ] Configurar GitHub Actions cron para ingestão automática (diária para preços, semanal para fundamentais)

### Polish de UI
- [ ] Tratar todos os estados de loading (skeletons em vez de spinners onde possível)
- [ ] Tratar todos os estados de erro (empresa não encontrada, dados em falta, API down)
- [ ] Tratar estados vazios (portfólio vazio, sem resultado de pesquisa)
- [ ] Responsividade mobile (a app tem de funcionar no telemóvel)
- [ ] Verificar e corrigir os bugs do mockup original (EV/EBITDA, P/Book — ver `02-features.md`)
- [ ] Rever consistência de cores, espaçamentos, tipografia

**Entregável da semana:** dados de 500 empresas disponíveis; UI sem estados de loading/erro em branco.

---

## Semana 10-11 — Beta Fechado (25 Ago - 7 Set)

**Objectivo:** grupo restrito de utilizadores reais a testar.

- [ ] Deploy de produção estável
- [ ] Criar lista de beta testers (20-50 pessoas da audiência Bullocracy)
- [ ] Enviar link privado com instruções
- [ ] Monitorizar erros (Vercel Analytics + logs)
- [ ] Recolher feedback (formulário simples ou Discord)
- [ ] Priorizar e corrigir bugs críticos reportados
- [ ] NÃO adicionar features novas durante o beta — só bugs e polish

**Entregável das semanas:** produto estável com feedback real de utilizadores.

---

## Semana 12 — Lançamento (8-14 Set)

**Objectivo:** lançamento público via Bullocracy.

### Pré-lançamento
- [ ] Domínio configurado (bullquant.com ou equivalente)
- [ ] Página de landing simples (o que é, para quem, CTA para criar conta)
- [ ] SEO básico (meta tags, og:image, título, descrição por página)
- [ ] Link de "early access" pronto para os vídeos e stories

### Lançamento
- [ ] Vídeo de lançamento na Bullocracy (TikTok + Instagram + YouTube)
- [ ] Link na bio + stories
- [ ] Monitorizar erros e performance nas primeiras 24h
- [ ] Responder a feedback nos comentários dos vídeos

### Pós-lançamento imediato
- [ ] Recolher métricas: registos, utilizadores activos, features mais usadas
- [ ] Priorizar v1 com base no que os utilizadores realmente usam

---

## Marcos críticos

| Marco | Semana | O que valida |
|---|---|---|
| Schema em produção | Semana 1 | Fundação técnica sólida |
| Página de stock funcional | Semana 5 | Core value prop entregue |
| Portfólio + DCF | Semana 7 | Produto mínimo completo |
| S&P 500 na BD | Semana 9 | Escala real |
| Beta fechado | Semana 10 | Produto testado por humanos reais |
| Lançamento público | Semana 12 | Validação de mercado |

---

## Buffer e riscos

**Semanas buffer incorporadas:** a semana 9 tem folga (ingestão é automática, o polish não precisa de 5 dias completos se tudo correu bem). As semanas 10-11 de beta dão tempo para corrigir problemas inesperados.

**Riscos principais:**
- SEC EDGAR com campos XBRL inconsistentes entre empresas → mitigado com fallbacks no script de ingestão
- Polygon.io rate limits na ingestão inicial → mitigado com sleep de 13s + correr em off-hours
- Features a demorar mais do que estimado → cortar scope do MVP, não atrasar o lançamento
- Gemini a alucinar em empresas menos conhecidas → cache + aviso claro na UI

**Regra de corte:** se em Semana 8 uma feature MVP ainda não estiver funcional, é cortada do MVP e passa para v1. O lançamento não atrasa.
