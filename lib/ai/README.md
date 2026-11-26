# IA do Conta Comigo

`criarGeminiProvider()` implementa o `AiProvider` no servidor usando o SDK oficial `@google/genai`. O modelo padrão é `gemini-3.5-flash-lite`, estável e voltado a extração, com texto, imagem, áudio e saída estruturada. O catálogo autenticado confirmou `generateContent` para a chave de avaliação. [Modelo](https://aistudio.google.com/docs/models/gemini-3.5-flash-lite) · [Preços](https://aistudio.google.com/docs/pricing#gemini-3-5-flash-lite)

## Configuração e validação

### Diagnóstico na Vercel

Em **Production**, confira a presença de `AI_API_KEY` (ou `GEMINI_API_KEY`), `AI_PROVIDER=gemini`, `AI_GEMINI_FREE_TIER_CONFIRMED=true` e, para fixar o modelo oficial, `AI_MODEL=gemini-3.5-flash-lite` (ou `GEMINI_MODEL`). As variáveis `AI_*` preenchidas têm precedência sobre os aliases. Use apenas uma chave de servidor vinculada ao projeto Free confirmado no AI Studio. A Vercel aplica alterações de variáveis ao próximo deploy. [Variáveis na Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables)

Nos Runtime Logs, filtre o POST de `/api/chat` e procure `gemini_falha`. O evento contém operação, etapa, modelo aprovado, tentativa, status HTTP, motivo e duração. `chave_ausente`, `provedor_nao_configurado`, `free_nao_confirmado` e `modelo_invalido` falham antes do SDK. `modelo_indisponivel` identifica HTTP 404 do SDK. Em `etapa=reserva`, confira `SUPABASE_SECRET_KEY`, a função `reservar_uso_ia` e os limites `AI_DAILY_CALLS_GLOBAL`, `AI_DAILY_CALLS_USER`, `DEMO_AI_DAILY_CALLS` e `AI_DAILY_BUDGET_CENTS`. Se houver `chat_falha` em `etapa=contexto`, investigue a leitura do banco ou da base jurídica. Valide pelo menos uma pergunta sintética da demo após o deploy autorizado.

- Use Node 24 e pnpm 12.23.0. Rode `pnpm install --frozen-lockfile`, `pnpm check` e `pnpm dev`. Para build com a flag local de mock, rode `$env:NEXT_PUBLIC_USE_MOCKS='false'; pnpm build` em uma sessão PowerShell separada.
- Para o modo mock local, use `NEXT_PUBLIC_USE_MOCKS=true`. O resultado é o fixture compartilhado. Em produção a porta de mock bloqueia essa configuração.
- Para o Gemini, configure no servidor `AI_PROVIDER=gemini`, `AI_API_KEY` e `AI_GEMINI_FREE_TIER_CONFIRMED=true` depois de verificar o plano **Free** do projeto no AI Studio. `AI_MODEL` é opcional e aceita `gemini-3.5-flash-lite` ou `gemini-3.6-flash`. A escolha é explícita e cada processo usa um modelo, sem fallback. A declaração de plano é operacional. O catálogo confirma acesso ao modelo e o painel confirma faturamento e cotas por projeto. [Faturamento](https://aistudio.google.com/docs/billing) · [Cotas](https://aistudio.google.com/rate-limit) · [Preços do 3.6 Flash](https://aistudio.google.com/docs/pricing#gemini-3.6-flash)
- Envie somente conteúdo sintético ou adequadamente anonimizado ao Gemini Free. O Google pode usar as entradas e saídas para melhorar produtos e submetê-las à revisão humana. Uso com clientes reais depende da revisão de privacidade, termos, transferência internacional e condições de processamento aprovadas pelo time. [Termos da API Gemini](https://aistudio.google.com/docs/terms)

## Endpoint e mídia

`POST /api/ingest` recebe `FormData` da mesma origem. Envie `kind=texto` com `texto`, ou `kind=imagem`/`kind=audio` com `arquivo`. No navegador, deixe `fetch` definir o cabeçalho multipart. Sucesso HTTP 200 devolve `IngestResponse`. Falha devolve `ErroResposta` com código e mensagem para a interface oferecer preenchimento manual.

```js
const dados = new FormData();
dados.set("kind", "texto");
dados.set("texto", "Hoje vendi R$ 1.200,50 no cartão e paguei R$ 300 de frete.");
const res = await fetch("/api/ingest", { method: "POST", body: dados });
const retorno = await res.json();
```

Para conferir as quatro entradas no endpoint local em modo mock, use os exemplos sintéticos a partir da raiz. Ajuste a URL à porta impressa por `pnpm dev`.

```powershell
$url = 'http://localhost:3000'
curl.exe -H "Origin: $url" -F 'kind=texto' -F 'texto=Hoje vendi 50 reais no Pix.' "$url/api/ingest"
curl.exe -H "Origin: $url" -F 'kind=imagem' -F 'arquivo=@tests/avaliacao-ia/midia/nota-01.png;type=image/png' "$url/api/ingest"
curl.exe -H "Origin: $url" -F 'kind=imagem' -F 'arquivo=@tests/avaliacao-ia/midia/print-01.png;type=image/png' "$url/api/ingest"
curl.exe -H "Origin: $url" -F 'kind=audio' -F 'arquivo=@tests/avaliacao-ia/midia/audio-01.wav;type=audio/wav' "$url/api/ingest"
```

Para foto ou print, envie JPEG, PNG ou WebP de até 5 MiB conforme o contrato. Na Vercel Hobby, o corpo multipart inteiro deve caber em 4,5 MB. A interface deve reencodar a imagem sem metadados, redimensionar para até 1.600 px e limitar o arquivo a 4 MB, com tratamento para HTTP 413. Para áudio, o contrato aceita WAV, WebM, Ogg, MPEG e MP4 de áudio até 2 MiB. O MP4 de áudio é enviado como M4A ao provedor. Aproximadamente 60 segundos dependem da taxa de bits e amostragem. Prefira gravação comprimida onde houver suporte. A avaliação real usa WAV. Teste os codecs do gravador em navegadores móveis antes da demonstração. [Limites da Vercel](https://vercel.com/docs/functions/limitations#request-body-size) · [Formatos de áudio do Gemini](https://aistudio.google.com/docs/audio#supported-formats)

Os validadores conferem tamanho, MIME declarado e assinaturas de mídia e rejeitam EXIF detectável nas imagens. A reencodificação no cliente completa a remoção de metadados. O servidor encaminha o conteúdo em memória, sem nome de arquivo no pedido ao Gemini. Os prompts ficam em `prompts/`, em campo separado da entrada e sem ferramentas. A saída estruturada do Gemini é revalidada com Zod. A confiança é uma estimativa declarada pelo modelo. O contrato exige receita ou despesa, portanto operações de direção desconhecida viram perguntas. Itens de nota ficam resumidos na descrição, sem campo próprio, e a transcrição de áudio integra a interpretação sem campo de saída próprio.

## Integração com Arthur

- A rota reaproveita o client SSR, `getClaims()`, o perfil e os aceites de termos, privacidade e `envio_ia` na versão vigente. Tudo isso agora é o portão único `exigirAcessoApi(req, { ia: true })`, que também aplica o teto de `tetoDiarioIaCentavos` (0 desativa a IA, 429). Em modo real a rota reserva uma chamada por tentativa no banco antes de enviar ao Gemini; sem `AI_DAILY_CALLS_GLOBAL` válido a reserva nega. A avaliação sintética exercita o provider diretamente.
- A reserva está em `app/api/ingest/reserva.ts` e é passada a `criarProcessarIngestao(reservarTentativa)`. Ela toma UMA chamada por tentativa (inclusive o retry e com custo zero) pelo RPC atômico `reservar_uso_ia` (`lib/db/uso-ia.ts`, dia de São Paulo, limite por usuário e global). Limites por ambiente, só no servidor: `AI_DAILY_CALLS_USER` (padrão 30), `DEMO_AI_DAILY_CALLS` (padrão 15, a demo usa o menor dos dois) e `AI_DAILY_CALLS_GLOBAL` (sem padrão: ausente ou inválido nega). Reserva negada devolve 429 `limite_ia`; falha do controle, 503. A chamada ao RPC usa `SUPABASE_SECRET_KEY`, que só serve para isso em `lib/db/uso-ia.ts`. Entrada inválida não consome reserva, porque ela só acontece depois da leitura e validação do corpo.
- `ComCusto.custoCentavos` é compatível com o contador de centavos do projeto e vale zero no plano Free. `aoMedir` informa tokens de entrada, saída e raciocínio, total, duração, status HTTP e motivo por tentativa. Tokens podem faltar quando o provedor falha. Nenhum dado de conteúdo precisa ir para os logs. Uma saída inválida ou HTTP 503 pode ter uma segunda tentativa no mesmo modelo, com reserva própria e dentro do prazo de 20 segundos. Cota, rede, bloqueio e indisponibilidade retornam erro e preservam o fluxo manual.
- Para chat, o Arthur fornece `ContextoChat` já calculado pelo engine e trechos selecionados da base legal. A infraestrutura compartilhada deriva as fontes dos trechos recebidos, valida seus índices e aplica `ChatResponse`. A entrada enviada ao Gemini omite identificador e nome do perfil. Políticas do chat, seleção da base e montagem de contexto são responsabilidade da integração.
- Na interface, mantenha o preenchimento manual disponível em caso de cota, timeout, indisponibilidade ou falha na extração. Trate HTTP 413 antes de tentar ler o JSON, pois a Vercel pode rejeitar o upload antes de executar a rota. Renderize os textos retornados pela IA como texto simples.

## Avaliação

Veja [a suíte sintética](../../tests/avaliacao-ia/README.md) para chamar o provedor real e medir precisão e latência sem banco de dados.
