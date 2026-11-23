# CLAUDE.md — Conta Comigo
@docs/00-TRIAGEM-E-PROFUNDIDADE.md

## Contexto
App web mobile-first (PWA) de assistente contábil e financeiro com IA para MEIs. O MEI envia foto, áudio ou texto, a IA extrai o lançamento em rascunho, o MEI confirma, e o app mostra limite anual do MEI, DAS e alertas, com chat que cita a fonte. Hack Brasil 2026: prazo **30/11 23h59**, **freeze 29/11 18h**.
Nível: **N2 com segurança e LGPD reforçadas** (triagem em `docs/_projeto/PRODUCT.md`). Dado financeiro e pessoal de MEI: tratar como sensível.

## Comandos (pnpm; Windows + PowerShell 5.1, sem `&&`)
dev: `pnpm dev` · build: `pnpm build` · lint: `pnpm lint` · tipos: `pnpm typecheck` · testes: `pnpm test` · tudo: `pnpm check` (lint + typecheck + test)

## Regras permanentes
- A IA NUNCA calcula imposto. Quem calcula é `lib/engine` (puro, determinístico, testado). A IA só extrai e explica.
- Camadas: `lib/engine` e `lib/contracts` são PUROS (sem next, react, supabase, SDK de IA, fs). `lib/ai` e `lib/db` dependem só de `lib/contracts`. `app/` e `components/` não acessam `lib/db` nem `lib/ai` direto: passam por `actions/` ou `app/api/`. Imports internos com alias `@/*`.
- Nunca ler nem imprimir `.env*`, chaves ou `~/.claude.json`. Segredos só em `.env.local`; o `.env.example` tem só nomes.
- Repositório PÚBLICO (regulamento do hackathon): nada de segredo, dado pessoal ou estratégia sensível em arquivo versionado.
- Valide toda entrada com Zod no servidor. Nunca interpole entrada em SQL. Authz em toda action e rota; RLS em toda tabela.
- Nunca `any`, `@ts-ignore` ou `.d.ts` falso. Mesmo erro 3x: pare e diagnostique a causa raiz.
- Dependência: uma por vez; confirmar que o pacote existe e é o oficial; validar antes da próxima. Nada que gere cobrança.
- Não mudar model, effortLevel, hooks, auto mode nem provedor.
- Server Components por padrão; `"use client"` só com interatividade real.
- Seção visual pronta = screenshot Playwright mobile (390px) conferido.
- Verificar antes de dizer "pronto": `pnpm check` e `pnpm build`.
- Commits atômicos em Conventional Commits; PR pequeno; main sempre verde; nunca force-push.
- Fora de escopo: emitir nota ou DAS, integração gov.br, Open Finance, app nativo. Ideias vão para o Backlog em `docs/_projeto/PROGRESS.md`.

## Roteador de docs (só se o gatilho ocorrer)
requisitos/briefing → `docs/03` · visual/UI/motion/a11y → `docs/04` · stack/arquitetura → `docs/05` · banco → `docs/07` · auth/dados pessoais/upload/LGPD → `docs/08` · QA/entrega → `docs/09` · planejamento → `docs/02` · tokens/ferramentas → `docs/10`.
Documentos do projeto (dossiê, documento de projeto): `docs/projeto/`. Estado atual: `docs/_projeto/PROGRESS.md`.

## Fluxo por fase
Explorar → plano curto → implementar → verificar (`pnpm check`, build, screenshot) → commit → atualizar `docs/_projeto/PROGRESS.md` (≤ 15 linhas) → `/clear` ao mudar de assunto.

## Ferramentas
Plano/TDD/debug: superpowers · Código: Graphify · Docs de lib: Context7 (se disponível) ou docs oficiais · Verificação: Playwright (webkit) · Postgres/RLS: skill postgres-best-practices.
