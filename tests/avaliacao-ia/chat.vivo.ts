import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as esperar } from "node:timers/promises";
import { expect, it, vi } from "vitest";
import { criarGeminiProvider, ErroIa, modeloGeminiConfigurado, type MedicaoIa } from "@/lib/ai/gemini";
import { avaliarResposta, casosChat, contextoDaAvaliacao } from "./gabarito-chat";

vi.mock("server-only", () => ({}));

it("avalia 15 perguntas sintéticas no Gemini Free", async () => {
  if (process.env.AVALIAR_CHAT_GEMINI !== "sim" || modeloGeminiConfigurado() !== "gemini-3.5-flash-lite" ||
      process.env.AI_GEMINI_FREE_TIER_CONFIRMED !== "true") throw new Error("Confirme a avaliação local no Gemini Free.");
  const pasta = join("test-results", "avaliacao-chat");
  await mkdir(pasta, { recursive: true });
  const caminho = join(pasta, new Date().toISOString().replace(/[:.]/g, "-") + ".jsonl");
  console.info("Relatório:", caminho);
  let ultimaTentativa = -Infinity;
  let aprovados = 0;
  const medicoes: MedicaoIa[] = [];
  const filtro = process.env.AVALIACAO_CHAT_IDS?.split(",");
  const casos = filtro ? casosChat.filter((caso) => filtro.includes(caso.id)) : casosChat;
  if (!casos.length || filtro?.some((id) => !casosChat.some((caso) => caso.id === id))) throw new Error("ID de avaliação inválido.");
  const provider = criarGeminiProvider({
    async antesDaChamada() {
      await esperar(Math.max(0, 8000 - (performance.now() - ultimaTentativa)));
      ultimaTentativa = performance.now();
    },
    aoMedir: (medicao) => { medicoes.push(medicao); },
  });
  for (const caso of casos) {
    const contexto = await contextoDaAvaliacao(caso);
    medicoes.length = 0;
    const inicio = performance.now();
    try {
      const { resultado, custoCentavos } = await provider.responder([{ role: "user", conteudo: caso.pergunta }], contexto);
      const avaliacao = avaliarResposta(caso, resultado, contexto.kb);
      if (avaliacao.aprovado) aprovados++;
      await appendFile(caminho, JSON.stringify({ id: caso.id, duracaoMs: Math.round(performance.now() - inicio),
        resultado, custoCentavos, medicoes, ...avaliacao }) + "\n");
    } catch (erro) {
      const motivo = erro instanceof ErroIa ? erro.motivo : "inesperado";
      await appendFile(caminho, JSON.stringify({ id: caso.id, motivo, duracaoMs: Math.round(performance.now() - inicio), medicoes }) + "\n");
      if (["cota", "autenticacao", "configuracao", "inesperado"].includes(motivo)) break;
    }
  }
  expect(aprovados).toBe(casos.length);
});
