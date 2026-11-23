# ADR-001 · Supabase em vez de Neon + Drizzle + Better Auth
Data: 23/11/2026 · Status: aceita

**Contexto:** o kit (§05) indica Neon + Drizzle + Better Auth + Upstash para N2. Temos 8 dias, 2 iniciantes e precisamos de banco, auth, storage de imagens e isolamento por usuário.
**Alternativas:** 1) stack do kit (4 serviços) 2) Supabase (Postgres + Auth + Storage + RLS) 3) Firebase.
**Decisão:** Supabase. Desvio consciente do kit: um painel só, RLS no banco como segunda barreira e Storage privado com policy por pasta.
**Consequências:** sem ORM (SQL + tipos gerados); migrations em `supabase/migrations`; contador de IA em tabela (sem Upstash); acoplamento ao Supabase concentrado em `lib/db` e `lib/supabase`.
**Gatilho para revisitar:** custo/limite do plano gratuito, necessidade de jobs/filas, ou passar para N3 (pagamento).
