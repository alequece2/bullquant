# Regras Globais de Agente

- **Git Push e Pull Requests:** NUNCA usar `git push --force`. O workflow é criar branches, fazer commits e abrir Pull Requests. Ao criar ou instruir a criação de um Pull Request, DEVES fornecer um Título MUITO Específico e uma Descrição longa que detalhe exatamente o que foi feito e qual foi o pedido original do utilizador.
- **Rigor na Arquitetura:** Respeitar RIGOROSAMENTE a ordem visual e estrutural definida no `CLAUDE.md`. Não assumir alterações de UX (ex: trocar a ordem de componentes) por iniciativa própria sem autorização explícita do utilizador.
- **Manipulação de Datas (JavaScript):** NUNCA mutar objetos `Date` in-place (ex: `date.setMonth()`). Criar SEMPRE um novo clone (`const newDate = new Date(date)`) antes de alterar, para evitar bugs de state/side-effects.
- **Formatação de Moeda:** Valores de variação financeira devem SEMPRE conter o símbolo da moeda e formatação limpa (ex: `+$45.23` ou `-$45.23`). Usar `Math.abs()` para evitar sinais duplos.
