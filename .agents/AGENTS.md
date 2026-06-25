# Regras Globais de Agente

- **Git Push e Pull Requests:** NUNCA usar `git push --force`. O workflow é criar branches, fazer commits e abrir Pull Requests. Ao criar ou instruir a criação de um Pull Request, DEVES fornecer um Título MUITO Específico e uma Descrição longa que detalhe exatamente o que foi feito e qual foi o pedido original do utilizador.
- **Rigor na Arquitetura:** Respeitar RIGOROSAMENTE a ordem visual e estrutural definida no `CLAUDE.md`. Não assumir alterações de UX (ex: trocar a ordem de componentes) por iniciativa própria sem autorização explícita do utilizador.
- **Manipulação de Datas (JavaScript):** NUNCA mutar objetos `Date` in-place (ex: `date.setMonth()`). Criar SEMPRE um novo clone (`const newDate = new Date(date)`) antes de alterar, para evitar bugs de state/side-effects.
- **Formatação de Moeda:** Valores de variação financeira devem SEMPRE conter o símbolo da moeda e formatação limpa (ex: `+$45.23` ou `-$45.23`). Usar `Math.abs()` para evitar sinais duplos.
### 🛡️ Regras de Robustez e Qualidade de Código

- **[BD] Prisma Migrations:** NUNCA saltar migrations em produção ou desenvolvimento se houver alterações no `schema.prisma`. O comando correto é SEMPRE `npx prisma migrate dev`. A utilização de `db push` para contornar problemas de *drift* é expressamente proibida.
- **[i18n] Next-Intl Fallbacks:** A biblioteca `next-intl` NÃO suporta a sintaxe `{ fallback: 'texto' }` para definir valores por defeito em traduções ausentes. Esse segundo argumento serve apenas para interpolação de variáveis. Não inventar funcionalidades da biblioteca.
- **[i18n] Chaves Órfãs:** Ao adicionar chaves de tradução aos ficheiros `.json` (ex: `pt.json`, `en.json`), validar sempre se o componente consome efetivamente essas chaves. Não inserir chaves de forma especulativa (ex: `1d`, `3m`) criando "dead code".
- **[TS] Tipagem Prisma Decimal:** Em rotas de API e serializações, NUNCA usar `any` nem a verificação `constructor.name === 'Decimal'` (que falha em minificação). A abordagem aprovada e estrita é verificar `typeof val === 'object' && 'toNumber' in val` e usar type assertions como `(val as { toNumber(): number }).toNumber()`.
- **[CSS] Specificity no Tailwind:** Ao customizar componentes estruturais do *Shadcn UI* (ex: `DialogContent`) que contenham larguras estáticas com prefixos de ecrã (ex: `sm:max-w-sm`), a classe de substituição TEM de conter o mesmo prefixo (ex: `sm:max-w-5xl`). Caso contrário, o `tailwind-merge` não aplica a regra de especificidade corretamente em ecrãs *desktop*.
