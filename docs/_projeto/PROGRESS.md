# PROGRESS — Conta Comigo

**Nível:** N2 (segurança e LGPD reforçadas) · **Fase atual:** auth, consentimento e demo (Arthur) · **Atualizado:** 24/11/2026

## Feito
- Gui: provider Gemini multimodal e rota de rascunho com Zod, modo mock e portão de sessão, consentimento e origem. Suíte real executável em `tests/avaliacao-ia`.
- Setup: scaffold Next 16 + Tailwind v4 + shadcn, husky/gitleaks, CI, `main` protegida, regras de camadas no ESLint.
- P3: `lib/contracts` (Zod, mocks, `AiProvider`), stubs de `lib/engine`, `docs/ARQUITETURA.md`, `DADOS.md`, `AMEACAS.md`, `LGPD.md`, ADR-001..004.
- P4 (PR #7, mergeado): 5 migrations no Supabase, RLS + GRANT explícito, bucket privado, `pnpm test:rls`, advisors sem issues.
- Auth (`feat/auth`): `proxy.ts` (getClaims, negar por padrão), `lib/db` (client SSR, cookie HttpOnly/Secure), `lib/security` (open redirect, mock, portão), `actions/auth.ts`, telas `/entrar` `/cadastrar` `/consentimento`, stubs `/onboarding` e `/painel`.
- Auth: contrato novo `lib/contracts/auth.ts` (commit separado). `cacheComponents`/PPR desligados (nada usava). 184 testes em `pnpm check`; `test:rls` 34 casos; reviews de código e segurança em 3 blocos. Achados corrigidos: open redirect por dot-segments, cookie sem HttpOnly/Secure, senha na URL em envio antes da hidratação, falha de rede mostrada como senha errada.
- Murilo (24/11) implementou `statusLimiteMei` e `projecaoAnual`, com limite proporcional do MEI e projeção em centavos com precisão monetária via `BigInt`. 30 novos testes unitários. `pnpm check` aprovado com 366 testes e build padrão de produção aprovado manualmente com `NEXT_PUBLIC_USE_MOCKS=false pnpm build`. Pendente de alinhamento com Arthur: o cadastro aceita data de abertura futura, que o motor rejeita.
## Próximo
- **Demo do júri (feat/demo-acesso, depende do PR #8):** botão "Ver demonstração" (landing e /entrar), faixa de aviso, `pnpm seed:demo`. **Antes da avaliação:** pôr `DEMO_EMAIL`, `DEMO_PASSWORD` (e-mail de domínio real, senha longa e aleatória) e `DEMO_AI_DAILY_BUDGET_CENTS` (padrão 100) no `.env.local` **e na Vercel** (só servidor), rodar `pnpm seed:demo` (recria o usuário, perfil, lançamentos fictícios e 3 aceites) e conferir pelo botão (escolha um e-mail não adivinhável e rode o seed logo: com "Confirm email" desligado, quem cadastrar esse e-mail antes faz o seed abortar). **Resetar:** repetir `pnpm seed:demo` depois de cada rodada de teste, depois de mudar `VERSAO_CONSENTIMENTO` (senão a demo cai em /consentimento) e se a senha da demo for trocada. **Não resetar durante a janela de avaliação:** o reset muda o id do usuário e quem estiver com sessão aberta cai em /consentimento. Gui: aplicar `tetoDiarioIaCentavos()` antes da IA e degradar para lançamento manual ao estourar (AMEACAS #21).
- Cadastro ponta a ponta **verificado em 24/11** com "Confirm email" desligado (Playwright 390 px): cadastro → `/onboarding`, 2 linhas em `consentimentos` (sem `envio_ia`) e 3 (com), e-mail existente → mensagem genérica. Se religar a confirmação, o aceite do cadastro não é gravado (sem sessão) e o usuário reaceita em `/consentimento` ao entrar.
- Frigeri: conteúdo de `/onboarding` (stub fora de `app/(app)`, chama `exigirAcesso("consentimento")`) e **`app/legal/{termos,privacidade}`: BLOQUEADOR DE RELEASE**, pois as caixas de aceite já apontam para lá e hoje dão 404 (AMEACAS #20).
- Gui: `exigirAcessoApi(req, { ia: true })` (`actions/portao-api.ts`, uso em `docs/ARQUITETURA.md`) está pronto; `/api/ingest` tem portão próprio (exceção em `tests/portao.test.ts`): extrair a parte comum em commit separado.
- Dados (`feat/dados-actions`, PR aberto): `lib/db` (perfil, lancamento, documento) e `actions/` (`salvarPerfil`, `confirmarLancamento`, `listar`, `editar`, `excluir`, `obterDashboard`) prontos, RLS real testada (`test:rls` 51). **Pendente:** migration que restringe o nome no insert do Storage (órfãos/cota), `gen types`, EXPLAIN, limpeza de documentos sem lançamento, EXIF (reencode só no cliente), duplo envio de `confirmarLancamento`. Frigeri: onboarding chama `salvarPerfil(objeto)`; confirmação envia `FormData` com `lancamentos` (JSON) e `imagem`, reencodada para < 4 MB (teto da Vercel). Murilo: ao implementar o engine, `obterDashboard` deixa de devolver o painel vazio (`proximoDas.valorCentavos: 1` é marcador).
## Decisões e premissas
- 23/11 Repo público; rascunho só na tela; sem audit_log (ADR-004); exclusão de conta: Storage → `auth.admin.deleteUser` → cascade.
- 24/11 P4 segue `DADOS.md`/ADR-004; GRANT só para `authenticated`; `service_role` sem GRANT de tabela.
- 24/11 Toda página protegida chama `exigirAcesso()` (layout não re-renderiza a cada navegação); `tests/portao.test.ts` vigia.
- 24/11 Modo mock só com `NODE_ENV` development/test; fora disso a flag **lança**. `pnpm build` local com a flag em `.env.local` falha de propósito: rode `NEXT_PUBLIC_USE_MOCKS=false pnpm build`.
- 24/11 `USE_MOCKS` removido de `lib/contracts/mocks.ts` (`modoMock()` é a única porta); `lib/security` tem bloco de camadas (só `lib/contracts`); `shadcn` em devDependencies.
- 24/11 Sem client de navegador (login por server action); `lib/supabase/` é pasta reservada sem código.
## Pendências / bloqueios
- Ingestão real via HTTP: Arthur precisa ligar a reserva de chamadas de IA antes do Gemini. Confirmação e meta ponta a ponta dependem da integração da interface.
- Gemini Free teve 503 e timeouts na avaliação sintética. Segundo lote completo: 13/25 respostas válidas, 69/182 campos corretos. Critérios de precisão e disponibilidade continuam pendentes.
- Riscos abertos em `AMEACAS.md` #14–#19: enumeração de e-mail (aceito, Confirm email desligado), força bruta/limite por IP, portão em route handlers, token vale até expirar, reaceite de consentimento revogado.
- `pnpm audit`: 1 moderada em `minimatch` via `shadcn › ts-morph` (CLI de dev, pré-existente). `shadcn` já está em devDependencies: `pnpm audit --prod` limpo.
- CODEOWNERS só com Arthur; favicon 404 em dev; LGPD.md com itens "REVISAR COM HUMANO".
## Backlog
- simularEmprestimo (S1) · audit_log de lançamentos · estados de rascunho persistidos · tabela de mensagens do chat · CSP · PWA (matcher do proxy e `/sw.js`).
