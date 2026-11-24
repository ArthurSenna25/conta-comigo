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
