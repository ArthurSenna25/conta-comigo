# AMEAÇAS — Conta Comigo

Modelagem rápida (Shostack, 4 perguntas) + STRIDE enxuto. Nível: ASVS 5.0 L1; **L2** em auth, dado financeiro e upload.

## 1. O que estamos construindo?
PWA onde o MEI envia foto/áudio/texto; a IA (provedor externo, só no servidor) devolve rascunhos; o usuário confirma; o `lib/engine` calcula limite, DAS e alertas; um chat responde com fontes de `kb/`. Dados: perfil do negócio, lançamentos financeiros, imagens de notas (podem ter CPF/CNPJ de terceiros). Ver `ARQUITETURA.md` e `DADOS.md`.

## 2. O que pode dar errado? 3. O que faremos?

| # | STRIDE | Ameaça | Mitigação | Dono | OWASP / ASVS |
|---|---|---|---|---|---|
| 1 | T, E | Upload malicioso (arquivo disfarçado, gigante, polyglot) | Zod `ImagemArquivo`/`AudioArquivo` (tipo + tamanho) **e** checagem de magic bytes no servidor; nome gerado (`{user_id}/{uuid}.ext`); bucket privado; URL assinada curta; nunca servir como HTML | Arthur | A05, A06 · V5 (L2) |
| 2 | I | EXIF/GPS da foto revela endereço | Cliente reencoda no `<canvas>` (remove metadados, reduz para ≤ 1600 px); servidor rejeita JPEG com segmento EXIF | Arthur | A04 · V14 |
| 3 | T | Prompt injection no texto da nota, print ou áudio (LLM01) | Conteúdo vai como dado delimitado, nunca no system prompt; saída só via schema Zod (`IngestResponse`); IA não tem ferramenta de escrita; tudo vira rascunho que o usuário confirma | Gui | A05 · LLM01, LLM05 |
| 4 | E | Excesso de agência da IA (LLM06) | IA não grava, não apaga, não calcula imposto: só devolve JSON validado. Números do chat vêm do `lib/engine` via `ContextoChat` | Gui + Murilo | A06 · LLM06 |
| 5 | S, T | Histórico de chat forjado (assistente falso, fonte falsa) | `ChatRequest` aceita só `role=user`; fontes geradas no servidor e restritas a `kb/*.md` (regex no schema) | Gui | A08 · V2 |
| 6 | I, E | IDOR / vazamento entre usuários | RLS `user_id = auth.uid()` em todas as tabelas + checagem de sessão em toda action/rota; FK composta documento↔usuário; policy de Storage por pasta | Arthur | A01 · V8 (L2) |
| 7 | E | Usuário zera o próprio contador de IA | `ai_usage` só leitura via RLS; escrita só por função `security definer` chamada do servidor | Arthur | A01 · V8 |
| 8 | D | Custo descontrolado (LLM10) | Teto diário por usuário (`ai_usage`, `AI_DAILY_BUDGET_CENTS`) checado **antes** da chamada; limites de tamanho (texto 2000, áudio 2 MiB, 10 msgs no chat); teto de gasto no painel do provedor; `MODO_DEMO` com mocks | Gui | A06 · LLM10 |
| 9 | I | Chave de API ou secret key vazada | Só em `.env.local`/Vercel, nunca `NEXT_PUBLIC_`; gitleaks no pre-commit e CI; secret key só em `actions/`/`app/api/` (server-only); rotacionar se vazar | Arthur | A02, A04 · V13 |
| 10 | I | Dado pessoal em log ou em erro | Logar só ids, códigos e duração; nunca texto da nota, áudio, valores ou prompt; `ErroResposta` com mensagem genérica, sem stack | Todos | A09, A10 · V16 |
| 11 | S | Sessão roubada / auth fraca | Supabase Auth; o `@supabase/ssr` grava o cookie **sem** HttpOnly/Secure por padrão, então `lib/db/cookies.ts` força HttpOnly + SameSite=Lax + Secure em produção (teste unitário); identidade no servidor por `getClaims()` (assinatura ES256 validada; nunca `getSession()`); proxy renova a sessão; senha 8–72 bytes | Arthur | A07 · V6, V7 (L2) |
| 12 | R | Usuário contesta lançamento editado | **Aceito por prazo:** sem audit_log (ADR-004); `atualizado_em` registra a última edição | Arthur | A09 |
| 13 | I | IA afirma regra legal falsa | Só afirma o que está em `kb/` com fonte e data; sem base → "consulte um contador"; avaliação com 15 perguntas | Frigeri + Gui | A06 |
| 14 | I | Enumeração de e-mails no cadastro | **Aceito por prazo (24/11):** com "Confirm email" desligado, e-mail novo vira conta e e-mail existente falha, então a diferença é observável (e a sonda cria conta). Login: mesma resposta para senha errada, e-mail inexistente e não confirmado. **Gatilho:** usuários reais fora da demo → ligar "Confirm email" + SMTP próprio (o padrão do Supabase manda 2 e-mails/hora); o ramo `confirmarEmail` já existe | Arthur | A07 · V6 |
| 15 | D | Força bruta e login em massa: o limite do Supabase Auth é por IP e as chamadas saem do servidor (IP compartilhado), sem limite por conta nem CAPTCHA | **PENDENTE:** limitador próprio (IP + e-mail) e/ou Turnstile, e medir o limite real do projeto. Cadastro sem confirmação cria conta sem custo para o atacante | Arthur | A07, A06 · V6 |
| 16 | E | Portão de consentimento/perfil é opt-in por página/action; RLS não conhece consentimento | `exigirAcesso()` em toda página (`tests/portao.test.ts` falha se faltar). **PENDENTE para `app/api/*` (Gui):** variante que devolve 401/403 `ErroResposta` em vez de redirect, checagem de Origin em POST e checagem de `envio_ia` antes de chamar `lib/ai` (comparando também a `versao`: um `envio_ia` de versão antiga não vale) | Arthur + Gui | A01 · V8 |
| 17 | S | Token roubado vale até expirar (~1 h) mesmo após logout: `getClaims()` valida a assinatura localmente | Aceito para o MVP; operações sensíveis (excluir conta, exportar dados) devem usar `getUser()` | Arthur | A07 · V7 |
| 18 | E | Modo mock ligado fora de dev serviria usuário falso | `modoMock()` só liga com `NODE_ENV` development/test e **lança** nos demais; `tests/flag-mock.test.ts` proíbe ler a flag fora dele. Nunca expor `next dev` em host público | Arthur | A02 · V13 |
| 19 | I | Aceite revogado da mesma versão não pode ser reaceito (unique + insert ignorado): usuário preso em `/consentimento` | Latente: nada revoga hoje. **PENDENTE** antes da tela de revogar: função `security definer` ou nova linha por reaceite, com teste | Arthur | LGPD art. 8 |
| 20 | I | Consentimento não informado: as caixas apontam para `/legal/termos` e `/legal/privacidade`, que ainda não existem (404), e `VERSAO_CONSENTIMENTO` fica gravada contra um texto que o usuário não leu | **BLOQUEADOR DE RELEASE** (Frigeri): publicar as duas páginas em `app/legal/` (já são rotas públicas) e revisar o texto: uma caixa grava duas finalidades, o aceite de `envio_ia` deve nomear o provedor e o país (transferência internacional), e a base legal dos dados financeiros é execução de contrato, não consentimento | Frigeri | LGPD art. 8, 9 e 33 |

## 4. Fizemos um bom trabalho?
Revisar esta tabela no checkpoint de 28/11: cada linha tem teste ou verificação manual registrada no QA (`docs/09`). Linhas sem evidência viram bug antes do freeze.
