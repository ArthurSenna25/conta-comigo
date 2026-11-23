# PROGRESS — Conta Comigo

**Nível:** N2 (segurança e LGPD reforçadas) · **Fase atual:** setup concluído · **Atualizado:** 23/11/2026

## Feito
- Repo público, scaffold Next 16 + Tailwind v4 + shadcn, zod/vitest/husky/lint-staged/supabase CLI.
- Pastas com donos, regras de camadas (`eslint.layers.mjs`), CLAUDE.md, README, CONTRIBUTING.
- Husky (gitleaks, bloqueio de .env, lint-staged; typecheck no push), CI, Dependabot, `main` protegida, labels, milestone.
## Próximo (1 fase)
- Sessão P3: arquitetura, dados e contratos.
## Decisões e premissas
- 23/11 Repo público por exigência do regulamento; nada sensível versionado.
## Pendências / bloqueios
- Ligar `eslint.layers.mjs` ao `eslint.config.mjs` (hook config-protection do ecc bloqueou a edição).
- CODEOWNERS só com Arthur; convidar Gui, Murilo e Frigeri e ajustar. Favicon removido (404 em dev).
## Backlog
- (vazio)
