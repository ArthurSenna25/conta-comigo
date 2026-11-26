# Integração do chat

`POST /api/chat` recebe JSON `{ "mensagens": [{ "role": "user", "conteudo": "Qual é meu saldo?" }] }`. Envie da própria origem com cookie de sessão e `Content-Type: application/json`. Mande só as mensagens do usuário, até dez, com 1.000 caracteres por mensagem. Leia `ChatResponse` no HTTP 200 e renderize `resposta` como texto simples. Use `fontes` para os chips de título, URL e data de verificação.

Mostre carregamento e impeça envio duplicado enquanto houver uma requisição pendente. Remova o carregamento ao concluir, falhar ou cancelar a espera no cliente. Se falhar, preserve a pergunta, permita nova tentativa manual e ofereça preenchimento manual quando a tarefa envolver registrar um movimento.

| Resultado | Comportamento da interface |
|---|---|
| HTTP 400 | Preserve o rascunho e permita corrigir a entrada. |
| HTTP 401 ou 403 | Ofereça login no 401. Confira perfil, consentimento e acesso à demo no 403. |
| `429 limite_ia` | Mostre `erro.mensagem`. O limite interno é diário, enquanto o 429 do Gemini pode ser por minuto, tokens ou dia. Ambos usam o mesmo código. Evite reenvio automático ou mostrar uma hora de renovação fixa. |
| `503 ia_indisponivel` | Mostre `erro.mensagem`, que orienta conforme timeout, conexão ou indisponibilidade. Falhas de controle e saída recusada continuam com a orientação genérica. |

Se a plataforma falhar antes da rota, o corpo pode não ser JSON. Nesse caso, mostre indisponibilidade temporária e preserve a pergunta. Sem base verificada, a resposta orienta a consultar um contador.

O portão exige consentimento de IA vigente. Fora do modo mock, só o usuário marcado como demo pode acessar o Gemini Free. Mantenha a conta e as mensagens da demonstração sintéticas. Antes da inferência, a mensagem é projetada num vocabulário financeiro fechado. O provedor recebe termos permitidos e trechos públicos. O painel e o perfil ficam no servidor. A projeção pode perder nuances e termos fora do vocabulário. O modelo seleciona trechos e indicadores por enum e índice; o servidor gera todo o texto, as fontes e os valores.

O contexto lê lançamentos do próprio usuário sob RLS e usa os totais do engine da data atual em São Paulo. O DAS usa o ano da competência, inclusive para vencimento em janeiro. As competências fora de 2026 ainda dependem de suporte do engine. Alertas estão ausentes até a implementação de `gerarAlertas`. O vencimento segue as limitações do engine para prorrogações e feriados.

A mesma reserva atômica de `ai_usage` da ingestão é executada uma vez por tentativa, inclusive no retry. Pelo painel confirmado em 24/11/2026, 300 chamadas globais/dia cabem nas 500 do Gemini Free. As 40 chamadas da demo contam dentro das 300. Restam até 200 por dia para outras origens se o aplicativo usar toda a cota interna. A reserva é diária e não impede picos acima de 15 RPM ou 250.000 TPM. Avaliações locais usam a mesma cota do provedor e não passam pela reserva do aplicativo. [Cotas do Gemini](https://aistudio.google.com/docs/rate-limits)

Em desenvolvimento, rode `pnpm dev` com `NEXT_PUBLIC_USE_MOCKS=true` e chame a rota no navegador da própria aplicação. Para verificar o modo real, use a sessão demo local com banco e reserva configurados, envie uma pergunta sintética e confira o contador da conta. Ao integrar na Vercel, valide também o Origin com um POST da própria interface. A rota não persiste histórico.
