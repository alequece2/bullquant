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
- **Recuperação de Password:**
  - Fluxo "Esqueci-me da password" (`/forgot-password` e `/reset-password`).
  - Rota de callback segura (PKCE) em `/auth/callback`.
- **UX e Validações Profissionais:**
  - Middleware configurado para proteger rotas privadas (`/portfolio`, `/settings`) e redirecionar users logados das rotas de auth.
  - Componente genérico `SubmitButton` para mostrar feedback de *Loading* (evita duplos-cliques e ansiedade no utilizador).
  - Validação instantânea no frontend (HTML5 `minLength`) e Backend.
  - Tradução dos erros nativos do Supabase para português amigável.
- **Conta de Utilizador:**
  - Criação da página `/settings` (O Meu Perfil).
  - O Header agora cumprimenta o utilizador pelo seu nome próprio e possui um atalho visual e clicável (`UserCircle`) para a página da sua conta.
- **Página de Acão (Base):** Rota `/stock/[ticker]` preparada funcionalmente (esqueleto) para ir buscar a empresa atual à BD e não dar erro 404, pronta para a construção do Dashboard (S3).

### Removido
- **Componentes Estáticos Desatualizados:** A `Sidebar` e `TickerTape` estáticas que serviam apenas de mockup foram removidas para regressar à arquitetura robusta exigida pelo plano. O `Header.tsx` voltou a assumir o lugar principal com o design dinâmico de Login/Logout dependente da sessão.
