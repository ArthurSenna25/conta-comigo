# Murilo · handoff

## Objetivo
Fechar `lib/engine` (o painel depende dele), o seed e os testes do engine, e fazer o QA em celular real.

## Pastas
**Pode tocar:** `lib/engine`, `supabase/seed`.
**Não pode (sem combinar com o dono):** `actions/`, `lib/contracts`, `components/`, `lib/db` (Arthur) · `app/(app)/*`, `app/onboarding`, `app/legal`, `kb/` (Frigeri) · `lib/ai`, `app/api` (Gui).

## Já pronto
- `statusLimiteMei` e `projecaoAnual` com testes (PR #12). Os dois lançam `RangeError` se `dataAbertura` for posterior a `hoje`.
- O perfil já recusa data de abertura futura (PR #15, `lib/contracts/perfil.ts`).
- `actions/dashboard.ts` (`obterDashboard`) já chama todas as funções do engine. Enquanto houver stub (`throw new Error("not implemented")`), devolve um painel vazio.

## Falta (um PR por item, nesta ordem; engine pronto **até 26/11**)
- [ ] **`valorDas(atividade, ano)`** em centavos. O comentário atual diz "5% do salário mínimo + R$ 1 (ICMS) e/ou R$ 5 (ISS)". O salário mínimo e esses valores **não estão no repositório**: cada constante leva comentário com **fonte oficial e data** de consulta; se não achar a fonte, deixe `PENDENTE` e avise no grupo, sem chutar.
- [ ] **`proximoVencimentoDas(hoje)`**: próximo dia 20 a partir de `hoje` (inclusive).
- [ ] **`resumoMes(lancamentos, mes)`**: só lançamentos do mês; formato `ResumoMes` (`lib/contracts/dashboard.ts`).
- [ ] **`gerarAlertas(estado)`**: DAS (7 e 2 dias antes), limite 70/90/100, despesa atípica, mistura PF/PJ, nota faltando. `chave` determinística (ex.: `"das_vencendo:2026-12"`).
- [ ] **Remover o marcador** `proximoDas.valorCentavos: 1` de `dashboardVazio` em `actions/dashboard.ts` quando o DAS existir (é pasta do Arthur: PR pequeno com ele revisando).
- [ ] **Seed** em `supabase/seed`: só dados sintéticos.
- [ ] **QA em celular real** das telas da Frigeri (390 px), e o calendário e os lançamentos se o plano B mandar.

## Valores legais
- Todo número legal (limite, DAS, salário mínimo, datas) tem **fonte oficial e data** no comentário, e foi conferido na fonte oficial (Receita Federal, Portal do Empreendedor, Planalto). Sem fonte: `PENDENTE`.
- `LIMITE_MENSAL_CENTAVOS = 675_000` em `status-limite-mei.ts` (R$ 81 mil por ano) está **sem fonte no comentário**: acrescentar.
- **LC 238/2026:** há notícia de mudança nas regras do MEI com efeitos **a partir de 2028**. Não muda o cálculo de 2026–2027; **a confirmar no texto oficial** antes de citar em qualquer tela ou comentário.

## Contratos
**Entrega:** as funções de `lib/engine/index.ts` com as assinaturas atuais (consumidas por `obterDashboard`).
**Consome:** tipos de `lib/contracts` (`Lancamento`, `Perfil`, `ResumoMes`, `Alerta`, `StatusLimiteMei`).

## Regras
- Engine **puro**: sem next, react, supabase, SDK de IA nem fs (`eslint.layers.mjs` e `tests/camadas.test.ts`).
- Determinístico: `hoje` sempre entra por parâmetro, nunca `new Date()` dentro do engine. Data posterior a `hoje` lança `RangeError`, como nas funções prontas.
- Dinheiro em centavos inteiros; datas `"YYYY-MM-DD"`. A IA nunca calcula imposto: só o engine.
- TDD: teste primeiro, com casos de borda (dia 20, virada de ano, ano de abertura, 70/90/100 exatos).
- Mudar assinatura ou tipo: PR próprio e aviso ao Arthur.

## Definição de pronto
`pnpm check` verde · cada função com teste · nenhum stub `not implemented` restante · painel real (sem mocks) mostra o DAS sem o marcador.

## Prompt de abertura
```
Você vai trabalhar no repositório Conta Comigo. Antes de qualquer código, leia AGENTS.md, CLAUDE.md,
docs/handoff/00-LEIA-PRIMEIRO.md e docs/handoff/MURILO.md. Trabalhe só em lib/engine e supabase/seed.
Siga o checklist "Falta" na ordem, um PR por item, com teste antes do código. O engine é puro e
determinístico: hoje entra por parâmetro, data futura lança RangeError. Não invente valor legal: toda
constante leva fonte oficial e data no comentário; sem fonte, escreva PENDENTE e me avise. Não mude
assinaturas de lib/engine/index.ts nem lib/contracts sem me avisar. Pronto = pnpm check verde e
nenhum "not implemented" restante.
```

## Dúvidas
- Faixas do limite: o contrato `FaixaLimite` e o engine usam `ok/70/90/100`; o design (`03-COMPONENTES.md`, FioDoLimite) marca atenção em **80%**. Decidir com o Arthur antes do PR de componentes.
- `obterDashboard` já soma as receitas confirmadas do ano com `receitaInicialCentavos` antes de chamar o engine: não some de novo dentro do engine.
