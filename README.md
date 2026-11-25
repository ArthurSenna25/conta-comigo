# Conta Comigo

Assistente contábil e financeiro com IA para MEIs, feito para o **Hack Brasil 2026**. App web mobile-first (PWA): o MEI envia foto, áudio ou texto, a IA extrai o lançamento em rascunho, o MEI confirma, e o app mostra o limite anual do MEI, o DAS e alertas, com um chat que cita a fonte.

> A IA nunca calcula imposto. Quem calcula é `lib/engine`, que é determinístico e testado.

Fora de escopo: emitir nota ou DAS, integração gov.br, Open Finance, app nativo.

## Como rodar
Requisitos: Node 24 e pnpm 12 (`corepack enable`).

```bash
pnpm install
cp .env.example .env.local   # preencha só localmente; nunca versione
pnpm dev                     # http://localhost:3000
```

Comandos: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm check` (tudo) · `pnpm build`.

## Variáveis de ambiente (só os nomes)
`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` · `SUPABASE_SECRET_KEY` (só servidor) · `AI_PROVIDER` · `AI_API_KEY` · `AI_DAILY_BUDGET_CENTS` · `NEXT_PUBLIC_USE_MOCKS`

## Pastas e donos
| Pasta | Dono | Papel |
|---|---|---|
| `app/(marketing)`, `app/page.tsx` | Arthur | landing |
| `app/(app)`, `app/onboarding`, `app/legal`, `kb` | Frigeri | telas autenticadas, termos/LGPD, base de conhecimento |
| `app/api`, `kb/prompts` | Gui | ingestão e chat |
| `actions`, `components`, `lib/db`, `lib/security`, `lib/supabase`, `supabase/migrations` | Arthur | mutações, UI, dados, segurança |
| `lib/engine`, `supabase/seed` | Murilo | cálculo fiscal e financeiro (puro) |
| `lib/ai` | Gui | provedor de IA |
| `lib/contracts` | Arthur | schemas Zod compartilhados (puro) |

Regra de camadas: `lib/engine` e `lib/contracts` não importam next, react, supabase, SDK de IA nem fs; `lib/ai` e `lib/db` dependem só de `lib/contracts`; `app/` e `components/` passam por `actions/`.

Documentação: `docs/` (kit e base de conhecimento), `docs/projeto/` (dossiê), `docs/_projeto/PROGRESS.md` (estado atual). Contribuição: [CONTRIBUTING.md](CONTRIBUTING.md).
