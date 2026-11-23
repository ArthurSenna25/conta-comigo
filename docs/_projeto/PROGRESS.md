# PROGRESS — Conta Comigo

**Nível:** N2 (segurança e LGPD reforçadas) · **Fase atual:** P3 concluída · **Atualizado:** 23/11/2026

## Feito
- Setup: scaffold Next 16 + Tailwind v4 + shadcn, husky/gitleaks, CI, `main` protegida, regras de camadas no ESLint.
- P3: `lib/contracts` (Zod, mocks set–nov/2026, `AiProvider`), stubs de `lib/engine`, `tests/camadas.test.ts`, `docs/ARQUITETURA.md`, `DADOS.md` (5 tabelas), `AMEACAS.md`, `LGPD.md`, ADR-001..004.
## Próximo (1 fase)
- Banco: migrations + RLS + Storage conforme `docs/DADOS.md` (Arthur). Em paralelo: Murilo implementa `lib/engine` contra os stubs; Gui implementa `AiProvider`; Frigeri o onboarding contra `PerfilInput`.
## Decisões e premissas
- 23/11 Repo público por exigência do regulamento; nada sensível versionado.
- 23/11 Rascunho só na tela; alertas calculados na leitura; histórico do chat só no navegador; sem audit_log (ADR-004).
- 23/11 Exclusão de conta: Storage pela API → `auth.admin.deleteUser` → cascade.
## Pendências / bloqueios
- CODEOWNERS só com Arthur; convidar Gui, Murilo e Frigeri e ajustar. Favicon removido (404 em dev).
- LGPD.md: itens "REVISAR COM HUMANO" (encarregado, retenção de imagens, DPA do provedor).
## Backlog
- simularEmprestimo (S1) · audit_log de lançamentos · estados de rascunho persistidos · tabela de mensagens do chat.
