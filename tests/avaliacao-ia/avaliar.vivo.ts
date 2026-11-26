import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as esperar } from "node:timers/promises";
import { expect, it, vi } from "vitest";
import { IngestRequest, IngestResponse } from "@/lib/contracts";
import { criarGeminiProvider, ErroIa, modeloGeminiConfigurado, type MedicaoIa } from "@/lib/ai/gemini";
import { casos, pontuar, type Caso } from "./metricas";

vi.mock("server-only", () => ({}));
const hoje = "2026-11-24";
const diretorio = join(process.cwd(), "test-results", "avaliacao-ia");

async function entrada(caso: Caso) {
  if (caso.modalidade === "texto") return IngestRequest.parse({ kind: "texto", texto: caso.conteudo });
  const audio = caso.modalidade === "audio";
  const nome = caso.id + (audio ? ".wav" : ".png");
  const bytes = await readFile(join(process.cwd(), "tests", "avaliacao-ia", "midia", nome));
  const arquivo = new File([Uint8Array.from(bytes)], nome, { type: audio ? "audio/wav" : "image/png" });
  return IngestRequest.parse({ kind: audio ? "audio" : "imagem", arquivo });
}

function selecionar() {
  const ids = process.env.AVALIACAO_IA_IDS?.split(",").map((id) => id.trim());
  const inicio = process.env.AVALIACAO_IA_INICIO;
  const posicao = inicio ? casos.findIndex((c) => c.id === inicio) : 0;
  if (posicao < 0 || ids?.some((id) => !casos.some((c) => c.id === id))) throw new Error("ID de fixture desconhecido");
  const selecionados = casos.slice(posicao).filter((c) => !ids || ids.includes(c.id));
  if (!selecionados.length) throw new Error("Nenhuma fixture selecionada");
  return selecionados;
}

it("avalia as extrações reais do Gemini com as fixtures sintéticas", async () => {
  if (process.env.AVALIAR_GEMINI !== "sim") throw new Error("Para usar a cota externa, confirme AVALIAR_GEMINI=sim.");
  const selecionados = selecionar();
  const intervalo = Number(process.env.AVALIACAO_IA_INTERVALO_MS ?? 12000);
  if (!Number.isSafeInteger(intervalo) || intervalo < 0 || intervalo > 60000) throw new Error("Intervalo inválido (0 a 60000 ms)");

  if (process.env.AI_GEMINI_FREE_TIER_CONFIRMED !== "true" || !process.env.AI_API_KEY || process.env.AI_PROVIDER !== "gemini") {
    throw new Error("A avaliação precisa do projeto Gemini Free confirmado, chave de servidor e AI_PROVIDER=gemini.");
  }

  await mkdir(diretorio, { recursive: true });
  const arquivo = join(diretorio, new Date().toISOString().replace(/[:.]/g, "-") + ".jsonl");
  const medicoes: MedicaoIa[] = [];
  const modelo = modeloGeminiConfigurado();
  const provedor = criarGeminiProvider({ aoMedir: (medicao) => { medicoes.push(medicao); } });
  console.info("Relatório:", arquivo);
  let falhas = 0;
  let executados = 0;
  for (const caso of selecionados) {
    if (executados) await esperar(intervalo);
    const pedido = await entrada(caso);
    medicoes.length = 0;
    const inicio = performance.now();
    let motivo: string = "sucesso";
    let resposta: IngestResponse | undefined;
    let custoCentavos: number | null = null;
    try {
      const retorno = await provedor.extrair(pedido, hoje);
      resposta = IngestResponse.parse(retorno.resultado);
      custoCentavos = retorno.custoCentavos;
    } catch (e) {
      motivo = e instanceof ErroIa ? e.motivo : "inesperado";
      falhas++;
    }
    const duracaoMs = Math.round(performance.now() - inicio);
    const linha = { id: caso.id, modalidade: caso.modalidade, modelo, hoje, motivo,
      duracaoMs, custoCentavos, medicoes, ...pontuar(caso, resposta) };
    await appendFile(arquivo, JSON.stringify(linha) + "\n");
    console.info(caso.id, motivo, duracaoMs + " ms");
    executados++;
    if (["cota", "cota_provedor", "configuracao", "autenticacao", "rede", "inesperado"].includes(motivo)) break;
  }
  expect({ falhas, executados }).toEqual({ falhas: 0, executados: selecionados.length });
});
