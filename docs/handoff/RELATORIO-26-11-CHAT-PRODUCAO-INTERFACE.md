# Chat em produção e interface · 26/11/2026

## Diagnóstico do 503

O código da `main` lia `AI_API_KEY` e `AI_MODEL`. Arthur mencionou `GEMINI_API_KEY` e `GEMINI_MODEL` e sinalizou suspeita de variável ausente. A diferença entre os nomes foi confirmada no código. Em teste local, uma chave ausente no nome reconhecido faz o provider lançar antes de reservar uma chamada, e o handler devolve HTTP 503. O teste público sem sessão alcançou a Vercel, onde a página inicial respondeu HTTP 200 e o chat devolveu `nao_autenticado`. A configuração do deploy ativo e os logs das duas chamadas autenticadas ficaram fora do alcance deste checkout. A causa específica em produção ainda precisa de confirmação.

O [PR #33](https://github.com/ArthurSenna25/conta-comigo/pull/33) aceita os dois aliases e mantém a precedência de `AI_*`. Os logs novos distinguem falhas em configuração, reserva, SDK, validação e contexto. Registram apenas dados operacionais permitidos, sem credenciais, exceções brutas, mensagens ou dados financeiros. O contrato de erro, o portão, a reserva e as mensagens do PR #32 foram preservados.

### Conferir em Production na Vercel

- No deploy ativo anterior ao PR #33, confirme `AI_API_KEY` (chave do projeto Free), `AI_PROVIDER=gemini`, `AI_GEMINI_FREE_TIER_CONFIRMED=true` e, preferencialmente, `AI_MODEL=gemini-3.5-flash-lite`. Depois do PR, os aliases `GEMINI_API_KEY` e `GEMINI_MODEL` também são aceitos. Uma variável canônica preenchida tem precedência.
- Confira `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, a função `reservar_uso_ia`, `AI_DAILY_CALLS_GLOBAL`, `AI_DAILY_CALLS_USER`, `DEMO_AI_DAILY_CALLS` e `AI_DAILY_BUDGET_CENTS` positivo. A demo também precisa de sessão, perfil e consentimento de IA vigente.
- Após revisar o escopo **Production**, Arthur deve confirmar que o deploy ativo carrega as alterações. A Vercel aplica variáveis novas aos próximos deployments. Com a demo autorizada, enviar uma pergunta sintética. Se falhar, filtrar `POST /api/chat` nos Runtime Logs e conferir evento, etapa, motivo, status e duração. [Variáveis na Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables) · [Guia de diagnóstico do projeto](../../lib/ai/README.md)

## Interface

A [branch da interface](https://github.com/ArthurSenna25/conta-comigo/pulls?q=is%3Apr+head%3Afeat%2Fgui-chat-interface) parte da `main` e usa o contrato já disponível, sem dependência de merge do PR #33. A página protegida usa Azul-noite, componentes compartilhados, sugestões, histórico em memória, resposta em texto simples e fontes com título, link oficial e data. A integração usa o POST da própria origem em `/api/chat`, conforme a arquitetura e o README da rota. Envia somente as últimas dez mensagens do usuário, incluindo a atual.

O formulário bloqueia envios simultâneos, mantém o texto quando falha, anuncia carregamento, diferencia erros de rede e timeout local e permite retry manual. Em 401 e 403 oferece os caminhos de sessão ou consentimento. O fallback para registrar lançamentos aponta ao painel atual. O link direto para preenchimento manual depende da rota que Arthur está preparando.

Arquivos do backend: `lib/ai/gemini.ts`, `lib/ai/gemini.test.ts`, `lib/ai/README.md` e `app/api/chat/route.ts`. Arquivos de interface: `app/(app)/chat/page.tsx`, `conversa.tsx`, `requisicao.ts` e `requisicao.test.ts` na mesma pasta.

## Verificações

| Branch | Verificações |
|---|---|
| `fix/gui-chat-producao` | 40 testes focados, 574 testes em `pnpm check`, `pnpm build` aprovado. |
| `feat/gui-chat-interface` | 571 testes em `pnpm check`, `pnpm build` aprovado. Emulação em 320, 390 e 1280 px sem rolagem horizontal. Envio por Enter, foco, fonte HTTPS, fechamento com Esc, carregamento acessível, bloqueio de duplicação, 503 simulado, rascunho preservado e retry manual confirmados. |

As capturas locais estão em `test-results/chat-ui`. O contraste medido foi de 8,80:1 no texto da sugestão e 7,30:1 na data da fonte. A emulação é evidência de navegador. O QA em celular físico continua pendente.

## Validação real controlada

Em 26/11, por volta de 10h59, o Flash-Lite processou dados sintéticos do ambiente local. Os testes exercitam o provider diretamente. A interface foi verificada separadamente com mocks.

| Caso | Tempo | Resultado |
|---|---:|---|
| Foto de nota | 2,28 s | Rascunho válido |
| Print | 7,46 s | Rascunho válido |
| Texto | 4,49 s | Rascunho válido |
| Áudio | 8,15 s | Rascunho válido |
| Pergunta jurídica sobre limite anual | 5,26 s | Gabarito aprovado, com fonte oficial e data |
| Pergunta sobre saldo sintético | 4,89 s | Gabarito aprovado com valores do engine |

Foram seis tentativas HTTP 200, sem retries ou 429, com 7.054 tokens informados e custo registrado de R$ 0 no Free. Uma resposta válida de áudio passou de 8 s nesta amostra. Os arquivos preservados são `test-results/avaliacao-ia/2026-11-26T13-58-39-051Z.jsonl` e `test-results/avaliacao-chat/2026-11-26T13-59-51-568Z.jsonl`.

## Próximos passos

No check-in, Arthur confirma a configuração de Production e revisa o PR #33. Após o deploy autorizado, validar um chat autenticado na demo. No checkpoint de 27/11 às 12h, encerrar avaliações reais e confirmar o plano B de painel e lançamento por texto. Em 28/11, conferir celular físico, teclado, conexão lenta e o caminho para preenchimento manual.

Para a demo, usar exemplos fictícios: mostrar o painel e um lançamento por texto, abrir o chat e perguntar pelo limite anual do MEI, então abrir a fonte. Se a IA ficar indisponível, mostrar a orientação de falha e seguir pelo painel e pelo preenchimento manual.
