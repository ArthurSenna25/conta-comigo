# Recuperação do chat, KB e UX · 28/11/2026

## Status

A referência foi a `origin/main` em `25e2de9`. O [PR #52](https://github.com/ArthurSenna25/conta-comigo/pull/52) já trazia os três arquivos jurídicos, o aviso no formulário, uma saudação inicial e parte da adaptação à altura da janela. O [PR #49](https://github.com/ArthurSenna25/conta-comigo/pull/49) já estava mergeado. A recuperação foi validada localmente em dois worktrees e segue sujeita à revisão e ao deploy.

- [PR de chat, KB e UX](https://github.com/ArthurSenna25/conta-comigo/pulls?q=is%3Apr+head%3Afix%2Fgui-chat-kb-ux)
- [PR de consistência de receita](https://github.com/ArthurSenna25/conta-comigo/pulls?q=is%3Apr+head%3Afix%2Fchat-receita-anual)

## Chat

- A saudação inicial da interface já existia, mas uma saudação digitada caía no filtro do provedor. O endpoint agora responde a cumprimentos completos após validar acesso, contrato e limite da demo. O retorno tem zero fontes e não carrega contexto, reserva uso ou chama o SDK. As sugestões da saudação cobrem limite, valor e vencimento do DAS. Uma pergunta após o cumprimento segue pelo fluxo normal.
- Consultas fora do escopo e dúvidas do MEI sem fonte passam a ter mensagens distintas. O filtro continua antecipando IRPF, cálculos não suportados, pedidos de referência falsa e instruções para revelar ou ignorar o prompt. Consultas financeiras cobertas continuam usando os indicadores do engine.
- O buscador usava anos soltos como palavras-chave. Uma consulta fiscal sem cobertura que mencionasse 2027 podia recuperar o novo teto por coincidência. A seleção agora exige contexto do assunto, separa ano de exercício de ano citado como parte do número de uma lei e cobre o teto a partir de 2028. O servidor continua emitindo somente texto de trechos da KB e indicadores autorizados, com fontes e datas.

## Base jurídica

Os três arquivos entraram no #52 e foram revisados em 28/11. Os textos são sínteses dos dispositivos, com uma fonte principal por arquivo no formato atual.

| Arquivo | Dispositivos e efeitos |
|---|---|
| [Limites de 2027 e 2028](../../kb/limite-mei-2027-2028.md) | LC 238/2026, arts. 1º, 2º, 3º e 10. Publicação em edição extra e vigência em 21/10/2026. R$ 110 mil em 2027 e R$ 140 mil a partir de 2028, sob a condição orçamentária do art. 3º. Na abertura, R$ 9.166,67 e R$ 11.666,67 por mês, respectivamente, contando frações como mês inteiro. |
| [Empregados e remissão federal](../../kb/mei-lc-238-empregados-e-perdao.md) | Arts. 1º, 5º a 7º, 9º e 10, II, com efeitos a partir de 01/01/2027. Esclarece salário mínimo ou piso, escopo federal do perdão, corte em 13/10/2026, adimplência, requerimento, renúncia quando aplicável e regulamentação pela PGFN. Mantém a orientação de confirmar o enquadramento antes de contratar. |
| [Reforma do consumo](../../kb/reforma-tributaria-mei.md) | EC 132/2023, ADCT arts. 125, 126, 128 e 129. LC 214/2025 compilada com LC 227/2026, art. 41, alterações do art. 18-A da LC 123 e Anexo VII. Situa IBS, CBS e DAS na transição de 2026 a 2033. Não prescreve obrigações de nota fiscal de 2027. |

Os arquivos de limite e excesso de 2026 foram ajustados para delimitar R$ 81 mil ao MEI comum no ano completo. O excesso de até 20% e o excesso superior a 20% têm consequências distintas de desenquadramento, inclusive no ano de abertura. A base não determina um limite personalizado para anos futuros.

Fontes consultadas em 28/11: [LC 238 no Planalto](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp238.htm), [LC 238 no Senado](https://legis.senado.gov.br/norma/44276013/publicacao/44280206), [LC 123](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm), [Teto do MEI no MEMP](https://www.gov.br/memp/pt-br/prospera-mei/teto-do-mei), [Resolução CGSN 140](https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=92278), [EC 132](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm), [LC 214 compilada](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm) e [Reforma de Fato da Receita Federal](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/reforma-de-fato/reforma-de-fato).

## Interface e evidências

A janela passa a acompanhar a altura e o deslocamento do viewport visual. O cabeçalho compacto libera espaço e a lista continua sendo a única área de rolagem da conversa. O aviso de possíveis erros já estava no #52 e agora também descreve o campo para tecnologia assistiva. A navegação não mudou e a barra de abas continua ausente no chat conforme o comportamento existente.

Chromium com mocks em 320×280, 360×780, 390×844, 768×1024, 844×390 e 1280×800. Campo e aviso dentro do viewport, sem rolagem horizontal. Na janela de 320×280, a conversa passou de 22 px para 102 px. Em 390×500, uma demora simulada de 5,5 s manteve o indicador visível. A resposta longa chegou ao fim da lista quando ela estava acompanhando a mensagem nova. Ao voltar às mensagens anteriores durante outra espera, a chegada da resposta não levou a leitura ao fim. O chip abriu a fonte no Planalto com a data de verificação. Enter enviou a saudação e Home navegou no histórico.

Capturas locais: `antes-320x280.jpg`, `depois-320x280.jpg`, `carregando-390x500.jpg` e `fonte-390x500.jpg`. WebKit e aparelhos físicos não foram usados. O viewport redimensionado não reproduz as barras, o deslocamento do teclado ou a área segura do iPhone. Não houve auditoria instrumental de contraste.

## Receita anual

No PR independente, o chat usa `receitaAnualCentavos` e a leitura paginada já usadas pelo painel. O teste compara os dois caminhos com o mesmo perfil e lançamentos, incluindo data anterior à abertura, lançamento futuro, ano anterior, linha duplicada, despesa e a virada UTC que ainda é dia anterior em São Paulo. O teste confirma 12.345 e 13.345 centavos conforme o ano civil do cadastro. Engine, actions e banco permaneceram no escopo dos respectivos responsáveis.

## Testes e próximos passos

- Chat/KB/UX: 128 testes focados, 27/27 casos no gabarito determinístico, `pnpm check` com 896 testes e `pnpm build` concluído. O corpus preserva todos os IDs anteriores. A pergunta exata de 2027 já existia e as outras cinco foram acrescentadas.
- Receita anual: 42 testes focados, `pnpm check` com 880 testes e `pnpm build` concluído na branch independente.
- A KB revisada em 28/11 **não passou por avaliação real**. Foram feitas zero chamadas ao Gemini. O roteiro externo está preparado em [CHAT.md](../../tests/avaliacao-ia/CHAT.md) para uso somente com autorização expressa de Arthur.
- QA físico: no iPhone/Safari e Android/Chrome, use o chat com uma resposta simulada longa. Abra e feche o teclado com o campo focado, gire a tela, role para mensagens antigas durante a espera e abra uma fonte perto do fim. Confira o campo, a última linha, o retorno da altura, a área segura e a ausência de sobreposição. Complete com uma checagem de VoiceOver ou TalkBack se houver aparelho disponível.

## Resumo histórico para o README

Em duas rodadas anteriores de ingestão sintética com Flash-Lite, os lotes de 24/11 e 25/11 tiveram, respectivamente, 15/25 e 25/25 respostas válidas e 97/182 e 178/182 campos corretos contando falhas. O primeiro teve 12 HTTP 503 em 31 tentativas e quatro timeouts. O segundo teve 25 tentativas sem 503, 429 ou timeout. Custo registrado no Free de R$ 0. [Relatório de estabilidade](RELATORIO-25-11-ESTABILIDADE-IA.md)

Na avaliação jurídica histórica, o lote completo final de 25/11 aprovou 13/15 casos, com 17 tentativas e 7.460 tokens registrados. Em 26/11, as seis perguntas de ouro da versão anterior aprovaram 6/6 com cinco chamadas e uma resposta local. Esses números são históricos. A rodada de 28/11 foi exclusivamente determinística. [Histórico e método](../../tests/avaliacao-ia/CHAT.md)
