# BullQuant — Visão do Produto

## O que é

**BullQuant** é uma plataforma web de análise fundamental de ações para retail investors, focada em value investing. Agrega 15 anos de dados financeiros históricos, ferramentas de avaliação (DCF) e análise qualitativa por IA, numa interface visual e acessível — sem o custo e a complexidade das plataformas institucionais.

A plataforma é desenvolvida e distribuída pela **Bullocracy** e tem como objectivo principal tornar-se a ferramenta de referência para o investidor individual português que pratica ou quer aprender value investing.

---

## Público-alvo

### Perfil principal

| Atributo | Definição |
|---|---|
| Tipo | Retail investor individual |
| Nível | Iniciante a intermédio |
| Estilo de investimento | Value investing / análise fundamental |
| Perfil de decisão | Investe a longo prazo, quer perceber o que compra |
| Geografia | PT/UE (audiência primária), expansão global em EN |
| Canal de entrada | Audiência da Bullocracy (vídeos, redes sociais) |

### O que este utilizador precisa

- Ver 10-15 anos de fundamentais de forma visual e limpa (Revenue, EPS, FCF, ROIC…)
- Perceber rapidamente se uma empresa está a crescer e se é de qualidade
- Calcular se uma ação está sub ou sobreavaliada (DCF)
- Perceber o "porquê" qualitativo por trás de uma empresa (IA)
- Acompanhar as empresas que segue num portfólio / watchlist pessoal

### O que este utilizador NÃO é

- Day trader — não precisa de cotações ao milissegundo
- Quant — não precisa de backtesting ou screening complexo (pelo menos no início)
- Institucional — não precisa de dados Bloomberg nem de relatórios de analistas pagos

---

## Proposta de valor

| Eixo | Proposta |
|---|---|
| **Dados** | 15 anos de fundamentais históricos, limpos, visuais, sem ter de abrir PDFs de relatórios |
| **Avaliação** | DCF integrada que autopreenche com dados reais da empresa |
| **IA** | Análise qualitativa gerada em segundos — moat, catalisadores, riscos |
| **Preço** | Gratuito no início. Sem paywall para ver fundamentais. |
| **Língua** | Em português — não há nenhuma plataforma equivalente em PT |
| **Comunidade** | Ligado à Bullocracy — conteúdo que educa e ferramenta que executa |

---

## Concorrência

### Referência principal: Qualtrim

| Atributo | Qualtrim | BullQuant |
|---|---|---|
| Foco | Value investing, fundamentais | Idem |
| Dados históricos | 10+ anos, US + algumas EU | 15 anos, US-first |
| DCF | Sim, integrada | Sim, integrada |
| AI | Não (resumo editorial manual) | Sim (Gemini) |
| Idioma | Inglês | Português (primário) |
| Preço actual | ~$9.99/mês (só subscrição) | Gratuito no MVP |
| Modelo de distribuição | Joseph Carlson (YouTube, Patreon, Discord) | Bullocracy |
| Empresa | 1 pessoa, sem funding | 3 pessoas, sem funding |

**Vantagem do BullQuant:** AI Insights genuína, gratuito, português, comunidade própria.

**Desvantagem honesta:** Qualtrim tem anos de dados curados, bugs resolvidos e audiência estabelecida. Não se recupera isso num verão — recupera-se com consistência e diferenciação.

### Outros competidores relevantes

| Plataforma | Posicionamento | Diferença para o BullQuant |
|---|---|---|
| Simply Wall Street | Gráficos estilo "teia de aranha", foco visual | Mais caro, inglês, menos detalhe em fundamentais brutos |
| Stock Unlock | All-in-one, DCF, screener | Inglês, $9/mês, sem IA qualitativa |
| Koyfin | Bloomberg-lite para retail | Mais complexo, inglês, caro para tudo |
| Finviz | Screener + heatmaps | Sem histórico fundamental, sem DCF, sem IA |
| Macrotrends | Dados históricos grátis | Sem portfólio, sem DCF, sem IA, UI datada |

---

## Modelo de negócio

### Fase 1 — MVP (este verão): Completamente gratuito

- Sem monetização activa
- Objectivo: validar o produto com utilizadores reais
- Custo operacional: ~0€/mês (todos os serviços no free tier)
- Métrica de sucesso: utilizadores activos, retenção, feedback qualitativo

### Fase 2 — v1 (pós-lançamento): Freemium

**Free:**
- Acesso a todas as funcionalidades base (pesquisa, fundamentais, price history, Decision Engine)
- Limite de AI Insights por dia (a definir — provavelmente 3-5)
- 1 portfólio / watchlist

**Pro (~9-15€/mês):**
- AI Insights ilimitados
- Alertas de preço por email
- Screener com filtros avançados
- Múltiplos portfólios
- Funcionalidades v1 completas

### Fase 3 — v2 (com receita): Pro expandido

- ETFs, empresas europeias completas
- App móvel
- Alertas por fundamentais (ex: ROIC desce abaixo de 15%)
- Exportação de dados

### Nota sobre a conta

O custo variável principal é a API do Gemini (AI Insights). Com limites por utilizador no free tier, o custo escala de forma controlada. Os dados (SEC EDGAR) são gratuitos independentemente do número de utilizadores. A infra (Vercel + Supabase) tem planos pagos razoáveis quando for necessário escalar.

---

## Distribuição — Bullocracy

### O que é a Bullocracy (Junho 2026)

| Plataforma | Métricas |
|---|---|
| TikTok | ~4.090 seguidores, 1,9M visualizações/ano, 46K gostos, 11K partilhas |
| Instagram | ~486 seguidores, 83 publicações |
| YouTube | ~75 subscritores, 37 vídeos |

Tagline: *"Simples análises num mundo de ideias complexas."*

Conteúdo: economia, política e finanças portuguesas e geopolítica. Algum conteúdo de investimento (Value Investing vs Growth, análises de bolsa), mas minoritário no total.

### Diagnóstico honesto

A Bullocracy tem **alcance**, não tem ainda **comunidade cativa de investidores**. Os 94,5% de tráfego "Para Ti" no TikTok indicam audiência fria — gente que vê um vídeo viral e segue em frente. Os picos de visualizações são de atualidade/política (Autárquicas, Habitação, Trabalho), não de stock analysis. A audiência actual não é, na maioria, a audiência que o BullQuant precisa.

Isto significa que o "modelo Joseph Carlson" (comunidade leal de nicho → produto) não se aplica directamente ainda. Falta o passo intermédio.

### Estratégia de distribuição

**1. Captura de audiência — fazer JÁ, antes do produto estar pronto**

Criar um mecanismo de captura: newsletter, Discord ou lista de "early access ao BullQuant" integrada nos vídeos. Cada vídeo viral que passa sem capturar um contacto é audiência perdida para sempre. Chegar ao lançamento com uma lista de 200-500 pessoas interessadas vale muito mais do que tráfego frio de FYP no dia do lançamento.

**2. Aquecimento de conteúdo**

Nos meses antes do lançamento, aumentar gradualmente o conteúdo de value investing / análise de empresas — para filtrar e alinhar a audiência certa para o produto.

**3. Flywheel conteúdo ↔ produto**

Análises feitas no BullQuant viram vídeos: *"Analisámos a NVDA com o BullQuant — vê o que descobrimos."* Os vídeos trazem gente ao produto. O produto gera material para mais vídeos. Este ciclo, quando arranca, é muito difícil de parar.

**Expectativa realista no lançamento:** dezenas a baixas centenas de utilizadores activos iniciais. Suficiente para validar e iterar. Não contar com milhares no dia 1.
