# PROGRESS — Conta Comigo

**Nível:** N2 (segurança e LGPD reforçadas) · **Fase atual:** P4 (banco) em andamento · **Atualizado:** 24/11/2026

## Feito
- Setup: scaffold Next 16 + Tailwind v4 + shadcn, husky/gitleaks, CI, `main` protegida, regras de camadas no ESLint.
- P3: `lib/contracts` (Zod, mocks set–nov/2026, `AiProvider`), stubs de `lib/engine`, `tests/camadas.test.ts`, `docs/ARQUITETURA.md`, `DADOS.md` (5 tabelas), `AMEACAS.md`, `LGPD.md`, ADR-001..004.
- P4: 4 migrations aplicadas no projeto remoto (esquema, funções/triggers, RLS + GRANT, storage); RLS e policies conferidas no painel.
- P4: `db advisors` achou 2 WARN (`rls_auto_enable()` executável por anon/authenticated) + 1 INFO (FK sem índice de cobertura). Corrigido e aplicado em `20261124130000_corrige_advisors.sql`; advisors agora: "No issues found".
- P4: `pnpm test:rls` 30/30 (2 usuários descartáveis, limpeza garantida). Achou 1 bug de desenho: check `revogado_em >= aceito_em` quebra com skew de relógio (removido).
## Próximo (1 fase)
- P4 (resto): `gen types`, repositórios em `lib/db`, `seed/demo.sql` e EXPLAIN das 6 consultas.
- Em paralelo: Murilo implementa `lib/engine`; Gui `AiProvider`; Frigeri o onboarding contra `PerfilInput`.
## Decisões e premissas
- 23/11 Repo público por exigência do regulamento; nada sensível versionado.
- 23/11 Rascunho só na tela; alertas calculados na leitura; histórico do chat só no navegador; sem audit_log (ADR-004).
- 23/11 Exclusão de conta: Storage pela API → `auth.admin.deleteUser` → cascade.
- 24/11 P4 segue `DADOS.md`/ADR-004, não o kit: sem audit_log, sem tabela de categorias, sem status de rascunho, sem trigger de perfil (nasce no onboarding), bucket só imagem 5 MiB.
- 24/11 Projeto com acesso automático a tabelas desligado: GRANT explícito só para `authenticated`; `service_role` sem GRANT de tabela (menor privilégio).
- 24/11 `.mcp.json` fora do git (tem o project_ref). MCP do Supabase adicionado no meio da sessão não carrega: precisa reiniciar o Claude Code e autenticar em `/mcp`.
## Pendências / bloqueios
- CODEOWNERS só com Arthur; convidar Gui, Murilo e Frigeri e ajustar. Favicon removido (404 em dev).
- LGPD.md: itens "REVISAR COM HUMANO" (encarregado, retenção de imagens, DPA do provedor).
- Demo: usuário de demonstração é criado por script (senha fora do repo); ainda não existe.
## Backlog
- simularEmprestimo (S1) · audit_log de lançamentos · estados de rascunho persistidos · tabela de mensagens do chat.
