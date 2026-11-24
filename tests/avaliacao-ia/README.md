# Avaliação de extração no Gemini

A avaliação usa 25 entradas sintéticas, com 10 fotos de notas/comprovantes, 3 prints, 6 áudios e 6 textos. As imagens foram geradas offline e os áudios de fala sintetizados em português brasileiro no Windows. Os arquivos incluídos são utilizáveis em qualquer sistema compatível com Node 24. Os scripts de geração documentam a reprodução das mídias e requerem respectivamente Pillow e as vozes locais pt-BR do Windows.

Depois de verificar o plano Free no Google AI Studio e configurar `AI_PROVIDER` e a chave de servidor no ambiente local, rode a partir da raiz no PowerShell:

```powershell
$env:AI_GEMINI_FREE_TIER_CONFIRMED='true'
$env:AVALIAR_GEMINI='sim'
node tests/avaliacao-ia/executar.mjs
$rodada = Get-ChildItem test-results/avaliacao-ia/*.jsonl | Sort-Object Name | Select-Object -Last 1
node tests/avaliacao-ia/resumir.mjs $rodada.FullName
```

O executor lê a configuração pelo carregador do Next e fica fora do Vitest padrão. É possível usar `AVALIACAO_IA_IDS` com IDs separados por vírgula ou `AVALIACAO_IA_INICIO` para retomar por ID. O intervalo padrão é 12 segundos. O executor interrompe o lote quando há cota esgotada ou falha de autenticação, configuração ou rede. As medições são gravadas por caso em JSONL, em `test-results/avaliacao-ia`. Para juntar rodadas parciais, passe os arquivos em ordem cronológica e escolha o mesmo modelo e versão do código.

O gabarito fixa a referência em 24/11/2026. A pontuação associa registros por maior número de campos corretos sem depender da ordem. Conta tipo, data, valor em centavos, categoria, forma de pagamento, contraparte e origem. Ausências e respostas com falha contam zero nos campos esperados. Quantidade exata, extras, duplicações, nulos e perguntas pendentes têm critérios separados. Descrição é livre e a confiança não é calibrada, portanto ficam fora do percentual. Cada ID entra com a medida mais recente. O resumo conta as tentativas, falhas e tokens de todos os arquivos fornecidos, incluindo rodadas anteriores.

A latência mede a chamada ao provider, incluindo leitura da mídia, rede, validação e eventual segunda tentativa. Os percentis consideram os casos com resposta válida. Os 30 segundos do fluxo até a confirmação dependem da interface e persistência e precisam de teste ponta a ponta separado.

## Resultado medido em 24/11/2026

`gemini-3.5-flash-lite`, projeto Free. O primeiro lote completo teve 10 respostas válidas em 25 casos e 63 de 182 campos corretos (34,6%). O segundo lote completo, com o esquema remoto simplificado, teve 13 respostas válidas e 69 de 182 campos corretos (37,9%). Nos casos bem-sucedidos do segundo lote, 69 de 70 campos estavam corretos (98,6%). As seguintes medidas são do segundo lote completo:

| Modalidade | Respostas válidas | Campos corretos | Maior latência entre respostas válidas |
|---|---:|---:|---:|
| Foto | 5/10 | 34/70 | 10,56 s |
| Print | 1/3 | 0/35 | 13,04 s |
| Áudio | 3/6 | 21/42 | 3,33 s |
| Texto | 4/6 | 14/35 | 11,85 s |
| Total | 13/25 | 69/182 | 13,04 s |

O print bem-sucedido desse lote pedia esclarecer a direção e tinha zero lançamentos esperados. Um print com três lançamentos funcionou no teste inicial em 3,19 s. No segundo lote, houve 13 quantidades corretas, zero extras ou duplicações, 16 lançamentos ausentes e 7 de 10 perguntas esperadas reconhecidas. A mediana das respostas válidas foi 2,58 s. Houve 11 erros HTTP 503 e um timeout. O Gemini informou 17.178 tokens em 13 tentativas. As outras tentativas não devolveram metadados de tokens. O custo monetário registrado foi R$ 0 no plano Free.

Com a política final de uma segunda tentativa para 503, o reteste dirigido de quatro casos antes reprovados teve dois sucessos (uma nota e um texto) e dois timeouts (um print e um áudio). O Gemini informou 2.871 tokens em duas das cinco tentativas. O candidato `gemini-3.6-flash` teve dois sucessos em quatro casos e dois timeouts. O 3.5 Flash-Lite ficou como padrão pela menor latência observada e pela disponibilidade de respostas válidas nas quatro modalidades ao longo das rodadas.

As metas de 85% no corpus e de retorno consistente em até 15 segundos para a foto continuam pendentes. A latência do fluxo de confirmação não foi medida. Os JSONL locais guardam as métricas por caso e por tentativa, sem conteúdo bruto, chave ou resposta do provedor.
