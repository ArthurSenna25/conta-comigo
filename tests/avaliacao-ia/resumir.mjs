import { readFile } from "node:fs/promises";

const caminhos = process.argv.slice(2);
if (!caminhos.length) throw new Error("Passe um ou mais arquivos JSONL na ordem das rodadas.");
const casos = new Map();
const tentativas = [];
const falhas = [];
const modelos = new Set();
for (const caminho of caminhos) {
  for (const linha of (await readFile(caminho, "utf8")).split("\n").filter(Boolean)) {
    const caso = JSON.parse(linha);
    modelos.add(caso.modelo);
    casos.set(caso.id, caso);
    tentativas.push(...caso.medicoes);
    if (caso.motivo !== "sucesso") falhas.push({ id: caso.id, motivo: caso.motivo });
  }
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

const ultimos = [...casos.values()];
console.log(JSON.stringify({
  modelo: [...modelos][0],
  total: agregar(ultimos),
  modalidades: Object.fromEntries(["foto", "print", "audio", "texto"].map(
    (modalidade) => [modalidade, agregar(ultimos.filter((c) => c.modalidade === modalidade))],
  )),
  tentativas: tentativas.length,
  falhas,
  medicoesComTokens: tentativas.filter((m) => m.tokensTotais !== null).length,
  tokens: tentativas.reduce((total, m) => total + (m.tokensTotais ?? 0), 0),
  custoCentavos: tentativas.reduce((total, m) => total + m.custoCentavos, 0),
}, null, 2));
