# Bullquant: Technical Review & Corrections Report (for Claude)

Olá Claude,

Estivemos a fazer uma auditoria profunda à arquitetura e ao código que deixaste na plataforma **Bullquant**. Embora a estrutura inicial fosse razoável, encontrámos **várias falhas críticas na ingestão de dados financeiros** e **decisões de UI/UX não-premium** que comprometiam a precisão e a estética da plataforma. 

Abaixo detalhamos exatamente o que fizeste mal, como diagnosticámos os problemas e como os resolvemos.

---

## 1. Falhas na Ingestão de Dados (SEC EDGAR)

### 1.1. Lucro Líquido (Net Income) em UPREITs e Holdings
**O teu erro:** Estavas a extrair o *Net Income* consolidado bruto das empresas na SEC. No caso de empresas estruturadas como UPREITs ou parcerias (ex: Prologis - PLD), esse valor mistura os lucros da empresa com o dinheiro que pertence a parceiros externos (Minority/Non-controlling Interests). Ao usar a tua extração, um investidor estaria a ver lucros inflacionados, o que distorcia métricas como o P/E (Price-to-Earnings).
**A nossa correção:** Alterámos a lógica para captar estritamente o Lucro Líquido *atribuível aos acionistas comuns*. Documentámos isto na nossa "Bíblia" de Discrepâncias (`DATA_DISCREPANCIES.md`). O Lucro Líquido da Prologis caiu para o valor real e exato.

### 1.2. Capital Expenditure (CapEx) Incorreto para REITs
**O teu erro:** O teu mapeamento de CapEx baseava-se em tags genéricas (ex: `PaymentsToAcquirePropertyPlantAndEquipment`). No setor imobiliário, comprar um edifício novo não é CapEx de *manutenção*, é investimento de crescimento. Além disso, falhaste as tags reais de manutenção imobiliária. O resultado? O CapEx da Prologis estava a `null` ou com valores errados desde 2019. O Free Cash Flow era inútil.
**A nossa correção:** Fizemos engenharia reversa aos ficheiros XBRL da SEC. Adicionámos as tags `PaymentsForCapitalImprovements` e, mais criticamente, `PaymentsForLeasingCostsCommissionsAndTenantImprovements`. Atualizámos o `ingest_fundamentals.py` para **somar** as tags ativas, garantindo um cálculo exato dos custos de manutenção (que resulta num FCF idêntico ao *AFFO* - Adjusted Funds From Operations).

### 1.3. Concorrência e Processos em Segundo Plano
**O teu erro:** Lançaste um script de ingestão global para as 500 empresas que demorava imenso tempo a correr. Quando corrigíamos um script no momento, o teu processo antigo (que ainda estava a correr em memória com o código obsoleto) continuava a fazer chamadas à base de dados, **apagando as nossas correções** assim que chegava a essa empresa específica no loop. A base de dados não tinha transações seguras para prevenir *overwrites* antigos.
**A nossa correção:** Detetámos o problema inspecionando os *timestamps* (`updatedAt`) no Prisma. Aguardámos a conclusão do teu processo zumbi e executámos o script de correção limpo, atualizando a base de dados permanentemente.

---

## 2. Falhas Críticas de UI/UX (Frontend)

### 2.1. Tooltips Inestéticos (HTML Nativo)
**O teu erro:** Utilizaste o atributo `title` nativo do HTML para mostrar explicações nos componentes. Para uma plataforma financeira que quer passar uma imagem premium, o retângulo cinzento padrão do Windows/Mac é inaceitável. Cortava a interação e parecia amador.
**A nossa correção:** Implementámos a biblioteca `@radix-ui/react-tooltip` via *Shadcn*. Os tooltips são agora renderizados em HTML dinâmico, com fundo escuro (`bg-[#18181b]`), sombras elegantes, letras perfeitamente formatadas e micro-animações suaves de *fade* e *slide*.

### 2.2. Colisão de Componentes (Recharts vs Radix)
**O teu erro:** Não previste que, ao adicionar bibliotecas de UI profissionais num ficheiro com gráficos, os nomes iriam colidir. O teu código resultava num erro de build fatídico: `the name 'Tooltip' is defined multiple times`, porque tanto a biblioteca `recharts` como os componentes `@/components/ui/tooltip` usavam exatamente o mesmo nome.
**A nossa correção:** Fizemos um alias limpo no `import` (`import { Tooltip as UITooltip }`) para isolar o Tooltip da Radix do Tooltip do Recharts.

### 2.3. Prevenção de Bugs Recharts (Flatline & Focus Rings)
**O teu erro:** 
1. Os gráficos desapareciam misteriosamente (crash do Recharts) quando a empresa tinha dados constantes ao longo dos anos (Data Min == Data Max).
2. Quando abríamos um modal (Dialog), o Radix focava o gráfico, desenhando um anel rosa brilhante e horrendo em volta do SVG.
**A nossa correção:** 
1. Adicionámos um `domain` inteligente no eixo Y: `[(dataMin: number) => Math.min(0, dataMin), 'auto']`.
2. Esmagámos o estilo padrão do Radix injetando classes fortes de reset Tailwind no wrapper do Dialog: `focus-visible:ring-0 outline-none [&_*:focus]:outline-none`.

---

**Resumo:** Não te preocupes, Claude. O esqueleto inicial era bom e permitiu-nos chegar aqui rapidamente. Mas o salto de "protótipo razoável" para **"plataforma institucional de excelência"** exigiu uma análise minuciosa dos dados SEC e um rigor obsessivo no design, que acabámos de realizar. Podes rever e aprender com o código!
