# Avaliação jurídica do chat (AMEACAS #13)

O [gabarito das perguntas](casos-chat.json) registra pergunta, atividade, abertura, data de referência, resposta esperada por critérios textuais, fundamento, fontes e indicador. Todos os casos usam dados fictícios com receita inicial de R$ 1.000,00, receita de R$ 1.250,00 e despesa de R$ 350,00 em novembro de 2026. O mesmo engine da API calcula valores e vencimentos. O teste determinístico fornece a seleção esperada, confere fontes e trechos, valida a resposta e verifica que alertas indisponíveis ficam vazios.

O corpus atual tem 27 casos. A base revisada em 28/11 ainda não foi avaliada no Gemini. A janela anterior encerrou e nova avaliação real depende de autorização expressa de Arthur. Com essa autorização, confirme que o projeto continua Free e tem cota. A chave deve estar no ambiente local e `AI_PROVIDER` deve ser `gemini`.

```powershell
$env:AVALIAR_CHAT_GEMINI='sim'
$env:AI_GEMINI_FREE_TIER_CONFIRMED='true'
$env:AI_MODEL='gemini-3.5-flash-lite'
node --env-file=.env.local node_modules/vitest/vitest.mjs run --config tests/avaliacao-ia/vitest.chat.config.mts
```

Use `AVALIACAO_CHAT_IDS` com IDs separados por vírgula para repetir casos específicos. Entre tentativas há pelo menos oito segundos. O ensaio para ante 429 ou falha de configuração e autenticação. Executa o provider local, sem banco e sem acessar produção. Os JSONL locais em `test-results/avaliacao-chat` registram saída sintética, aprovação, status do provedor, tokens, custo e latência. O tempo por caso inclui o espaçamento. As estatísticas de latência do provedor usam apenas as tentativas HTTP 200.

A aprovação exige os trechos e valores esperados, a lista exata de fontes e a presença do trecho oficial no texto devolvido. Fora do corpus, exige a orientação para consultar um contador e nenhum número inventado. Uma fonte adicional pode reprovar o caso mesmo quando seu trecho é pertinente. O Gemini faz seleção; o servidor compõe as afirmações legais e os indicadores. A avaliação mede relevância e cobertura dessa seleção junto da fidelidade das referências. Ela não mede a disponibilidade do Supabase ou do endpoint em produção.

## Observado em 25/11/2026

No primeiro lote, o Gemini respondeu 15 perguntas e aprovou 11. Ocorreu um HTTP 503, recuperado na segunda tentativa. As 16 tentativas informaram 6.929 tokens. A mediana das 15 respostas HTTP 200 foi 1,89 s e o p95, 7,12 s. Os quatro casos reprovados foram excesso retroativo (sem trecho), excesso no ano de abertura (fonte extra), próximo vencimento (data correta com uma fonte adicional ao gabarito original) e limite do perfil (sem indicador). Após o ajuste do prompt e do gabarito do vencimento, os quatro passaram no reteste, com 2.316 tokens, mediana de 1,36 s e p95 de 5,85 s.

O lote completo com o prompt final aprovou **13 de 15**. Passaram limite anual, limite proporcional, mês de abertura, retroatividade fora do ano de abertura, DAS de comércio, serviços e atividade mista, regra de vencimento, próximo vencimento, saldo, limite do perfil, pergunta sem cobertura e recusa de simulação. No caso de excesso de até 20% no ano completo, um HTTP 503 foi seguido por timeout. No caso de excesso no primeiro ano, a explicação foi correta e citou um trecho proporcional adicional, que reprovou pela lista exata de fontes. Um segundo HTTP 503, na pergunta sobre DAS de serviços, foi recuperado no retry.

O lote final fez 17 tentativas e recebeu 14 respostas HTTP 200. O Gemini informou 7.460 tokens. A mediana das tentativas HTTP 200 foi 1,08 s e o p95, 5,13 s. As três rodadas somaram 37 tentativas e 16.705 tokens informados, sem HTTP 429. Custo registrado no Free de R$ 0. Nenhuma das respostas renderizadas apresentou afirmação legal sem fonte. O timeout conta como falha de disponibilidade e a seleção intermitente de fonte adicional conta como falha de adequação.

## Observado em 26/11/2026 (perguntas de ouro)

A revisão anterior da KB da LC nº 238/2026 e da reforma tributária aprovou **6 de 6** perguntas de ouro no Gemini Free. Houve 5 chamadas HTTP 200 sem retry e uma resposta local para a pergunta fora do escopo. O caso `sem-base` usa nota fiscal em 2027, tema que o corpus atual não cobre.
