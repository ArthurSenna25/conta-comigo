import { readFile } from "node:fs/promises";

const caminhos = process.argv.slice(2);
if (!caminhos.length) throw new Error("Passe um ou mais arquivos JSONL na ordem das rodadas.");
const casos = new Map();
const tentativas = [];
const falhas = [];
const modelos = new Set();
const rodadas = [];
for (const caminho of caminhos) {
  const amostra = [];
  for (const linha of (await readFile(caminho, "utf8")).split("\n").filter(Boolean)) {
    const caso = JSON.parse(linha);
    amostra.push(caso);
    modelos.add(caso.modelo);
    casos.set(caso.id, caso);
    tentativas.push(...caso.medicoes);
    if (caso.motivo !== "sucesso") falhas.push({ id: caso.id, motivo: caso.motivo });
  }
  rodadas.push({ arquivo: caminho, ...estabilidade(amostra),
    modalidades: Object.fromEntries(modalidades().map((modalidade) =>
      [modalidade, estabilidade(amostra.filter((caso) => caso.modalidade === modalidade))])),
  });
}
if (modelos.size !== 1) throw new Error("Resuma um modelo por vez. Selecione os arquivos JSONL correspondentes.");

function agregar(casos) {
  const soma = (f) => casos.reduce((total, caso) => total + f(caso), 0);
  const esperados = soma((c) => c.esperados);
  const campos = Object.keys(casos[0]?.acertos ?? {});
  const latencias = casos.filter((c) => c.motivo === "sucesso").map((c) => c.duracaoMs).sort((a, b) => a - b);
  const percentil = (p) => latencias[Math.ceil(latencias.length * p) - 1] ?? null;
  return {
    casos: casos.length, sucessos: latencias.length, esperados,
    acertos: Object.fromEntries(campos.map((campo) => [campo, soma((c) => c.acertos[campo])])),
    camposEsperados: esperados * campos.length,
    camposCorretos: soma((c) => Object.values(c.acertos).reduce((total, n) => total + n, 0)),
    quantidadeCorreta: soma((c) => Number(c.quantidadeCorreta)),
    ausentes: soma((c) => c.ausentes), adicionais: soma((c) => c.adicionais),
    duplicados: soma((c) => c.duplicados),
    perguntasEsperadas: soma((c) => Number(c.perguntaAtendida !== null)),
    perguntasCorretas: soma((c) => Number(c.perguntaAtendida === true)),
    latenciaMedianaMs: percentil(0.5), latenciaP95Ms: percentil(0.95), latenciaMaximaMs: percentil(1),
    acimaDe15Segundos: latencias.filter((ms) => ms > 15000).length,
  };
}

function modalidades() {
  return ["foto", "print", "audio", "texto"];
}

function estabilidade(amostra) {
  const validos = amostra.filter((caso) => caso.motivo === "sucesso");
  const chamadas = amostra.flatMap((caso) => caso.medicoes);
  const total = agregar(amostra);
  const comResposta = agregar(validos);
  const taxa = (numerador, denominador) => denominador ? numerador / denominador : null;
  const media = (registros) => taxa(registros.reduce((soma, r) => soma + r.duracaoMs, 0), registros.length);
  const status = (codigo) => chamadas.filter((m) => m.statusHttp === codigo).length;
  const timeout = (m) => m.motivo === "tempo" || m.statusHttp === 408 || m.statusHttp === 504;
  return {
    casos: amostra.length,
    sucessos: validos.length,
    taxaSucesso: taxa(validos.length, amostra.length),
    tentativas: chamadas.length,
    retries: chamadas.filter((m) => m.tentativa > 1).length,
    sucessosComRetry: validos.filter((caso) => caso.medicoes.some((m) => m.tentativa > 1)).length,
    http503: status(503),
    taxa503: taxa(status(503), chamadas.length),
    http429: status(429),
    taxa429: taxa(status(429), chamadas.length),
    tentativasSemStatusRegistrado: chamadas.filter((m) => !Object.hasOwn(m, "statusHttp")).length,
    timeoutsTentativa: chamadas.filter(timeout).length,
    timeoutsCaso: amostra.filter((caso) => caso.motivo === "tempo").length,
    mediaTentativaMs: media(chamadas),
    mediaSucessoMs: media(validos),
    mediaCasoMs: media(amostra),
    camposCorretos: total.camposCorretos,
    camposEsperados: total.camposEsperados,
    precisaoGeral: taxa(total.camposCorretos, total.camposEsperados),
    camposCorretosComResposta: comResposta.camposCorretos,
    camposEsperadosComResposta: comResposta.camposEsperados,
    precisaoComResposta: taxa(comResposta.camposCorretos, comResposta.camposEsperados),
    primeiraTentativaAcima8s: amostra.filter((caso) => caso.medicoes[0]?.duracaoMs > 8000).length,
    sucessosNaPrimeiraAcima8s: validos.filter((caso) =>
      caso.medicoes.length === 1 && caso.medicoes[0].duracaoMs > 8000).length,
    medicoesComTokens: chamadas.filter((m) => m.tokensTotais != null).length,
    tokens: chamadas.reduce((soma, m) => soma + (m.tokensTotais ?? 0), 0),
    custoCentavos: chamadas.reduce((soma, m) => soma + m.custoCentavos, 0),
  };
}

const ultimos = [...casos.values()];
console.log(JSON.stringify({
  modelo: [...modelos][0],
  total: agregar(ultimos),
  somenteComResposta: agregar(ultimos.filter((caso) => caso.motivo === "sucesso")),
  modalidades: Object.fromEntries(modalidades().map(
    (modalidade) => [modalidade, agregar(ultimos.filter((c) => c.modalidade === modalidade))],
  )),
  tentativas: tentativas.length,
  falhas,
  medicoesComTokens: tentativas.filter((m) => m.tokensTotais !== null).length,
  tokens: tentativas.reduce((total, m) => total + (m.tokensTotais ?? 0), 0),
  custoCentavos: tentativas.reduce((total, m) => total + m.custoCentavos, 0),
  rodadas,
}, null, 2));
