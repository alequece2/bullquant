# Changelog - BullQuant

## [Unreleased] - Fase S2 (Autenticação + Pesquisa + i18n)

### Adicionado
- **Pesquisa Funcional (Search API):** 
  - Backend na rota `/api/search/route.ts` ligado à base de dados PostgreSQL via Prisma.
  - Componente de `<SearchBar />` na frontend com *debounce* e autocomplete em tempo real.
- **Autenticação Segura (Supabase SSR):**
  - Implementação completa com Server Actions para o fluxo de Registo, Login e Logout protegidos no servidor (Next.js 15).
  - Páginas de interface exclusivas para criar conta (`/register`) e entrar (`/login`).
  - Middleware global (`middleware.ts`) que gere a persistência e segurança da sessão em todas as rotas.
  - Sincronização automática entre as contas Supabase Auth (`auth.users`) e a tabela `users` do Prisma através de um Trigger SQL.
- **Página de Acão (Base):** Rota `/stock/[ticker]` preparada funcionalmente (esqueleto) para ir buscar a empresa atual à BD e não dar erro 404, pronta para a construção do Dashboard (S3).

### Removido
- **Componentes Estáticos Desatualizados:** A `Sidebar` e `TickerTape` estáticas que serviam apenas de mockup foram removidas para regressar à arquitetura robusta exigida pelo plano. O `Header.tsx` voltou a assumir o lugar principal com o design dinâmico de Login/Logout dependente da sessão.
