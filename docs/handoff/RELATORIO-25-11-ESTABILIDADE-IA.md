# Relatório de estabilidade da IA · 25/11/2026

## Status do código

Branch `feat/gui-estabilidade-ia` sobre a `main` atualizada. O chat diferencia a cota interna diária do HTTP 429 do Gemini e dá orientações específicas para timeout, conexão e indisponibilidade. A resposta do chat continua em `ErroResposta`, com HTTP 429 para limite e HTTP 503 para as falhas de disponibilidade, inclusive timeout. Portão, reserva atômica, limites e configurações de produção permanecem os do aplicativo. Consulte o [guia do chat](../../app/api/chat/README.md) para os estados da interface e preenchimento manual.

[Pull request da branch no GitHub](https://github.com/ArthurSenna25/conta-comigo/pulls?q=is%3Apr+head%3Afeat%2Fgui-estabilidade-ia)

## Verificações

- `pnpm check`: 551 testes aprovados em 46 arquivos.
- `pnpm build`: aprovado com mocks desligados.
- Testes específicos de chat, Gemini e portão: 52 aprovados. Incluem HTTP 429 interno e externo, HTTP 503, conexão e timeout.
- Avaliações reais em ambiente local com mídias sintéticas e projeto Free. As chamadas não passam pela reserva do aplicativo e consomem a cota compartilhada do projeto. Relatórios JSONL originais preservados em `test-results/avaliacao-ia`.

## Método

Os totais, médias e precisões saem dos JSONL. Uma tentativa é cada registro em `medicoes`, incluindo retry e falhas. As taxas HTTP dividem respostas 503 ou 429 por todas as tentativas. São informados timeouts de tentativa e de caso final separadamente. A média dos casos considera o tempo total do caso, incluindo retry e espera interna, e exclui o intervalo entre fixtures. Precisão válida divide campos corretos pelos campos esperados dos casos com resposta válida. A precisão geral inclui também os campos esperados em casos com falha. Quando não há campos esperados, a precisão fica sem denominador.

## Flash-Lite · duas janelas em horário de Brasília

Os arquivos são `2026-11-24T16-49-46-347Z.jsonl` e `2026-11-26T01-32-48-243Z.jsonl`. Os dois lotes cobrem os mesmos 25 casos. Em 25/11 a política de timeout permaneceu a referência de 20 s.

| Janela / modalidade | Casos válidos | Tentativas (retries) | HTTP 503 | HTTP 429 | Timeouts tentativa/caso | Médias em s (tentativa / sucesso / caso) | Precisão válida | Precisão geral | Tokens |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 24/11 13h49 | 15/25 (60,0%) | 31 (6) | 12 (38,7%) | 0 (0,0%) | 4/4 | 5,23 / 2,48 / 6,67 | 97/98 (99,0%) | 97/182 (53,3%) | 19.866 |
| ↳ foto | 5/10 (50,0%) | 12 (2) | 3 (25,0%) | 0 (0,0%) | 4/4 | 8,28 / 3,35 / 10,09 | 34/35 (97,1%) | 34/70 (48,6%) | 10.041 |
| ↳ print | 2/3 (66,7%) | 4 (1) | 2 (50,0%) | 0 (0,0%) | 0/0 | 4,40 / 2,68 / 6,12 | 21/21 (100,0%) | 21/35 (60,0%) | 4.208 |
| ↳ audio | 2/6 (33,3%) | 9 (3) | 7 (77,8%) | 0 (0,0%) | 0/0 | 3,75 / 1,82 / 6,00 | 7/7 (100,0%) | 7/42 (16,7%) | 1.564 |
| ↳ texto | 6/6 (100,0%) | 6 (0) | 0 (0,0%) | 0 (0,0%) | 0/0 | 1,90 / 1,90 / 1,90 | 35/35 (100,0%) | 35/35 (100,0%) | 4.053 |
| 25/11 22h32 | 25/25 (100,0%) | 25 (0) | 0 (0,0%) | 0 (0,0%) | 0/0 | 3,94 / 3,94 / 3,94 | 178/182 (97,8%) | 178/182 (97,8%) | 35.862 |
| ↳ foto | 10/10 (100,0%) | 10 (0) | 0 (0,0%) | 0 (0,0%) | 0/0 | 3,99 / 3,99 / 3,99 | 66/70 (94,3%) | 66/70 (94,3%) | 20.108 |
| ↳ print | 3/3 (100,0%) | 3 (0) | 0 (0,0%) | 0 (0,0%) | 0/0 | 4,63 / 4,63 / 4,63 | 35/35 (100,0%) | 35/35 (100,0%) | 6.331 |
| ↳ audio | 6/6 (100,0%) | 6 (0) | 0 (0,0%) | 0 (0,0%) | 0/0 | 3,49 / 3,49 / 3,49 | 42/42 (100,0%) | 42/42 (100,0%) | 5.334 |
| ↳ texto | 6/6 (100,0%) | 6 (0) | 0 (0,0%) | 0 (0,0%) | 0/0 | 3,94 / 3,94 / 3,94 | 35/35 (100,0%) | 35/35 (100,0%) | 4.089 |

O custo registrado foi **R$ 0** em cada modalidade e lote. Houve metadados de tokens em 15 de 31 tentativas na tarde de 24/11 e em 25 de 25 na noite de 25/11. No lote da tarde, um caso foi recuperado em seis retries. Na rodada noturna, as dez fotos geraram resposta e quatro dos 70 campos de foto divergiram do gabarito. A disponibilidade variou entre as janelas. Os lotes, em dias e horários diferentes, não isolam o horário como causa.

## Comparação com o 3.6 Flash

Em 25/11 às 22h39, o 3.6 Flash rodou seis casos, com 30 s entre casos e a mesma política de timeout. O arquivo é `2026-11-26T01-39-21-471Z.jsonl`. Foram sete tentativas das 16 disponíveis na consulta inicial, incluindo um retry. O lote terminou com seis falhas em seis casos. O custo registrado em ambos os modelos foi R$ 0.

| Modelo / modalidade | Casos válidos | Tentativas (retries) | HTTP 503 | HTTP 429 | Timeouts tentativa/caso | Médias em s (tentativa / sucesso / caso) | Precisão válida | Precisão geral | Tokens reportados |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 3.5 Flash-Lite · mesmos seis casos | 6/6 (100%) | 6 (0) | 0 (0%) | 0 (0%) | 0/0 | 3,60 / 3,60 / 3,60 | 69/70 (98,6%) | 69/70 (98,6%) | 9.113 |
| 3.6 Flash | 0/6 (0%) | 7 (1) | 2 (28,6%) | 0 (0%) | 5/5 | 15,30 / — / 17,98 | — | 0/70 (0%) | — |
| ↳ foto | 0/2 (0%) | 3 (1) | 2 (66,7%) | 0 (0%) | 1/1 | 9,02 / — / 13,91 | — | 0/14 (0%) | — |
| ↳ print | 0/1 (0%) | 1 (0) | 0 (0%) | 0 (0%) | 1/1 | 20,01 / — / 20,01 | — | 0/21 (0%) | — |
| ↳ áudio | 0/2 (0%) | 2 (0) | 0 (0%) | 0 (0%) | 2/2 | 20,01 / — / 20,01 | — | 0/21 (0%) | — |
| ↳ texto | 0/1 (0%) | 1 (0) | 0 (0%) | 0 (0%) | 1/1 | 20,01 / — / 20,01 | — | 0/14 (0%) | — |

As sete tentativas do 3.6 ficaram sem metadados de tokens. Isso deixa o consumo em tokens desconhecido. O 3.6 também tem uma cota diária bem menor, de 20 chamadas. A comparação favorece manter o Flash-Lite como padrão e o preenchimento manual como alternativa para a demo. A amostra é pequena e os modelos foram medidos em sequência na mesma noite. Os 19 casos restantes ficam para depois da renovação de cota.

## Análise do corte de 8 segundos

A releitura dos JSONL mostrou cinco primeiras tentativas acima de 8 s na tarde de 24/11, quatro fotos e um áudio. Nenhum primeiro resultado válido dessas duas janelas levou mais de 8 s. A rodada noturna não teve primeira tentativa acima do corte. Esses dados sugerem que um corte inicial poderia encurtar esperas em uma janela ruim, mas não medem quantas chamadas seriam recuperadas ou perdidas com uma política diferente. Na política atual, timeout encerra o caso. Um experimento com segunda tentativa após timeout precisaria medir ganho por modalidade dentro dos mesmos 20 s e contabilizar a chamada adicional.

## Decisões e risco de cota

O provider atual usa um prazo total de 20 s nas operações de chat e ingestão. A primeira tentativa pode consumir esse prazo. Há no máximo um retry, com a mesma reserva por tentativa, quando a saída falha na validação ou ocorre HTTP 503, desde que restem pelo menos 6 s antes da espera de 750 ms para 503. Timeout, 429 e falha de rede encerram a operação. O handler tem limite de 30 s na plataforma, incluindo a preparação feita antes do provider.

Pelos números confirmados no AI Studio durante esta execução, o Flash-Lite tem 15 RPM, 500 RPD e 250.000 TPM, e o 3.6 Flash tem 5 RPM, 20 RPD e 250.000 TPM. A consulta informou 406 requisições diárias restantes no Lite e 16 no 3.6. As 40 chamadas da demo contam dentro das 300 globais/dia do app. Os contadores internos são diários e não limitam picos por minuto ou tokens. Jurados concorrentes compartilham as cotas do projeto e cada retry também conta. As janelas diárias do app e do Gemini usam fusos diferentes. [Cotas e renovação do Gemini](https://aistudio.google.com/docs/rate-limits)

## Próximo item

No checkpoint de 27/11 às 12h, revisar os resultados com Arthur. Para o QA em celular real de 28/11, verificar com Frigeri os estados de espera, 429, 503 e preenchimento manual. Qualquer ajuste de timeout ou fallback entre modelos exige nova evidência e alinhamento com Arthur. A janela de troca de modelo encerra em 28/11, com freeze em 29/11 às 18h e entrega em 30/11 às 18h.

Para repetir a referência em uma janela complementar, por exemplo de manhã, execute da raiz em PowerShell, depois de confirmar o plano e a margem de cota.

```powershell
$env:AVALIAR_GEMINI='sim'
$env:AI_GEMINI_FREE_TIER_CONFIRMED='true'
$env:AI_MODEL='gemini-3.5-flash-lite'
$env:AVALIACAO_IA_INTERVALO_MS='12000'
Remove-Item Env:AVALIACAO_IA_IDS,Env:AVALIACAO_IA_INICIO -ErrorAction SilentlyContinue
node tests/avaliacao-ia/executar.mjs
$ultimo = Get-ChildItem test-results/avaliacao-ia/*.jsonl | Sort-Object Name | Select-Object -Last 1
node tests/avaliacao-ia/resumir.mjs $ultimo.FullName
```

Depois da renovação do 3.6 Flash, siga com um lote por janela de cota, confirmando no painel requisições restantes suficientes para até duas tentativas por caso e margem para outros usos. Configure o ambiente da mesma forma, troque o modelo e o intervalo e rode apenas um dos valores de IDs por vez.

```powershell
$env:AI_MODEL='gemini-3.6-flash'
$env:AVALIACAO_IA_INTERVALO_MS='30000'
# Lote 2, até 16 chamadas
$env:AVALIACAO_IA_IDS='nota-02,nota-03,nota-04,nota-05,nota-06,nota-07,nota-09,nota-10'
node tests/avaliacao-ia/executar.mjs
# Lote 3, em uma nova janela de cota, até 16 chamadas
# $env:AVALIACAO_IA_IDS='print-02,print-03,texto-02,texto-03,texto-04,texto-05,texto-06,audio-02'
# node tests/avaliacao-ia/executar.mjs
# Lote 4, em outra janela, até 6 chamadas
# $env:AVALIACAO_IA_IDS='audio-03,audio-05,audio-06'
# node tests/avaliacao-ia/executar.mjs
```
