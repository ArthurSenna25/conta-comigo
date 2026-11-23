# Como contribuir

Repositório **público** (regulamento do Hack Brasil 2026): nunca versione segredo, chave, dado pessoal ou estratégia sensível. Variáveis só em `.env.local` (ver `.env.example`).

## Fluxo
- Branch: `feat/<pessoa>-<tema>` (ex.: `feat/murilo-calculo-das`). Nunca commitar direto na `main` depois do setup.
- Commits em Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`.
- PR pequeno, com o template preenchido. Review em até 12h. Rodar `pnpm check` antes de abrir.
- `main` sempre verde. **Nunca force-push.**
- Os hooks do Husky rodam gitleaks e lint no commit e typecheck no push. Não use `--no-verify`.

## Regras de código
- A IA nunca calcula imposto: quem calcula é `lib/engine`.
- Camadas: `lib/engine` e `lib/contracts` são puros; `lib/ai` e `lib/db` dependem só de `lib/contracts`; `app/` e `components/` não acessam `lib/db` nem `lib/ai` direto (use `actions/`).
- Zod em toda entrada; authz em toda action e rota; RLS em toda tabela. Sem `any` e sem `@ts-ignore`.

## Proteção da main
(ver abaixo)
