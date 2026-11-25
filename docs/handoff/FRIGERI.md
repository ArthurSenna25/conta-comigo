# Frigeri · handoff

## Objetivo
Todas as telas autenticadas do app, as páginas legais (Termos e Privacidade) e a base de conhecimento `kb/`.

## Pastas
**Pode tocar:** `app/(app)/*`, `app/onboarding`, `app/legal`, `kb/` (exceto `kb/prompts`).
**Não pode (sem combinar com o dono):** `components/`, `actions/`, `lib/contracts`, `lib/db`, `app/(auth)`, `app/consentimento`, `app/(marketing)` (Arthur) · `lib/engine`, `supabase/seed` (Murilo) · `lib/ai`, `app/api`, `kb/prompts` (Gui).

## Já pronto
- Portão: toda página chama `exigirAcesso()` (`actions/sessao.ts`). `/onboarding` usa `exigirAcesso("consentimento")` e fica **fora** de `app/(app)` de propósito (o portão do app exige perfil e entraria em laço).
- Stubs: `app/onboarding/page.tsx` e `app/(app)/painel/page.tsx` (provam o portão; trocar pelo conteúdo real).
- Actions prontas para as telas: `salvarPerfil`, `confirmarLancamento`, `listar`, `editar`, `excluir`, `obterDashboard` (assinaturas em `00-LEIA-PRIMEIRO.md`).
- Mocks: `NEXT_PUBLIC_USE_MOCKS=true` no `.env.local` devolve `lib/contracts/mocks.ts`. Dá para fazer a tela antes do engine e da IA.
- Componentes já existentes do Arthur: `Campo`, `Aviso`, `BotaoEnviar` (`components/auth/campos.tsx`), `useFormularioAcao`, `FaixaDemo`, `BotaoSair`.

## Falta (um PR por item, nesta ordem)
- [ ] **Legal** (`app/legal/termos`, `app/legal/privacidade`): **bloqueador de release**, as caixas de aceite já apontam para lá e hoje dão 404 (`docs/AMEACAS.md` #20). Texto legal **só com fonte e data** vindas de `kb/`; o que faltar fica marcado "REVISAR COM HUMANO" (ver `docs/LGPD.md`).
- [ ] **Onboarding**: chama `salvarPerfil(objeto)` com o formato `PerfilInput` (`lib/contracts/perfil.ts`). Campo de data de abertura com `<input type="date" max={hoje}>` e, no erro, a mensagem do contrato: "A data de abertura não pode ser futura". Visual: `04-TELAS-APP.md` § /onboarding.
- [ ] **Painel** (`/painel`): `obterDashboard()`. Enquanto o engine não existir, `proximoDas.valorCentavos` vem `1` (marcador): **não exibir como valor real**.
- [ ] **Adicionar e conferir** (`/adicionar`, `/conferir`): `POST /api/ingest` devolve o rascunho; confirmar chama `confirmarLancamento(FormData)` com `lancamentos` (JSON) e `imagem` opcional. **Reencodar a imagem no cliente para menos de 4 MB** antes de enviar (teto de corpo da Vercel, ver `PROGRESS.md`; o reencode também tira o EXIF, que hoje só sai no cliente). No 429 `limite_ia`, cair para lançamento manual com mensagem clara (`AMEACAS.md` #21).
- [ ] **Lançamentos** (`/lancamentos`): `listar({ de, ate })`, `editar`, `excluir`.
- [ ] **Chat** (`/chat`): depende de `POST /api/chat` (Gui, ainda não existe). Só envia `role=user`.
- [ ] **Calendário** (`/calendario`): por último; vai para o Murilo se o engine fechar antes (plano B).
- [ ] **Estados de erro e vazio** em cada tela (`03-COMPONENTES.md` § EstadoErro, EstadoVazio).

## Design
- Telas: `design/handoff/04-TELAS-APP.md` (respeite as etiquetas [REAL], [EXEMPLO], [SÓ VISUAL]).
- Componentes: `design/handoff/03-COMPONENTES.md`. **Use os componentes compartilhados do Arthur** (`components/`); não crie cópia local. Se faltar um, peça no grupo.
- Tokens: `design/handoff/01-TOKENS.md` (o Arthur publica em `app/globals.css`; não redefina cores nem raios na tela).

## Contratos
**Consome:** actions de `actions/*.ts`, `POST /api/ingest`, `POST /api/chat`, schemas de `lib/contracts`.
**Entrega:** telas; conteúdo de `kb/` com fonte e data (o chat do Gui cita essa fonte).

## Regras
- Telas só chamam `actions/` (e `app/api` pelo `fetch`). Nunca importam `lib/db` nem `lib/ai` (o ESLint barra).
- `exigirAcesso()` em toda página protegida (`tests/portao.test.ts` vigia).
- Dinheiro em centavos inteiros; datas `"YYYY-MM-DD"`. Server Components por padrão; `"use client"` só com interação real.
- Rascunho da IA não é salvo; áudio nunca é gravado. Só dados sintéticos no repositório.
- Nada inventado: valor, lei ou prazo só com fonte e data de `kb/`; dado de exemplo leva a etiqueta "exemplo".

## Definição de pronto
`pnpm check` verde · `$env:NEXT_PUBLIC_USE_MOCKS='false'; pnpm build` verde · screenshot em 390 px conferido · estados de carregando, erro e vazio feitos.

## Prompt de abertura
```
Você vai trabalhar no repositório Conta Comigo. Antes de qualquer código, leia AGENTS.md, CLAUDE.md,
docs/handoff/00-LEIA-PRIMEIRO.md e docs/handoff/FRIGERI.md. Trabalhe só nas pastas que o FRIGERI.md
permite. Siga o checklist "Falta" na ordem, um PR por item. Para o visual, leia
design/handoff/04-TELAS-APP.md, 03-COMPONENTES.md e 01-TOKENS.md e use os componentes de components/
sem copiar. Telas só chamam actions/. Não invente função, caminho, valor legal ou texto de lei: confira
no código e em kb/ (fonte e data); se faltar, marque PENDENTE e me avise. Antes de mudar lib/contracts
ou a assinatura de uma action, pare e me avise. Pronto = pnpm check e build com
NEXT_PUBLIC_USE_MOCKS=false verdes e tela conferida em 390 px.
```

## Decisões (24/11)
- **Ordem:** o consentimento vem **antes** do onboarding (o código vence o design). O stepper do onboarding não conta o consentimento.
- **Sem CNAE:** o onboarding usa os campos do contrato `PerfilInput`: `nomeNegocio`, `atividade` (`comercio | servicos | ambos`, com rótulos simples para o MEI), `uf`, `municipio`, `dataAbertura` e `receitaInicialCentavos`. O `ehMei` não é digitado: o produto é só para MEI, então a tela envia `true` (confirmar com o Arthur se o contrato mudar).
- **Imagem:** o cliente reencoda para **menos de 4 MB** antes de enviar e a tela trata o 413 com mensagem clara. O Arthur alinha o texto da action depois.
- **Limite:** o `FioDoLimite` e as telas recebem o nível (faixa) por props e **não recalculam** percentual nem limiar; quem decide é o `lib/engine`.
