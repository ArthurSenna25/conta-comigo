# 00 · Leia primeiro (handoff do time)

Pasta do **time**. O pacote visual do Claude Design fica em `design/handoff/` e só é citado por caminho aqui.
Depois deste arquivo, leia o seu: [ARTHUR.md](ARTHUR.md) · [FRIGERI.md](FRIGERI.md) · [MURILO.md](MURILO.md).

## O projeto em 5 linhas
1. Conta Comigo: app web mobile-first (PWA) para MEI organizar receitas e despesas.
2. O MEI manda foto, áudio, print ou texto; a IA monta um **rascunho**; o MEI confere e confirma.
3. O painel mostra o limite anual do MEI, o próximo DAS e alertas; o chat responde citando a fonte.
4. **A IA nunca calcula imposto.** Quem calcula é `lib/engine` (puro e testado).
5. Hack Brasil 2026: **congelamento 29/11 às 18h**, entrega 30/11 até 18h. Repositório **público**.

## Decisão do time (24/11/2026, aprovada pelo grupo)
| Pessoa | Responsável por |
|---|---|
| **Arthur** | toda a landing (`app/(marketing)`, `app/page.tsx`), fundação de design (tokens e `components/`), demo do júri, infra, revisão e merge de **todos** os PRs |
| **Frigeri** | todas as telas autenticadas (onboarding, painel, adicionar e conferir, lançamentos, calendário, chat, estados de erro e vazio), `app/legal` (Termos e Privacidade) e `kb/` |
| **Murilo** | `lib/engine`, `supabase/seed`, testes do engine e QA em celular real |
| **Gui** | `lib/ai`, `app/api/ingest`, `app/api/chat`, `kb/prompts`, avaliação da IA |

**Por quê:** cada pessoa fica com um bloco que não depende do outro para começar (as telas usam mocks; o engine é puro), e um só revisor mantém a `main` verde. Lançamentos e calendário saíram do Murilo para ele fechar o engine, que trava o painel.

## Mapa de pastas
| Pasta | Dono |
|---|---|
| `app/(marketing)`, `app/page.tsx`, `app/(auth)`, `app/consentimento` | Arthur |
| `components/`, `actions/`, `lib/contracts`, `lib/db`, `lib/security`, `supabase/migrations`, `.github` | Arthur |
| `app/(app)/*`, `app/onboarding`, `app/legal`, `kb/` | Frigeri |
| `lib/engine`, `supabase/seed` | Murilo |
| `lib/ai`, `app/api`, `kb/prompts`, `tests/avaliacao-ia` | Gui |

## Contratos entre as peças (conferidos no código em 24/11)
Todas as actions devolvem `Resultado<T>` (`lib/contracts/comum.ts`):
`{ ok: true, dados }` ou `{ ok: false, erro: { codigo, mensagem, campos? } }`. `mensagem` pode ir para a tela.

| Onde | Assinatura | Estado |
|---|---|---|
| `actions/sessao.ts` | `exigirAcesso(etapa?: "sessao" \| "consentimento" \| "completo")` → `{ userId, consentimentoVigente, demo }` | pronto |
| `actions/perfil.ts` | `salvarPerfil(entrada: unknown)` → `Resultado<Perfil>` (objeto no formato `PerfilInput`) | pronto |
| `actions/lancamentos.ts` | `confirmarLancamento(form: FormData)` → `Resultado<ConfirmarResponse>` (campos `lancamentos` em JSON e `imagem` opcional) | pronto |
| `actions/lancamentos.ts` | `listar({ de, ate })` → `Resultado<Lancamento[]>` (`de <= data < ate`, até 2 anos) | pronto |
| `actions/lancamentos.ts` | `editar({ id, lancamento })` → `Resultado<Lancamento>` · `excluir(id)` → `Resultado<null>` | pronto |
| `actions/dashboard.ts` | `obterDashboard(mes?: "YYYY-MM")` → `Resultado<DashboardResponse>` | pronto; números dependem do engine |
| `actions/auth.ts` | `entrar`, `cadastrar`, `entrarComoDemo`, `registrarConsentimento`, `sair` | pronto |
| `POST /api/ingest` | `FormData` (`kind` = `texto` \| `imagem` \| `audio`) → `IngestResponse` ou `ErroResposta` | pronto (Gui) |
| `POST /api/chat` | `ChatRequest` → `ChatResponse` (`lib/contracts/chat.ts`) | **não existe ainda** (Gui) |
| `lib/engine` | `statusLimiteMei`, `projecaoAnual` | prontos (PR #12) |
| `lib/engine` | `valorDas`, `proximoVencimentoDas`, `resumoMes`, `gerarAlertas` | **stubs** (Murilo) |

Schemas: `lib/contracts/` (`perfil.ts`, `lancamento.ts`, `ingest.ts`, `dashboard.ts`, `chat.ts`). Dinheiro sempre em **centavos inteiros**; datas `"YYYY-MM-DD"`.
Mocks: com `NEXT_PUBLIC_USE_MOCKS=true` no `.env.local` (só em dev), as actions devolvem os dados de `lib/contracts/mocks.ts`. Dá para fazer a tela antes do back.

## Cronograma
| Dia | Arthur | Frigeri | Murilo | Gui |
|---|---|---|---|---|
| 24–25/11 | tokens e componentes | páginas legais | engine | IA |
| 25–28/11 | landing | telas: legal › onboarding › painel › adicionar/conferir › lançamentos › chat › calendário | engine pronto **até 26/11**; depois seed e QA | ingest e chat |
| 29/11 | integração até o **congelamento às 18h** | | | |
| 30/11 | entrega até 18h | | | |

## Fluxo de Git
- Branch a partir da `main` atualizada: `feat/<pessoa>-<tema>` (ex.: `feat/frigeri-onboarding`).
- **Um PR por tela** (ou por item do seu checklist). Só o **Arthur** faz merge.
- Antes de abrir: `pnpm check`. Nunca `--no-verify` (os hooks rodam gitleaks, lint e typecheck).
- **Nenhum segredo** no repositório nem no chat (nem colado na IA). Variáveis só no `.env.local`.
- Repositório público: **só dados sintéticos**. Nada de CNPJ, e-mail, telefone ou nome real.

## Como as IAs de cada um ficam em sincronia
- Fonte única: `docs/_projeto/PROGRESS.md` (estado), `lib/contracts/` (formatos) e as assinaturas em `actions/*.ts`.
- Comece toda sessão pedindo à sua IA para ler `AGENTS.md`, `CLAUDE.md`, este arquivo e o seu handoff.
- **Antes de mudar um contrato** (`lib/contracts` ou assinatura de action): avise o Arthur e o grupo. Mudança de contrato é PR próprio.
- Se a sua IA "precisar" de uma função que não existe, ela não inventa: pergunte no grupo.

## Plano B
- Se uma tela não tiver PR aberto até **27/11 às 12h**, o Arthur reatribui.
- Calendário e lançamentos vão primeiro para o **Murilo**, depois que o engine estiver pronto.
- Landing: cortar na ordem de `design/handoff/05-LANDING.md` ("O que cortar primeiro").

## Decisões (24/11)
1. Consentimento vem antes do onboarding (código vence o design).
2. Sem CNAE: o onboarding usa os campos do contrato (`nomeNegocio`, `atividade` com rótulos simples, `uf`, `municipio`, `dataAbertura`, `receitaInicialCentavos`).
3. Imagem: o cliente reencoda para menos de 4 MB e a tela trata 413; o Arthur alinha o texto da action depois.
4. `LIMITE_MENSAL_CENTAVOS`: o Murilo comenta a fonte (LC 123/2006 art. 18-A §2º, R$ 6.750/mês, fração conta como mês inteiro, conferido em 24/11/2026).
5. Um só conjunto de limiares, definido no `lib/engine` (sugestão: 80% atenção, 100% estourou), a cargo do Murilo; telas e `FioDoLimite` recebem o nível por props e não recalculam. Mudar o enum `FaixaLimite` é PR de contrato próprio.

## Dúvidas
- `kb/prompts`: hoje os prompts estão em `prompts/` na raiz (`prompts/chat.ts`, `prompts/extracao.ts`). Gui decide se move.
- `design/handoff/svg/` é citado no pacote do design, mas a pasta não está no repositório.
