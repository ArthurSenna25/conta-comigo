# Arthur · handoff

## Objetivo
Fundação de design que o time inteiro reusa, a landing, a demo do júri, a infra e a revisão de todos os PRs.

## Pastas
**Pode tocar:** `app/(marketing)`, `app/page.tsx`, `app/(auth)`, `app/consentimento`, `components/`, `actions/`, `lib/contracts`, `lib/db`, `lib/security`, `supabase/migrations`, `.github`, `app/globals.css`, `app/layout.tsx`, `docs/`.
**Não pode (sem combinar com o dono):** `app/(app)/*`, `app/onboarding`, `app/legal`, `kb/` (Frigeri) · `lib/engine`, `supabase/seed` (Murilo) · `lib/ai`, `app/api` (Gui).

## Já pronto
- Auth e portão: `actions/auth.ts`, `actions/sessao.ts` (`exigirAcesso`), `proxy.ts`, telas `/entrar`, `/cadastrar`, `/consentimento`.
- Dados: `actions/perfil.ts`, `actions/lancamentos.ts`, `actions/dashboard.ts`, `lib/db/*`, RLS testada (`pnpm test:rls`).
- Portão de API: `actions/portao-api.ts` (`exigirAcessoApi`).
- Demo do júri (PR #9): `components/auth/botao-demo.tsx`, `components/demo/faixa-demo.tsx`, `pnpm seed:demo`.
- Reserva atômica de IA (PR #13): migration `20261124140000` aplicada no remoto.
- Pacote do Claude Design em `design/handoff/` (PR #14), fora do lint e do typecheck.

## Falta (um PR por item, nesta ordem)
- [ ] **Tokens e componentes** (primeiro, o time depende disto): bloco de `globals.css` de `design/handoff/01-TOKENS.md`, fontes de `02-TIPOGRAFIA.md`, primitivos e componentes do produto de `03-COMPONENTES.md`, na ordem de `08-ORDEM-DE-IMPLEMENTACAO.md` §2 e §3. Avisar a Frigeri no grupo quando publicar.
- [ ] **Landing 1 · estrutura**: todas as seções de `05-LANDING.md` com texto, 3 breakpoints, nav, menu mobile, acordeão, rodapé. Publicável assim.
- [ ] **Landing 2 · movimento**: reveals, Siga o Fio, O limite, modo leve e reduced motion (`06-MOVIMENTO.md`).
- [ ] **Landing 3 · fio 3D**: canvas Three.js com SVG de reserva.
  Se faltar tempo, cortar na ordem inversa (3, depois 2) e seguir a lista "O que cortar primeiro" de `05-LANDING.md`.
- [ ] **Demo do júri**: `DEMO_EMAIL`, `DEMO_PASSWORD`, `DEMO_AI_DAILY_BUDGET_CENTS` na Vercel (só servidor) e `pnpm seed:demo` antes da avaliação (detalhes em `PROGRESS.md`).
- [ ] **Variáveis da Vercel**: `AI_DAILY_CALLS_GLOBAL`, `AI_DAILY_BUDGET_CENTS` maior que 0, `AI_DAILY_CALLS_USER`, `DEMO_AI_DAILY_CALLS`; `SUPABASE_SECRET_KEY` **só em Production**.
- [ ] **Origin em produção**: POST real para validar a regra de Origin (`docs/AMEACAS.md` #16).
- [ ] **Revisão e merge** de todos os PRs; plano B em 27/11 12h (ver `00-LEIA-PRIMEIRO.md`).

## Contratos
**Entrega:** `lib/contracts/*`, todas as actions (assinaturas em `00-LEIA-PRIMEIRO.md`), `exigirAcesso`, `exigirAcessoApi` e os componentes de `components/`.
**Consome:** `lib/engine` (Murilo) dentro de `obterDashboard`; o painel real da Frigeri no celular do hero da landing.

## Regras
- Camadas do ESLint (`eslint.layers.mjs`): `app/` e `components/` nunca importam `lib/db` nem `lib/ai`.
- `exigirAcesso()` em toda página protegida (`tests/portao.test.ts` vigia).
- Telas só chamam `actions/`. Dinheiro em centavos. A IA nunca calcula imposto.
- Nada inventado: o que for exemplo leva a etiqueta "exemplo"; texto legal só com fonte e data.
- Mudou contrato: PR próprio e aviso no grupo.

## Definição de pronto
`pnpm check` verde · `$env:NEXT_PUBLIC_USE_MOCKS='false'; pnpm build` verde · conferido em 390, 768 e 1280 px · conferido com reduced-motion ligado.

## Prompt de abertura
```
Você vai trabalhar no repositório Conta Comigo. Antes de qualquer código, leia AGENTS.md, CLAUDE.md,
docs/handoff/00-LEIA-PRIMEIRO.md e docs/handoff/ARTHUR.md. Trabalhe só nas pastas que o ARTHUR.md
permite. Siga o checklist "Falta" na ordem, um PR por item. Para design, leia design/handoff/README.md
e o arquivo indicado no item. Não invente função, caminho ou valor: confira no código. Antes de mudar
lib/contracts ou a assinatura de uma action, pare e me avise. Pronto = pnpm check e build com
NEXT_PUBLIC_USE_MOCKS=false verdes, telas conferidas em 390/768/1280 e com reduced-motion.
```

## Dúvidas
- Comentários `TODO(Frigeri)` em `app/page.tsx` e `TODO(Frigeri/Gui)` em `actions/painel.ts` citam donos antigos: corrigir no próximo PR de código dessas pastas.
- O design marca a faixa de atenção em 80%; o contrato `FaixaLimite` usa `ok/70/90/100` (ver Dúvidas do `MURILO.md`). Decidir antes do PR de componentes (`FioDoLimite`).
