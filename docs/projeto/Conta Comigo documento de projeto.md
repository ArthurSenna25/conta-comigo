# Conta Comigo: documento de projeto

**Hack Brasil 2026 · versão 1.0 · 23/11/2026** Parte A: projeto (arquitetura, stack, dados, segurança). Parte B: passo a passo manual para criar o repositório no GitHub e o ambiente local.

---

# PARTE A — PROJETO

## A1. Resumo

**O que é:** app web mobile-first (PWA) que funciona como assistente contábil e financeiro com IA para MEIs, autônomos e pequenos comércios. O usuário envia **foto de nota, áudio, print de vendas ou texto**; a IA transforma em **lançamentos em rascunho**; o usuário **confirma**; um **motor de regras determinístico** calcula limite do MEI, DAS e alertas; um **chat** responde dúvidas com base legal citada.

**Prazo:** entrega 30/11 às 23h59 (confirmar no regulamento). Freeze de código em 29/11 às 18h.

**Time:** Arthur (tech lead, front e integração), Gui (IA), Murilo (engine e telas de dados), Frigeri (produto, conteúdo legal, pitch).

**Nível (kit 00):** N2, com segurança e LGPD reforçadas em login, dado financeiro e upload. Princípio: o menor processo que entrega algo correto e seguro. Sem Docker, monorepo, microsserviços, filas ou camadas extras.

## A2. Escopo do MVP

**Entra (MUST):** cadastro/login e onboarding; foto de nota para lançamento; áudio para lançamento; texto e print para lançamentos em lote; lista de lançamentos; dashboard (receita, despesa, saldo, medidor do limite do MEI, próximo DAS); alertas; chat com fontes.

**Se sobrar tempo (SHOULD):** simulador de empréstimo, calendário fiscal, relatório PDF.

**Fora (roadmap):** emitir nota ou DAS, integração gov.br/Receita, Open Finance, WhatsApp, app nativo, multiusuário, contador humano parceiro.

## A3. Stack

| Camada | Escolha | Observação |
| --- | --- | --- |
| Linguagem | TypeScript strict | Tudo tipado, sem `any` |
| Framework | Next.js 16 (App Router, `proxy.ts`) | Confirmar versão atual no Context7 |
| UI | Tailwind v4 + shadcn/ui (só o que usar) | Mobile-first, testar em celular real |
| Validação | Zod | Entrada, saída da IA e contratos |
| Back-end | Supabase: Postgres + Auth + Storage (região São Paulo) | Desvio consciente do padrão Neon+Drizzle+Better Auth do kit; ver ADR-001 |
| Auth | `@supabase/ssr`, `getClaims()` no servidor | Nunca `getSession()` no servidor |
| IA | Um provedor multimodal atrás da interface `AiProvider` | Gemini ou Claude API, decidido no Dia 0 |
| Testes | Vitest (unit e RLS), Playwright (e2e e screenshot) | `pnpm check` antes de todo PR |
| Gerenciador | pnpm, Node LTS | Igual ao seu setup |
| CI | GitHub Actions: lint, tsc, test, build, gitleaks | `contents: read` |
| Deploy | Vercel | Hobby é não comercial: serve para o hackathon, não para produto pago |
| Segurança de código | gitleaks, Dependabot, `pnpm audit` | Husky no pre-commit |

## A4. Arquitetura

**Estilo:** monólito modular em camadas (kit §05). Um único deploy, fronteiras claras por pasta.

```
Navegador (PWA mobile-first)
   |
   v
Next.js na Vercel
   proxy.ts            renova sessão, redireciona sem login
   app/                telas e route handlers (finos)
   actions/            casos de uso: Zod + authz + orquestra
   lib/engine/         regras de negócio PURAS (DAS, limite MEI, alertas)
   lib/ai/             AiProvider (extrai nota, transcreve, chat)
   lib/db/             repositórios (Supabase, com RLS)
   lib/contracts/      tipos + schemas Zod (base de tudo)
        |                       |
        v                       v
   Supabase (Postgres,      Provedor de IA
   Auth, Storage privado)   (fora do Brasil)
```

**Regra de dependência (a que garante coesão e baixo acoplamento):**

| Quem | Pode importar | Não pode importar |
| --- | --- | --- |
| `app/` | actions, components, contracts | db e ai direto |
| `actions/` | db, ai, engine, contracts | componentes de UI |
| `lib/engine/` | **só** contracts | next, react, supabase, SDK de IA, fs |
| `lib/ai/` | contracts | db, engine, next |
| `lib/db/` | contracts | ai, engine, next/ui |
| `lib/contracts/` | zod | tudo o resto |

Fiscalização: ESLint `no-restricted-imports` mais um teste que falha se `lib/engine` importar algo proibido.

**Regra de ouro:** a IA lê, classifica e explica; **`lib/engine` calcula**. Imposto nunca sai de LLM.

**Estrutura de pastas:**

```
conta-comigo/
  app/(marketing)/     landing
  app/(app)/           dashboard, lancamentos, calendario, onboarding, chat
  app/legal/           termos e privacidade
  app/api/             ingest, chat (handlers finos)
  actions/             casos de uso
  components/          UI compartilhada
  lib/contracts/  lib/engine/  lib/ai/  lib/db/  lib/security/  lib/supabase/
  kb/                  base legal em .md (fonte e data em cada arquivo)
  supabase/migrations/ supabase/seed/
  docs/                kit + ARQUITETURA, DADOS, AMEACAS, LGPD, adr/
  .github/             workflows, CODEOWNERS, templates
  proxy.ts  CLAUDE.md  README.md  .env.example
```

## A5. Fluxos principais

**Ingestão (foto, áudio, print, texto):** envio → validação (magic bytes, tamanho, remove EXIF) → Storage privado → `/api/ingest` → (transcrição se áudio) → IA devolve JSON → Zod valida → **rascunho** com confiança por campo → usuário confirma ou edita → `lancamentos` → engine recalcula dashboard e alertas.

**Alertas:** gerados por `gerarAlertas()` (código puro) a partir dos lançamentos e do perfil: DAS a 7 e 2 dias, limite do MEI a 70, 90 e 100%, despesa atípica, nota faltando.

**Chat:** pergunta → ferramentas somente leitura (`get_resumo_mes`, `get_limite_mei`, `get_proximos_vencimentos`, `simular_emprestimo`, `buscar_kb`) → resposta curta com **fonte e data** da `kb/`; sem base, diz que não sabe e sugere contador.

## A6. Dados (3FN)

**Tabelas:** `perfis`, `categorias` (domínio), `contrapartes`, `documentos`, `lancamentos`, `alertas`, `mensagens`, `consentimentos`, `audit_log`, `ai_usage`.

**Regras:** PK uuid; `user_id` em toda tabela; dinheiro em `bigint` centavos (nunca float); `timestamptz` em UTC; CHECK (valor maior que zero); estados `rascunho → confirmado` (confirmado não volta); FKs com `ON DELETE CASCADE` a partir de `auth.users`; índices só para as consultas reais, medidos com `EXPLAIN`.

**Triggers (3 + auditoria):** `set_updated_at`; `handle_new_user` (cria o perfil, `SECURITY DEFINER` com `search_path` vazio); guarda de transição de status em `lancamentos`; auditoria de `lancamentos` sem valores financeiros.

**Migrations:** SQL versionado em `supabase/migrations`, nunca editar uma já aplicada; mudança destrutiva em 2 passos.

## A7. Segurança (OWASP Top 10:2025 + OWASP LLM Top 10)

| Risco | Controle |
| --- | --- |
| Acesso quebrado | **RLS em todas as tabelas** e em `storage.objects`; authz em toda action e rota; `proxy.ts` nunca é a única camada; anon sem acesso |
| Configuração | Headers (CSP com nonce, HSTS, Referrer-Policy, Permissions-Policy, frame-ancestors); `.env*` fora do git; chave secreta só no servidor com `server-only` |
| Cadeia de suprimentos | Lockfile, poucas dependências, conferir o pacote antes de instalar, Dependabot, skills e MCPs só de fonte oficial |
| Injeção | Queries parametrizadas pelo cliente Supabase; Zod em toda entrada |
| Upload | Bucket privado, limite de tamanho e tipos, validação por magic bytes, nome gerado no servidor, EXIF removido, leitura por signed URL de 60 s |
| Prompt injection e excesso de agência | Texto de nota/print/áudio é DADO delimitado; ferramentas só leitura; IA só cria rascunho, quem confirma é o usuário |
| Consumo ilimitado | Teto diário por usuário (`ai_usage`), timeout, limite de entrada |
| Cripto | TLS + criptografia em repouso da plataforma (confirmar na doc) + RLS + minimização. **Sem cripto caseira.** Rever se um dia guardarmos dado mais sensível |
| Log | Sem dado pessoal nem texto do usuário |

## A8. IA

- Interface `AiProvider` com `FakeProvider` para teste; trocar de provedor não muda o resto.
- Saída sempre validada com Zod, no máximo 2 tentativas, depois cai em **preencher manualmente**.
- Confiança por campo; campos duvidosos ficam destacados e nada é salvo sem confirmação.
- RAG simples: arquivos `.md` curtos em `kb/`, cada um com `fonte` e `verificado_em`; sem banco vetorial.
- Modo demo com respostas gravadas como plano B (`MODO_DEMO`).
- Avaliação: 10 fotos, 5 áudios e 15 perguntas legais com resposta esperada; meta de 85% de campos corretos e zero afirmação legal sem fonte.

## A9. LGPD e termos

- Somos **controlador** no hackathon; Supabase, Vercel e o provedor de IA são operadores.
- Dados: identificação, dado financeiro, fotos de nota (podem ter CPF/CNPJ de terceiros), áudio. **Não coletar CPF**; áudio apagado após transcrever.
- Consentimento não pré-marcado, versionado, com a finalidade de envio a provedor de IA no exterior (Resolução CD/ANPD 19/2024: registrar as cláusulas-padrão ou DPA do provedor).
- Direitos do titular: **exportar** e **excluir conta** funcionando.
- Termos: ferramenta de apoio, não substitui contador nem advogado; a IA pode errar; o usuário confirma os dados.
- O app não emite DAS nem integra com gov.br; orienta e leva ao PGMEI. Não prometer o que não existe.
- Textos jurídicos gerados por IA passam por revisão humana.

## A10. Qualidade, branches e CI

- Branch `main` sempre verde. Trabalho em `feat/<pessoa>-<tema>`; PR pequeno; review em até 12h; sem force-push.
- Commits convencionais: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
- Antes do PR: `pnpm check` (lint + tsc + test) e `pnpm build`.
- CODEOWNERS por pasta (dono na tabela A12). Em repo privado Free a proteção de branch não existe: vale a convenção e o CI.
- Pronto = deploy público, usuário de demo, 6 etapas da demo passando 3 vezes seguidas, termos e privacidade publicados, README, vídeo de reserva.

## A11. Ambientes

| Ambiente | Onde | Dados |
| --- | --- | --- |
| Local | `pnpm dev` | Projeto Supabase de desenvolvimento ou mocks (`NEXT_PUBLIC_USE_MOCKS=true`) |
| Produção/demo | Vercel + Supabase | Usuário de demonstração com 3 meses de dados fictícios |

Variáveis (só nomes, valores em `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `AI_PROVIDER`, `AI_API_KEY`, `AI_DAILY_BUDGET_CENTS`, `NEXT_PUBLIC_USE_MOCKS`.

## A12. Donos por pasta e decisões

| Pessoa | Pastas |
| --- | --- |
| **Arthur** | `app/(app)/dashboard`, `components`, `actions`, `supabase/migrations`, `.github`, auth, deploy |
| **Gui** | `lib/ai`, `app/api/ingest`, `app/api/chat`, `kb/prompts` |
| **Murilo** | `lib/engine`, `app/(app)/lancamentos`, `app/(app)/calendario`, `supabase/seed` |
| **Frigeri** | `app/(marketing)`, `app/(app)/onboarding`, `app/legal`, `kb`, `docs` |

| Decisão | Gatilho para rever |
| --- | --- |
| Supabase no lugar de Neon+Drizzle+Better Auth | Precisar sair do Supabase ou de recurso que ele não tem |
| Sem Upstash (limite no Postgres) | Abuso real ou mais de um servidor de IA |
| Sem criptografia de aplicação | Passar a guardar dado mais sensível (CPF, conta bancária) |
| Vercel Hobby | Ir para produção comercial |
| Um único provedor de IA | Custo, latência ou qualidade ruins na avaliação |

---

# PARTE B — PASSO A PASSO: GITHUB E AMBIENTE LOCAL (manual)

Comandos para o **PowerShell 5.1** (não use `&&`). Pasta de projetos: `C:/dev`.

## B1. Confira as ferramentas

```
git --version
gh --version
node -v
pnpm -v
```

Se algum faltar: `winget install Git.Git`, `winget install GitHub.cli`, `winget install pnpm.pnpm`. Feche e reabra o terminal depois.

## B2. Identidade do Git (uma vez por PC)

```
git config --global user.name 'Seu Nome'
git config --global user.email 'seu-email-do-github@exemplo.com'
git config --global init.defaultBranch main
git config --global core.autocrlf input
```

Dica de privacidade: no GitHub, em Settings → Emails, você pode usar o e-mail `...@users.noreply.github.com` para não expor seu e-mail real nos commits.

## B3. Login no GitHub pelo terminal

```
gh auth login
```

Escolha: GitHub.com → HTTPS → Login with a web browser. Depois confirme:

```
gh auth status
```

Deve mostrar seu usuário e 'Logged in'. Se o `gh` reclamar de um token inválido em variável de ambiente (`GH_TOKEN`), remova essa variável e tente de novo.

## B4. Criar o repositório (privado)

**Pelo terminal (recomendado):**

```
cd C:/dev
gh repo create conta-comigo --private --add-readme --description 'Hack Brasil 2026: assistente contabil e financeiro com IA para MEIs' --clone
cd conta-comigo
```

**Ou pelo site:** github.com → New repository → nome `conta-comigo` → **Private** → marque 'Add a README' → Create. Depois:

```
cd C:/dev
git clone https://github.com/SEU-USUARIO/conta-comigo.git
cd conta-comigo
```

## B5. Primeiro commit: `.gitignore` e `.gitattributes` (antes de qualquer outra coisa)

Crie o arquivo `.gitignore` na raiz com:

```
node_modules
.next
out
.env*
!.env.example
.vercel
coverage
*.log
playwright-report
test-results
.supabase
supabase/.temp
Thumbs.db
.DS_Store
```

Crie `.gitattributes` com:

```
* text=auto eol=lf
```

Commit e push:

```
git add .gitignore .gitattributes
git commit -m 'chore: gitignore e gitattributes'
git push
```

## B6. Convidar os colaboradores

**Pelo terminal** (troque pelos usernames reais; um comando por pessoa):

```
gh api -X PUT repos/SEU-USUARIO/conta-comigo/collaborators/USER-DO-GUI -f permission=push
gh api -X PUT repos/SEU-USUARIO/conta-comigo/collaborators/USER-DO-MURILO -f permission=push
gh api -X PUT repos/SEU-USUARIO/conta-comigo/collaborators/USER-DO-FRIGERI -f permission=push
```

**Ou pelo site:** repositório → Settings → Collaborators → Add people → digite o username → permissão Write.

Cada um recebe o convite por e-mail e em github.com/notifications e precisa **aceitar**. Para ver quem ainda não aceitou:

```
gh api repos/SEU-USUARIO/conta-comigo/invitations --jq '.[].invitee.login'
```

## B7. Conferir

```
git status
git log --oneline
gh repo view --web
```

O `git status` deve dizer 'nothing to commit' e o navegador deve abrir o repositório privado com README e `.gitignore`.

## B8. Criar o projeto Supabase (no site)

1. supabase.com → New project.
2. Nome `conta-comigo`; região **South America (São Paulo)**.
3. Gere a senha do banco e guarde no gerenciador de senhas (não no chat, não no WhatsApp).
4. Anote o **Project ref** (o trecho da URL do painel). A URL do projeto e a chave publishable ficam em Project Settings → API; elas vão em `.env.local`, que nunca vai para o Git.

## B9. Como isso encaixa nos prompts

Como você já criou o repositório e clonou, **no P2 acrescente esta linha no início** do prompt:

```
ATENÇÃO: o repositório privado OWNER/conta-comigo JÁ EXISTE no GitHub, já está clonado na pasta atual, já tem .gitignore e .gitattributes commitados e os colaboradores já foram convidados. PULE os passos 1, 2 (git init e .gitignore/.gitattributes), 12 (gh repo create e convites) e só confira com gh repo view. Mantenha todo o resto. O scaffold do Next.js deve ser criado nesta pasta (que já tem README.md: use a opção do create-next-app para não conflitar, ou gere em pasta temporária e mova os arquivos, preservando .git e o README).
```

Se preferir que o Claude Code faça tudo, ignore a Parte B e use o P2 como está.

## B10. Problemas comuns

| Sintoma | Solução |
| --- | --- |
| `gh` não é reconhecido | Fechar e reabrir o terminal; `winget install GitHub.cli` |
| 'Authentication failed' no push | `gh auth login` de novo; `gh auth setup-git` |
| 'Repository not found' | Usuário errado na URL ou convite ainda não aceito |
| Aviso de CRLF/LF | Confirmar o `.gitattributes` e `core.autocrlf input` |
| Colega não vê o repo | Convite pendente: pedir para aceitar em github.com/notifications |
| Commit com `.env` por engano | Parar, NÃO dar push; `git reset HEAD~1`; se já foi para o GitHub, **rotacionar a chave** imediatamente |

*Quando terminar a Parte B, vá para o P1 e depois o P2 do Kit de Prompts.*
