# Notas sobre Discrepâncias de Dados (Bullquant vs Outros Sites)

Este documento regista as decisões de cálculo e extração de dados financeiros na plataforma Bullquant, para servir de referência futura sempre que existirem dúvidas sobre discrepâncias entre os nossos gráficos e os de plataformas públicas (como Macrotrends, Stock Analysis, Yahoo Finance, etc.).

O nosso objetivo é apresentar **a realidade financeira rigorosa baseada nos relatórios SEC (10-K e 10-Q)**, mesmo que isso implique divergir das abordagens "preguiçosas" de outros scrapers de mercado.

## 1. Dívida Total (Total Debt) vs Dívida de Longo Prazo

**Cenário de Dúvida:**
Ao comparar a Apple (AAPL) em 2016, outros sites reportam "Debt" a rondar os $75.43B, enquanto o Bullquant reporta $87.03B.

**A Nossa Metodologia:**
O Bullquant está **correto**. A maioria dos sites genéricos lê apenas a etiqueta oficial de `LongTermDebtNoncurrent` (Dívida de Longo Prazo) e ignora as dívidas de curto prazo. 
Nós calculamos a **Dívida Total** somando:
- Dívida de Longo Prazo Não-Corrente (Long-term Debt)
- Dívida de Curto Prazo (Current portion of long-term debt)
- Papel Comercial / Linhas de crédito a curto prazo (Commercial Paper / Short-term Debt)

No caso da AAPL 2016: $75.43B (Longo Prazo) + $3.50B (Curto Prazo) + $8.10B (Papel Comercial) = **$87.03B**.

---

## 2. Despesas Operacionais (SG&A vs Marketing)

**Cenário de Dúvida:**
Em 2016, outros sites mostram $0 para *Sales & Marketing* (S&M) e $0 para *General & Administrative* (G&A) na Apple. O Bullquant apresenta um único bloco de $14.19B para SG&A.

**A Nossa Metodologia:**
O Bullquant está **correto**. Várias empresas (incluindo a Apple) **não separam** os custos de Marketing dos custos de Administração nas suas contas oficiais na SEC, reportando tudo numa única rubrica agregada: `SellingGeneralAndAdministrativeExpense`.
Enquanto outros robôs falham a extração por não encontrarem a linha isolada do Marketing e devolvem $0, o motor do Bullquant está programado para aceitar a métrica combinada oficial.

---

## 3. CapEx (Capital Expenditures) e Ativos Intangíveis

**Cenário de Dúvida:**
O Bullquant mostra um CapEx superior ao puro investimento físico (Property, Plant & Equipment). Exemplo: Apple 2016, o PP&E é $12.73B, mas o Bullquant reporta $13.55B.

**A Nossa Metodologia:**
Na ótica puramente financeira, principalmente para empresas tecnológicas (Apple, Microsoft, Software, Biotecnologia), as patentes, licenças de software e propriedade intelectual são investimentos críticos de capital, tão essenciais como tijolos de fábricas. 
Decidimos que a fórmula do Bullquant soma os ativos físicos aos ativos intangíveis:
`CapEx Total = PaymentsToAcquirePropertyPlantAndEquipment + PaymentsToAcquireIntangibleAssets`
Isto reflete um **Free Cash Flow (FCF) mais conservador e realista** para o investidor moderno.

*(Nota: a exclusão propositada de dados "mock" no passado não está descrita aqui, mas o motor foi limpo em Junho de 2026 para ler exclusivamente dados SEC 100% autênticos).*

---

## 4. Lucro Líquido (Net Income) em UPREITs e Parcerias

**Cenário de Dúvida:**
Comparando a Prologis (PLD) em 2025, outros sites indicam um Net Income de $3.41B, enquanto o Bullquant reporta $3.33B.

**A Nossa Metodologia:**
O Bullquant está **correto**. A Prologis opera como um UPREIT, onde a empresa cotada na bolsa (Prologis, Inc.) detém cerca de 97% da parceria principal, sendo os restantes 3% detidos por terceiros (*Non-controlling interests*).
A métrica oficial de $3.41B inclui os lucros atribuíveis a esses parceiros privados, dinheiro ao qual os acionistas da bolsa **não têm qualquer direito**. 
O algoritmo do Bullquant extrai a tag oficial `NetIncomeLoss`, que deduz esses interesses minoritários e devolve exatamente **o lucro que pertence à empresa mãe e aos seus acionistas** ($3.33B). Esta abordagem protege os investidores de avaliações (como P/E) inflacionadas.
