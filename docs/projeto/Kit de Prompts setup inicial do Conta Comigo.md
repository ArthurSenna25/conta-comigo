# Kit de Prompts: setup inicial do Conta Comigo

**Para colar no Claude Code · 23/11/2026 · baseado no seu docs-kit v4 + pesquisa de hoje**

São **6 prompts**, na ordem, **uma sessão por prompt** (`/clear` entre eles). Antes de cada um está o **modelo e o esforço**. Tudo que o Claude Code fizer nesta fase de config termina em **commit + push** (nesta fase, direto na `main`; depois do P2, só por Pull Request). Tempo total estimado: \~3h.

---

## 0. Faça à mão antes do P1 (10 min)

- [ ] **Usernames do GitHub** dos 4: você (parece ser `ArthurSenna25`, confirme), Gui, Murilo (parece ser `murilocunha3103`, confirme) e Frigeri. Os 3 precisam ter conta e **aceitar o convite**.
- [ ] **Projeto Supabase** (supabase.com): nome `conta-comigo`, região **South America (São Paulo)**, senha do banco no seu gerenciador de senhas. Anote o **Project ref** (o trecho da URL do painel). **Nunca cole chaves no chat.**
- [ ] **Caminho do docs-kit** no seu PC (ex.: `C:/dev/docs-kit`).
- [ ] `claude update` e `/status` (logado na conta Pro).
- [ ] Repositório **privado** primeiro. Se o regulamento do Hack Brasil exigir código público, abram só no fim, depois do gitleaks limpo.

---

## 1. Decisões que a pesquisa fechou (o Claude Code vai seguir)

| Tema | Decisão | Por quê |
| --- | --- | --- |
| **Nível (kit 00)** | N2 com segurança e LGPD reforçadas (ASVS L1 geral, L2 em login, dado financeiro e upload) | Tem banco, login, dado financeiro e IA, mas só 8 dias. Sem Docker, monorepo, microsserviços, filas, Drizzle |
| **Framework** | Next.js 16 (App Router, `proxy.ts`), TypeScript strict, Tailwind v4, shadcn só do que usar, Zod, Vitest, Playwright, pnpm | Seu padrão do kit |
| **Back-end** | **Supabase** (Postgres + Auth + Storage), região SP | **Desvio consciente do kit §05** (Neon + Drizzle + Better Auth): uma plataforma entrega login, banco, arquivos e RLS; 4 pessoas, 8 dias, 2 iniciantes. Gatilho para revisar: precisar sair do Supabase |
| **Auth** | `@supabase/ssr`; no servidor **sempre `getClaims()`**, nunca `getSession()` | `getClaims()` verifica a assinatura do token; `getSession()` não revalida |
| **Arquitetura** | Monólito modular em camadas: `app → actions → lib/{db, ai, engine}`, base em `lib/contracts` | Alta coesão e baixo acoplamento, medidos por regra de import no ESLint |
| **Banco** | 3FN, dinheiro em `bigint` centavos, `timestamptz`, constraints, **RLS em tudo**, 3 triggers, auditoria | Seu doc 07 + checklist Supabase |
| **Criptografia** | TLS + criptografia em repouso da plataforma (confirmar na doc do Supabase) + RLS + minimização. **Sem cripto caseira** | Menor risco e menor custo; ADR registra o gatilho para rever |
| **IA** | Camada fina `AiProvider`, saída validada com Zod, ferramentas só leitura + `propor_lancamento`, teto diário de custo | OWASP LLM Top 10: prompt injection, excesso de agência, consumo ilimitado |
| **Rate limit** | Contador no Postgres (`ai_usage`) + limites do Supabase Auth. Upstash fica de gatilho | Menos um serviço para criar conta |
| **Qualidade** | CI (lint, tsc, test, build), gitleaks, `pnpm audit`, Dependabot, PR com review | Seu doc 09 |
| **LGPD** | Inventário de dados, consentimento versionado, exportar e excluir conta, transferência internacional (IA fora do Brasil) registrada | Resolução CD/ANPD 19/2024 |

---

## 2. Skills, MCPs e plugins (só o que falta)

**Você já tem (não reinstalar):** superpowers, ponytail, impeccable, frontend-design, skill-creator, context-engineering, ecc, context7 (autenticar em `/mcp` se pedir), RTK, graphify, gh, pnpm, rg, fd, jq.

| Item | Onde | Comando | Para quê |
| --- | --- | --- | --- |
| **Playwright** | P1 | `claude mcp add playwright -- npx @playwright/mcp@latest` (ou o plugin `playwright@claude-plugins-official` do seu setup) | Conferir UI e fluxos (estava pendente no seu setup) |
| **Supabase Agent Skills** (oficial) | P1 | `claude plugin marketplace add supabase/agent-skills` + `claude plugin install postgres-best-practices@supabase-agent-skills` | 30 regras de Postgres/RLS/índices para a IA seguir |
| **gitleaks** | P1 | `winget search gitleaks` → confirmar ID oficial → instalar | Segredo no commit |
| **Supabase MCP** (read-only, escopo de projeto) | P4 | `claude mcp add --scope project --transport http supabase 'https://mcp.supabase.com/mcp?read_only=true&project_ref=<REF>'` e depois `/mcp` → supabase → Authenticate | Ver tabelas, logs e **advisors de segurança** |
| **Supabase CLI** | P2 | `pnpm add -D supabase` (devDependency, não global) | Migrations e tipos, **sem Docker** |

**De propósito NÃO instalar:** GitHub MCP (usamos o `gh`, gasta menos contexto), Docker, Sentry, mais MCPs. Regra prática: poucos MCPs bem escolhidos rendem mais que 10.

**Segurança da cadeia (A03):** skill e MCP de terceiros são código com permissão. Só instalamos de fonte oficial (`supabase/agent-skills`, Microsoft/Playwright), lendo o README antes. O Supabase MCP vai **read-only** e preso ao projeto (`project_ref`), por causa de prompt injection via dados.

---

## 3. Modelo e nível de esforço por prompt

Troque com `/model` **no começo da sessão** (muda a partir da próxima resposta). Não grave `model` nem `effortLevel` em `settings.json`.

| Prompt | Modelo | Esforço | Por quê |
| --- | --- | --- | --- |
| **P1** Ambiente e ferramentas | Sonnet (padrão) | **medium** | Mecânico, mas com plano e validação |
| **P2** Repo, scaffold, CI, convites | Sonnet | **medium** | Muitos passos bem descritos |
| **P3** Arquitetura, dados, contratos, ameaças | **Opus** (o mais novo que o `/model` mostrar; plano em **plan mode**) | **high** | Decisões caras de reverter. É o único prompt que justifica gastar limite com Opus |
| **P4** Banco, RLS, triggers, testes | Sonnet | **high** | SQL de segurança: queremos que leia, rode teste e verifique |
| **P5** Segurança, auth, LGPD, guardrails de IA | Sonnet | **high** | Idem. Se travar 2× no mesmo erro, suba para Opus |
| **P6** Issues, README, handoff | Sonnet | **low** | Texto e organização |

**Regra de ajuste:** se o Claude pulou arquivo, não rodou teste ou largou refatoração no meio, **suba o esforço**. Se ele teve todo o contexto, tentou direito e ainda errou, **suba o modelo**. Antes de mexer nisso, revise o prompt, os MCPs e o `CLAUDE.md`. O Fable não entra no uso incluído do Pro, então fora desta fase.

---

## 4. Os prompts

### P1 · Ambiente e ferramentas

**Modelo: Sonnet · Esforço: medium · Plan-first (ele só executa depois do seu 'ok')**

```
FASE: P1 Ambiente e ferramentas. Plan-first: NÃO execute nada antes do meu 'ok'.

CONTEXTO: projeto novo 'conta-comigo' (app web de assistente contábil e financeiro com IA para MEIs; hackathon, prazo 30/11). Windows + PowerShell 5.1 (sem &&; use ; ou comandos separados). Meu setup global já tem: superpowers, ponytail, impeccable, frontend-design, skill-creator, context-engineering, ecc, context7, RTK, graphify, gh, pnpm, rg, fd, jq, Node 24, uv. NÃO reinstale nada disso.

REGRAS: nunca ler nem imprimir .env*, chaves ou ~/.claude.json inteiro; editar config só pelo CLI (claude mcp / claude plugin); um componente por vez, validando antes do próximo; nunca executar instalador remoto sem ler; não mudar model, effortLevel, hooks, auto mode nem provedor; nada que gere cobrança.

1) DIAGNÓSTICO (só leitura): claude --version; claude mcp list; claude plugin list; gh --version; gh auth status; node -v; pnpm -v; git --version; git config --get user.name e user.email; gitleaks version (se existir).

2) PLANO item por item (instalar / pular / por quê / como desfazer):
 a) Playwright: claude mcp add playwright -- npx @playwright/mcp@latest (ou o plugin playwright@claude-plugins-official, se meu setup já o registrou como pendente; escolha UM) + instalar o navegador webkit.
 b) Skills oficiais Supabase: antes de instalar, leia o README de github.com/supabase/agent-skills e liste o que o instalador executa. Instale via claude plugin marketplace add supabase/agent-skills e claude plugin install postgres-best-practices@supabase-agent-skills (e o plugin da skill 'supabase', se existir). Não use npx skills add.
 c) gitleaks: winget search gitleaks, confirmar o ID oficial, instalar, validar com gitleaks version.
 d) Confirmar que Docker NÃO é necessário (usaremos projeto Supabase remoto e o Supabase CLI como devDependency do projeto, não global).
3) Riscos de Windows/PowerShell e confirmação de que nada muda model/effort/hooks/provedor.
Termine com a ordem das ações e ESPERE meu 'ok'.

DEPOIS DO OK: execute a, b, c nessa ordem, validando cada um. Entregue uma tabela Nome | Status | Escopo | Validação | Como desfazer. Sem commit (ainda não há repositório). Lembre-me de autenticar o context7 em /mcp se ele pedir.
```

---

### P2 · Repositório, scaffold, CI e convites

**Modelo: Sonnet · Esforço: medium · Nova sessão (`/clear`)**

```
FASE: P2 Repositório, scaffold, CI e convites.
OBJETIVO: repositório PRIVADO no GitHub com Next.js rodando, docs do kit, guarda-corpos de segurança, CI e os 3 colaboradores convidados. Tudo commitado com push em main (único momento em que push direto na main é permitido; depois só PR).

VARIÁVEIS (se algo estiver <entre sinais>, PERGUNTE antes de seguir):
- OWNER = ArthurSenna25 (confirme com: gh api user --jq .login)
- REPO = conta-comigo
- COLABORADORES = <GUI_USER>, murilocunha3103 (confirme), <FRIGERI_USER>
- KIT = <CAMINHO_DO_DOCS_KIT>
- Pasta do projeto: C:/dev/conta-comigo (se C:/dev não existir, pergunte)

REGRAS: Windows/PowerShell 5.1 (sem &&). Nunca ler/imprimir .env*. Dependência uma por vez, confirmando que o pacote existe e é o oficial. Verificar antes de dizer 'pronto' (tsc, lint, build, test). Mesmo erro 3×: pare e diagnostique. Commits atômicos em Conventional Commits (feat:, fix:, chore:, docs:, test:). Fora de escopo: banco, auth, telas, IA, deploy.

PASSOS (um por vez, validando):
1. gh auth status; confirme OWNER; confirme que o repo ainda não existe.
2. git init -b main. Crie .gitignore ANTES de qualquer outro arquivo: node_modules, .next, out, .env*, !.env.example, .vercel, coverage, *.log, playwright-report, test-results, .supabase, supabase/.temp, Thumbs.db, .DS_Store. Crie .gitattributes com * text=auto eol=lf.
3. Scaffold: Next.js estável atual 16.x (confirme a versão e o comando no Context7), App Router, TypeScript strict, Tailwind v4, ESLint, alias @/*, SEM pasta src/ (app/ na raiz, como no kit §05), pnpm, sem código de exemplo. Rode shadcn init (nenhum componente ainda). Depois, uma por vez: zod, vitest, husky, lint-staged, supabase (devDependency).
4. Estrutura (pastas com .gitkeep e um README de 3 linhas: dono e regra): app/(marketing), app/(app), app/api, actions, lib/contracts, lib/engine, lib/ai, lib/db, lib/security, components, kb, supabase/migrations, supabase/seed. Copie KIT/docs para docs/ e KIT/docs/templates/CLAUDE.md.template para ./CLAUDE.md; crie docs/_projeto/PRODUCT.md e PROGRESS.md a partir dos templates.
5. Preencha o CLAUDE.md: contexto (Hack Brasil 2026, prazo 30/11 23h59, freeze 29/11 18h, nível N2 + segurança/LGPD reforçadas), comandos pnpm, e a seção 'Regras comuns' abaixo, e a regra: A IA nunca calcula imposto; quem calcula é lib/engine (funções puras testadas).
 REGRAS COMUNS (gravar no CLAUDE.md): Windows/PowerShell sem &&; nunca ler/imprimir .env*; dependência uma por vez e oficial; verificar com pnpm check antes de dizer pronto; commits convencionais pequenos; atualizar docs/_projeto/PROGRESS.md (≤15 linhas) ao fim de cada fase; mesmo erro 3×: parar; fora de escopo vai para o Backlog; nada de any/@ts-ignore; toda entrada validada com Zod no servidor; autorizar em toda action e rota (proxy não é a única camada).
6. Scripts pnpm: dev, build, lint, typecheck (tsc --noEmit), test (vitest run), check (lint + typecheck + test). Husky: pre-commit = lint-staged + gitleaks protect --staged (se instalado) + bloquear arquivos .env*; pre-push = pnpm typecheck.
7. Segurança base: headers no next.config (X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors/X-Frame-Options, HSTS só em produção; CSP fica para o P5). Crie .env.example só com NOMES: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY (só servidor), AI_PROVIDER, AI_API_KEY, AI_DAILY_BUDGET_CENTS, NEXT_PUBLIC_USE_MOCKS. Crie .env.local vazio e NÃO o leia depois.
8. CI em .github/workflows/ci.yml (pull_request e push na main): pnpm install --frozen-lockfile, lint, typecheck, test, build; job separado com gitleaks; pnpm audit --prod só como relatório. permissions: contents: read. Actions fixadas por versão major. Se o gitleaks-action pedir licença, use o gitleaks CLI no job. Crie .github/dependabot.yml (semanal, npm e github-actions).
9. Governança: .github/CODEOWNERS por pasta (Arthur: app/(app)/dashboard, components, supabase/migrations, .github, actions; Gui: lib/ai, app/api/ingest, app/api/chat, kb/prompts; Murilo: lib/engine, app/(app)/lancamentos, app/(app)/calendario, supabase/seed; Frigeri: app/(marketing), app/(app)/onboarding, app/legal, kb, docs) com os usernames; PULL_REQUEST_TEMPLATE.md (checklist: pnpm check ok, sem segredo, mexeu em RLS/migration?, screenshot mobile); CONTRIBUTING.md curto em PT-BR (branch feat/<pessoa>-<tema>, commits convencionais, PR pequeno, review em até 12h, main sempre verde, nunca force-push).
10. Verifique: pnpm check e pnpm build passam; pnpm dev sobe; screenshot Playwright mobile (390px) da home conferida.
11. Commits atômicos (chore: scaffold, chore: ci, docs: kit e CLAUDE.md etc.).
12. GitHub: gh repo create OWNER/REPO --private --source . --remote origin --push. Para cada colaborador: gh api -X PUT repos/OWNER/REPO/collaborators/<USER> -f permission=push; liste os convites com gh api repos/OWNER/REPO/invitations. Crie labels (feat, bug, ia, db, ui, legal, blocked) e o milestone 'Hack Brasil 2026 - 30/11'.
13. Proteção da main: tente branch protection (PR obrigatório, 1 aprovação, check do CI, sem force push). Em repositório privado de conta gratuita isso normalmente é recusado; se a API recusar, NÃO insista nem mude de plano: registre em CONTRIBUTING.md 'main protegida por convenção + CI' e siga.
14. Atualize docs/_projeto/PROGRESS.md; commit; push.
RELATE: URL do repo, convites pendentes, status do primeiro run do CI (gh run list --limit 1), e o que falhou.
```

**Depois do P2:** avise o grupo para aceitar o convite e clonar. Gui e Frigeri já podem começar (testar o provedor de IA; juntar fotos de nota). Murilo espera o P3 (contratos).

---

### P3 · Arquitetura, modelagem, contratos e ameaças

**Modelo: Opus (mais novo disponível no `/model`) · Esforço: high · Entre em PLAN MODE (Shift+Tab)**

```
FASE: P3 Arquitetura, modelagem de dados, contratos e ameaças. PLAN MODE: primeiro o PLANO, depois os arquivos. Não implemente telas, migrations nem chamadas reais de IA.

LEIA: @docs/_projeto/PROGRESS.md, @docs/00-TRIAGEM-E-PROFUNDIDADE.md e, sob demanda, @docs/05, @docs/07, @docs/08, @docs/03.
PRODUTO: Conta Comigo. O usuário (MEI ou pequeno comerciante) envia foto de nota, áudio, print de vendas ou texto; a IA extrai lançamentos como RASCUNHO; o usuário confirma; um motor de regras determinístico calcula limite do MEI (R$ 81 mil/ano), DAS (vence dia 20), resumo mensal e alertas; um chat responde dúvidas usando uma base legal em kb/*.md, citando fonte e data. Time de 4 pessoas (2 iniciantes), 8 dias: simples vence.

PRIMEIRO, em até 25 linhas: a TRIAGEM no formato do doc 00, as 5 decisões mais difíceis, e 3 alternativas que você rejeita (com motivo). ESPERE meu OK.

DEPOIS DO OK, produza (curto, cada doc ≤ 2 páginas):
A) docs/ARQUITETURA.md: 3 atributos de qualidade prioritários; diagrama C4 níveis 1 e 2 em Mermaid; camadas e REGRA DE DEPENDÊNCIA: app → actions → {lib/db, lib/ai, lib/engine}; lib/contracts é a base de todos; lib/engine e lib/contracts são PUROS (não importam next, react, supabase, SDK de IA, fs); lib/ai e lib/db dependem só de contracts; actions orquestra (Zod, authz, chamada), sem regra de negócio; componentes de UI não acessam banco direto. Acoplamento por interface (AiProvider, repositórios) para trocar provedor sem dor. Fazer cumprir com ESLint no-restricted-imports (sem dependência nova) + um teste Vitest que falha se lib/engine importar algo proibido.
B) docs/DADOS.md + ER em Mermaid + modelo lógico em 3FN. Entidades: perfis, categorias (tabela de domínio), contrapartes, documentos, lancamentos, alertas, mensagens, consentimentos (versão do texto, data, finalidade), audit_log, ai_usage (custo por dia por usuário). Regras: PK uuid; user_id em toda tabela; dinheiro bigint em centavos; timestamptz UTC; CHECK (valor > 0, data plausível); UNIQUE onde couber; estados com transições documentadas (rascunho → confirmado; confirmado só editável com auditoria); soft delete só onde justificar + exclusão definitiva para LGPD. Liste as 6 consultas principais e os índices. Justifique toda desnormalização (idealmente nenhuma).
C) lib/contracts/*.ts com Zod e tipos inferidos: Perfil, Lancamento e Rascunho, IngestRequest/Response, DashboardResponse, Alerta, ChatRequest/Response com fontes, erro padrão. Mais lib/contracts/mocks.ts (3 meses de dados falsos realistas) e a flag NEXT_PUBLIC_USE_MOCKS. Assinaturas (só tipos + throw new Error('not implemented')) das funções do engine: valorDas, proximoVencimentoDas, statusLimiteMei, projecaoAnual, resumoMes, gerarAlertas, simularEmprestimo; e da interface AiProvider. Um teste Vitest valida cada mock contra seu schema.
D) docs/AMEACAS.md: modelagem em 4 perguntas (Shostack) + tabela STRIDE enxuta (≤ 15 linhas): upload de imagem/áudio; prompt injection via texto de nota/print/áudio (OWASP LLM01); vazamento entre usuários (IDOR/RLS); excesso de agência da IA; custo descontrolado (consumo ilimitado); chave de API vazada; dado pessoal em log. Para cada uma: mitigação, dono (Arthur/Gui/Murilo/Frigeri) e item do OWASP Top 10:2025 / ASVS (L1; L2 em auth, dado financeiro e upload).
E) docs/adr/ADR-001..004 (≤ 10 linhas, só decisões irreversíveis): Supabase em vez de Neon+Drizzle+Better Auth (desvio consciente do kit §05; gatilho de revisão); monólito modular em camadas; IA com saída validada e engine determinístico; sem criptografia de aplicação (TLS + repouso da plataforma + RLS + minimização; gatilho para rever).
F) docs/LGPD.md (checklist técnico, NÃO é parecer jurídico): inventário de dados (campo, finalidade, base legal, retenção); papéis (nós = controlador no hackathon; Supabase, Vercel e o provedor de IA = operadores); transferência internacional para o provedor de IA (Resolução CD/ANPD 19/2024: registrar as cláusulas-padrão/DPA do provedor e informar na política); direitos do titular (exportar e excluir); retenção (áudio apagado após transcrever; imagens por N dias); minimização (não coletar CPF; remover EXIF/GPS das fotos); encarregado. Marque 'REVISAR COM HUMANO' onde houver dúvida.
G) Atualize CLAUDE.md (regras de camadas) e PROGRESS.md. Rode pnpm check. Commit atômico por documento e push em main.
Use o Context7 só para as APIs que for usar. Não faça extras: ideias vão para o Backlog.
```

**Depois do P3:** Murilo já pode implementar `lib/engine` contra as assinaturas e os mocks; Gui contra `AiProvider`; Arthur e Frigeri contra os contratos.

---

### P4 · Banco de dados (migrations, RLS, triggers, storage, testes)

**Modelo: Sonnet · Esforço: high · Nova sessão**

**Faça antes, no seu terminal (são interativos):** `pnpm exec supabase login` e `pnpm exec supabase link --project-ref <REF>` (vai pedir a senha do banco; não cole no chat).

```
FASE: P4 Banco de dados no Supabase. SEM Docker: projeto remoto já linkado (supabase link feito por mim).
LEIA: @docs/DADOS.md, @docs/adr, @docs/AMEACAS.md, @docs/08 (seções de dados) e use as skills supabase e supabase-postgres-best-practices. Confirme sintaxe de RLS/Storage no Context7 ou na doc oficial antes de escrever.

PASSO 0: adicione o Supabase MCP, read-only e preso ao projeto: claude mcp add --scope project --transport http supabase 'https://mcp.supabase.com/mcp?read_only=true&project_ref=<REF>' (peça-me o REF). Eu autentico em /mcp.

FAÇA (migrations versionadas em supabase/migrations/<timestamp>_<nome>.sql; NUNCA editar migration já aplicada):
1. Esquema: enums/domínios, tabelas do DADOS.md, FKs com ON DELETE CASCADE a partir de auth.users, CHECKs, UNIQUEs, índices (FKs e filtros das 6 consultas principais; igualdade antes de intervalo).
2. Funções e TRIGGERS: (a) set_updated_at() BEFORE UPDATE em todas as tabelas com updated_at; (b) handle_new_user() AFTER INSERT em auth.users cria o perfil — SECURITY DEFINER, set search_path = '', e REVOKE EXECUTE de public/anon/authenticated; (c) guarda de lancamentos BEFORE UPDATE: proíbe trocar user_id e voltar confirmado → rascunho; (d) auditoria AFTER INSERT/UPDATE/DELETE em lancamentos gravando em audit_log (tabela, operação, id, user_id, colunas alteradas — sem valores financeiros nem texto livre).
3. RLS em TODAS as tabelas: ENABLE ROW LEVEL SECURITY; políticas separadas por operação, to authenticated, com (select auth.uid()) = user_id; nada para anon (REVOKE ALL do anon); categorias só SELECT; audit_log e ai_usage sem escrita pelo cliente (escrita só via função SECURITY DEFINER com search_path vazio ou service key no servidor).
4. Storage: bucket PRIVADO 'documentos', limite 10 MB, allowed_mime_types (jpeg, png, webp, pdf, audio mpeg/mp4/webm/ogg), caminho {user_id}/{uuid}.ext, políticas em storage.objects (insert/select/delete somente na pasta do próprio auth.uid(); sem update). Leitura só por signed URL curta.
5. Seed: categorias padrão (migration) e supabase/seed/demo.sql com 3 meses de dados para o usuário de demonstração (o usuário é criado por script; senha NUNCA no repositório).
6. Tipos: pnpm exec supabase gen types typescript --linked > lib/db/database.types.ts. Repositórios em lib/db (um arquivo por agregado, 'server-only', sempre com o client do usuário para respeitar a RLS).
7. TESTES DE RLS (Vitest, script separado pnpm test:rls, fora do CI padrão por usar segredos): crie 2 usuários de teste pela service key (lida de .env.local, nunca impressa); prove que A não lê/edita/apaga dados de B; anon não lê nada; insert com user_id alheio falha; acesso cruzado no storage falha; transição inválida de status falha; trigger de auditoria grava; limpe tudo no afterAll.

PARE e MOSTRE-ME as migrations de RLS, triggers e storage (diff) antes de aplicar. Só com meu OK: supabase db push --dry-run, depois supabase db push.
DEPOIS: rode os advisors de segurança e de performance pelo MCP (se disponíveis) e corrija TODO ERRO/ALERTA de segurança. EXPLAIN (ANALYZE) nas 6 consultas com o seed e ajuste índices só se medir ganho.
PRONTO QUANDO: db push ok; test:rls verde; advisors sem erro de segurança; pnpm check verde.
AO TERMINAR: PROGRESS.md; um commit por migration + um para tipos/repos/testes; push em main.
FORA DE ESCOPO: auth no app, telas, IA.
```

---

### P5 · Segurança da aplicação, auth, LGPD e guardrails de IA

**Modelo: Sonnet · Esforço: high · Nova sessão (se travar 2× no mesmo erro, suba para Opus)**

```
FASE: P5 Segurança da aplicação, auth, LGPD e guardrails de IA.
LEIA: @docs/ARQUITETURA.md, @docs/AMEACAS.md, @docs/LGPD.md, @docs/08 e @docs/_projeto/PROGRESS.md. Confirme APIs no Context7 (Next 16 proxy.ts, @supabase/ssr).

FAÇA (um bloco por vez; pnpm check verde e commit ao fim de cada bloco):
1. AUTH com Supabase SSR: lib/supabase/{client,server,proxy}.ts; proxy.ts do Next 16 só renova a sessão e redireciona. No servidor use SEMPRE auth.getClaims(); NUNCA getSession(). Rotas de app/(app) exigem sessão. Login e cadastro por e-mail e senha, callback de confirmação. Nunca exponha a chave secreta ao cliente.
2. AUTORIZAÇÃO: toda action e route handler revalida o usuário e usa o client DO USUÁRIO (RLS vale). A service key fica só em lib/security/admin.ts com 'server-only', usada apenas para excluir conta e nos testes. Crie o wrapper safeAction(schema, handler): Zod na entrada, authz, erro genérico para o usuário, log sem dado pessoal.
3. UPLOAD seguro em lib/security: valide tipo por magic bytes (não só extensão/MIME), tamanho e quantidade; nome gerado no servidor (uuid); remova EXIF/GPS das imagens (sharp, uma dependência); áudio é apagado após transcrever; leitura por signed URL de 60 s.
4. CSP e headers: CSP com nonce via proxy.ts. Se quebrar o app, deixe em Report-Only e abra issue com o que falta.
5. LIMITES: teto diário de custo por usuário usando a tabela ai_usage (consultar antes de chamar a IA; bloquear com mensagem clara) e limite de tamanho/quantidade de entrada.
6. LGPD no produto: rotas /legal/termos e /legal/privacidade (o texto é da Frigeri; aqui só a estrutura e links no rodapé e no cadastro); consentimento no cadastro gravando em consentimentos (versão do texto, timestamp, finalidade incluindo envio a provedor de IA no exterior), NÃO pré-marcado; ação 'Exportar meus dados' (JSON) e ação 'Excluir minha conta' (apaga objetos do storage + auth.users em cascata) com confirmação e teste automatizado. Sem analytics por padrão (então sem banner de cookies).
7. GUARDRAILS DE IA em lib/ai (só a casca; os prompts de produto são do Gui): interface AiProvider + FakeProvider para testes; saída SEMPRE validada com Zod (máx. 2 tentativas, depois cai no 'preencher manualmente'); texto de nota/print/áudio entra num bloco delimitado e rotulado como DADO, nunca como instrução; ferramentas do chat somente leitura (get_*) e propor_lancamento (cria RASCUNHO; só o usuário confirma); timeout; logs sem o texto do usuário; chave só no servidor. Testes com FakeProvider: texto malicioso dentro de uma nota ('ignore as regras anteriores…') não altera o schema nem aciona ferramenta; teto diário bloqueia; saída inválida cai no fallback.
8. E2E mínimo (Playwright): sem sessão redireciona para login; usuário A não vê dado de B por URL; fluxo de exclusão de conta funciona.
9. docs/SEGURANCA-CHECKLIST.md: itens do ASVS L1 (e L2 em auth, dado financeiro, upload) com status feito/pendente/não se aplica, ligados ao AMEACAS.md. Rode pnpm audit e o /security-scan do ecc; corrija o crítico e o alto, triando dependência de produção x desenvolvimento antes de qualquer --force (nunca use --force às cegas).
PRONTO QUANDO: pnpm check, test, test:rls, e2e e build verdes; checklist atualizado; nada de segredo no histórico (gitleaks detect).
AO TERMINAR: PROGRESS.md (≤15 linhas); commits atômicos; push em main.
FORA DE ESCOPO: telas de produto, prompts de produto, deploy.
```

---

### P6 · Handoff do time (issues, README, clone limpo)

**Modelo: Sonnet · Esforço: low · Nova sessão**

```
FASE: P6 Handoff do time.
OBJETIVO: qualquer integrante clona e começa em 10 minutos, e cada um tem suas tarefas do Dia 1 como issues.

FAÇA:
1. README.md em PT-BR: o que é o projeto (3 linhas), como rodar (clonar, pnpm install, copiar .env.example para .env.local, preencher, pnpm dev), variáveis (só NOMES; publishable key e URL do Supabase podem ser compartilhadas; chave secreta e chave de IA NUNCA vão para WhatsApp/GitHub — cada um usa a sua ou usamos um gerenciador de senhas), estrutura de pastas e DONO de cada uma, como abrir PR, links para docs/.
2. Issues no GitHub (gh issue create) com label, milestone 'Hack Brasil 2026 - 30/11' e assignee quando o colaborador já aceitou o convite; senão ponha o nome no título. Use este plano:
 ARTHUR: D1 auth+layout mobile; D2 tela de envio (câmera/arquivo/mic) e confirmação; D3 integração real do ingest + lista; D4 dashboard com medidor do MEI e alertas; D5 chat UI com streaming e fontes; D6 polimento mobile/iOS e estados de erro; D7 deploy Vercel e freeze.
 GUI: D1 AiProvider real + extração de foto de nota (JSON+Zod); D2 áudio→transcrição→lançamento e texto livre; D3 print de vendas em lote + avaliação v1; D4 chat v1 com kb e fontes; D5 tools do chat e guardrails; D6 custo/latência e fallback; D7 plantão.
 MURILO: D1 valorDas, proximoVencimentoDas, statusLimiteMei + testes; D2 resumoMes, projecaoAnual, gerarAlertas + testes; D3 página de lançamentos; D4 alertas ligados ao banco + seed da demo; D5 calendário fiscal ou simulador; D6 testes e bugs; D7 plantão.
 FRIGERI: D1 landing + onboarding; D2 kb/*.md com 8 arquivos da base legal com fonte e data; D3 Termos e Privacidade v1 + roteiro de QA; D4 teste no celular e bugs; D5 vídeo e slides v1; D6 QA completo + atualizar legal; D7 vídeo final, ensaio e envio da submissão até 18h de 30/11.
3. Rascunho de mensagem curta para o grupo (WhatsApp) com link do repo e os 4 passos: aceitar convite, clonar, pnpm install, preencher .env.local.
4. Teste de clone limpo: git clone numa pasta temporária, pnpm install --frozen-lockfile, pnpm check, pnpm build. Corrija o que quebrar.
5. docs/_projeto/PROGRESS.md; commit; git tag v0.1.0-setup; push com tags.
RELATE: link do repo, número de issues criadas por pessoa, resultado do clone limpo.
```

---

## 5. Se algo der errado

| Sintoma | O que fazer |
| --- | --- |
| `gh` pede login | `gh auth login` (HTTPS, navegador); `gh auth status` para conferir |
| Convite não aparece para o colega | Conferir o username exato; ver `gh api repos/OWNER/REPO/invitations`; pedir para aceitar em github.com/notifications |
| Branch protection recusada | Esperado em repo privado de conta Free. Seguir com convenção + CI (já previsto no P2) |
| Hook do husky/gitleaks bloqueia commit | Ler a mensagem: quase sempre é segredo de verdade. Remover, rotacionar a chave e commitar de novo. Não usar `--no-verify` |
| `supabase link` falha | Conferir o ref, a senha do banco e `supabase login`; rodar no seu terminal, não pelo Claude |
| Usuário é deslogado do nada | Em Next 15 ou anterior o arquivo se chama `middleware.ts`; no 16 é `proxy.ts`. Conferir a versão |
| Claude Code pulou arquivo ou não rodou teste | Subir o esforço (não o modelo) |
| Mesmo erro 3× | Parar, pedir causa raiz, só então trocar de modelo |

---

## 6. Fontes da pesquisa

- Claude: modelo e esforço no Claude Code (claude.com/blog/claude-model-and-effort-level-in-claude-code)
- Playwright MCP para Claude Code (playwright.dev/mcp/clients/claude-code)
- Supabase Agent Skills e Postgres Best Practices (supabase.com/blog/postgres-best-practices-for-ai-agents; github.com/supabase/agent-skills)
- Supabase MCP no Claude Code (mcp.so/blog/supabase-mcp-claude-code-setup)
- Supabase Auth SSR com Next.js, `proxy.ts` e `getClaims()` (supabase.com/docs/guides/auth/server-side/nextjs)
- Checklist de produção e RLS do Supabase (supabase.com/docs/guides/security/production-checklist)
- Storage privado, RLS em storage.objects e signed URLs (flaviocopes.com, rapidevelopers.com)
- GitHub: proteção de branch em repositório privado exige plano pago (docs.github.com, about protected branches; community discussion 174400)
- OWASP Top 10 for LLM Applications 2025 e 2026 (hackerone.com, cloudsecurityalliance.org)
- ANPD: Resolução CD/ANPD nº 19/2024, transferência internacional (gov.br/anpd; migalhas.com.br)
- Seu docs-kit v4 (docs 00, 05, 07, 08, 09, 10 e PROMPT-SETUP-GLOBAL)

*Quando terminar o P6, me diga e eu monto os prompts do Dia 1 (auth e tela de envio, provedor de IA e extração, engine, landing e base legal), um por pessoa.*
