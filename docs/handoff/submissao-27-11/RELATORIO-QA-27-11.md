# Conta Comigo · QA de 27/11/2026

**Ambiente:** [produção](https://conta-comigo-tau.vercel.app). Navegadores descartáveis, conta demo e dados fictícios. Foram usados WebKit com perfil iPhone 13 (390 × 664 px úteis) e Chromium com perfil Pixel 7 (412 × 839 px). Os resultados de emulação não substituem Safari ou Android em aparelho físico.

## Resultado para o time

O fluxo principal funcionou na demo. O texto `paguei 80 de frete ontem` gerou uma despesa de frete de R$ 80,00 com data de 26/11. A confirmação mostrou o aviso no painel. Uma única linha apareceu em Lançamentos. Editei sua descrição, excluí a linha e confirmei a remoção ao recarregar. A falha de rede simulada mostrou a mensagem de confirmação incerta, contou um único POST e voltou ao painel com o aviso de descarte. Nenhuma linha dessa segunda tentativa apareceu em Lançamentos.

### Segunda rodada em produção

- O CTA da landing abriu a demo no painel. Apareceu um único alerta agrupado para seis despesas de estoque ou frete sem comprovante. [PR dos alertas](https://github.com/ArthurSenna25/conta-comigo/pull/51)
- O chat já abre com a saudação inicial, sugestões clicáveis e aviso sobre erros da IA. Ao enviar `Olá`, a resposta continua sendo “Não tenho fonte confiável sobre isso nesta versão.” Responder à saudação digitada segue pendente na revisão do chat. [PR do chat](https://github.com/ArthurSenna25/conta-comigo/pull/52)
- Perfil abriu com os dados da demo e o aviso de que editar requer conta própria. A edição segue pendente de uma conta de QA.
- O refino de interface ainda estava em revisão e aguardava publicação para reteste. A checagem usou o app público e o resultado do deploy exibido no GitHub. O acesso aos logs da Vercel ficou pendente. [PR de UX](https://github.com/ArthurSenna25/conta-comigo/pull/53)

### Verificação local de consentimento e perfil

Passaram 90 testes existentes em cinco arquivos. Eles cobrem a separação dos aceites, a opção de enviar dados à IA, a criação e edição de perfil da sessão autenticada, o bloqueio da edição na demo e a validação no onboarding. Cadastro com e-mail e edição de perfil em uma conta comum continuam pendentes em produção.

### Problemas reproduzidos

| Prioridade | Onde | Como reproduzir e o que aconteceu | Sugestão para o dono |
| --- | --- | --- | --- |
| Alta no celular | Landing, WebKit em 390 px | Role até os links legais começarem a aparecer e pare com o centro dos links cerca de 45 px acima da borda. O botão fixo **Comece agora** cobre e intercepta os links. Rolar até o fim libera os links. [Captura](evidencias/conta-comigo-27-11-iphone-webkit-cta-sobreposicao.png) | UX pode recolher o CTA mais cedo e testar novamente no Safari em aparelho físico. |
| Alta se ocorrer com teclado físico | Chat, WebKit em 390 px | Abra o chat, foque **Sua pergunta** e reduza a altura a 430 px. A base do campo ficou em 467 px, 37 px abaixo da área útil. No Android emulado, à altura de 503 px, a base ficou em 451 px. [Captura](evidencias/iphone-webkit-chat-viewport-reduzida.png) | A equipe do chat deve confirmar no iPhone real com teclado e barra do Safari abertos. |
| Média | Painel, WebKit em 390 px | Abra a demo e pare no início do painel. **Adicionar** intersecta o cartão de alertas. As abas ficam abaixo do botão, mas passam sobre conteúdo durante a rolagem. [Captura](evidencias/iphone-webkit-painel-fab-e-alerta.png) | UX pode reservar espaço para as ações fixas e conferir o fim das telas em aparelhos físicos. |
| Média | Chat, Android emulado | Envie `Olá`. A resposta exibida foi “Não tenho fonte confiável sobre isso nesta versão.” O esperado no plano era uma saudação útil. | A equipe do chat pode verificar a regra de saudação em produção. |
| Média | Adicionar, nos dois motores | Cole um texto de 281 caracteres. O campo mantém só 280 e não avisa sobre a remoção. Há aviso sobre uso do Gemini Free, mas sem indicação do limite. | UX pode exibir o limite e informar quando o texto colado for encurtado. |

### Auditoria de promessas e conteúdo

| Texto ou estado | Evidência na versão testada |
| --- | --- |
| Cartão ilustrado diz que o código de pagamento do DAS fica disponível | O painel apresenta valor e vencimento. A interface testada não expôs um código de pagamento. O exemplo ilustrado mostra 20/12/2026 e o painel da demo mostrou 21/12/2026. |
| Landing promete fonte em cada resposta do chat | Perguntas sobre DAS, limite de 2027 e reforma receberam fontes na produção. A resposta a `Olá` não tinha fonte. Ajustar a promessa para respostas que dependem de uma referência. |
| Foto, áudio e print | A tela Adicionar mostrou as três opções desabilitadas, como “em breve”. A demonstração que chama IA usa texto curto. |
| Landing menciona pedidos de exclusão | A FAQ diz que o app ainda não tem botão para exclusão de conta. A política em produção está marcada como pendente e o time confirmou que o canal oficial, o responsável e o prazo ainda não estão definidos. Alinhar a promessa de atendimento com o canal antes de anunciar o procedimento. |
| Exemplo de faturamento da demo | O valor acessível no painel foi R$ 63.490,00 durante o teste, R$ 300 acima do roteiro. DAS de R$ 82,05 e vencimento em 21/12/2026 bateram com o roteiro. O alerta de comprovantes estava agrupado. Como a conta é compartilhada, anotar a referência antes da gravação. |

## Cobertura do roteiro

| Itens do roteiro | Resultado |
| --- | --- |
| 1–3 · Landing, carrossel, simulação, CTA | A âncora cai abaixo da barra. Carrossel avançou com toque emulado no Chromium e com rolagem programática no WebKit. A simulação abriu focando Fechar, e Escrever focou o campo com frase fixa. Enviar, Confirmar, Recomeçar e retorno de foco funcionaram nos dois motores. O CTA final permaneceu clicável. O CTA fixo sobre o rodapé tem o problema acima. |
| 4–5 · Cadastro, escolhas de IA e troca de conta | Formulário e links legais abriram. Termos, privacidade e envio à IA aparecem separados e inicialmente desmarcados. Cadastro, onboarding e troca para demo a partir de conta comum precisam de conta de QA autorizada. |
| 6–8 · Painel, texto por IA e limite de caracteres | Demo entrou nos dois motores. Ingestão de frete, confirmação e aviso passaram no Chromium. O limite de 280 é aplicado, com o problema de comunicação acima. |
| 9–12 · Valores, descarte e lançamentos | R$ 10.000.000,00 é o teto permitido, preservado sem gravar a quantia. R$ 10.000.000,01 e zero foram bloqueados. `10.5` virou `10,50`; `1.000` virou `1.000,00`; `1.234,56` e `R$ 34.020,00` preservaram o valor. `-10,50` e `1,2345` preservaram o campo anterior e mostraram erro. Cancelar sem confirmar deixou a lista limpa. Listar, editar e excluir o registro fictício passaram. |
| 13–14 · Chat e teclado | DAS, limite de 2027 e reforma responderam com fonte, observada no app. O teste não certifica o conteúdo fiscal dessas respostas. Saudação e campo em viewport reduzida têm os achados acima. Teclado real ficou pendente. |
| 15 · Perfil | Perfil da demo abriu e mostrou a mensagem de edição disponível em conta própria. Salvar em conta comum precisa de conta de QA. |
| 16–17 · Rotação e falha de rede | Rotação emulada sem rolagem horizontal nas telas conferidas. Ao desconectar na confirmação, houve um POST tentado, aviso de incerteza e link para Lançamentos. Depois de reconectar, Cancelar mostrou o aviso no painel e o registro não apareceu na lista. |
| 18–20 · Termos, Privacidade, promessas e textos | Termos e Privacidade abriram com HTTP 200. Os textos publicados indicam versão pendente. Sobreposições e promessas que precisam de revisão estão listadas acima. |

## Pendências de ambiente e de equipe

- Validar no iPhone e no Android físicos, especialmente teclado, gestos, rotação e barras do navegador. Registrar modelo, sistema, navegador e captura para os itens pendentes.
- Usar contas de QA autorizadas com estados de consentimento conhecidos para conferir cadastro, onboarding, recusa de IA em conta própria, troca para a demo e edição do perfil. O perfil da demo compartilhada é somente leitura.
- Alinhar o canal e a operação de atendimento aos direitos durante a revisão jurídica. As questões de interface da landing e do app entram no escopo de UX, e as questões do chat seguem com a equipe dessa área.

## Evidências

- [Landing na simulação (WebKit)](evidencias/conta-comigo-27-11-iphone-webkit-simulacao.png), [CTA sobre links legais](evidencias/conta-comigo-27-11-iphone-webkit-cta-sobreposicao.png) e [chat em Android](evidencias/android-chromium-chat.png).
