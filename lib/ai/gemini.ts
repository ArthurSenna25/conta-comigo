import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse, Part } from "@google/genai";
import { DataISO, IngestRequest } from "@/lib/contracts";
import type { AiProvider, ComCusto } from "@/lib/contracts";
import { ErroIa, type MotivoIa } from "@/lib/ai/erro";
import { validarMidia } from "@/lib/ai/midia";
import { ESQUEMA_CHAT, ESQUEMA_EXTRACAO, lerChat, lerExtracao, prepararChat } from "@/lib/ai/saidas";
import { INSTRUCAO_CHAT } from "@/prompts/chat";
import { instrucaoExtracao } from "@/prompts/extracao";

export { ErroIa, type MotivoIa } from "@/lib/ai/erro";
export const MODELO_GEMINI = "gemini-3.5-flash-lite";
const MODELOS_FREE = new Set([MODELO_GEMINI, "gemini-3.6-flash"]);
const TEMPO_TOTAL_MS = 20_000;
const MOTIVOS_BLOQUEIO = new Set(["SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "RECITATION", "SPII", "IMAGE_SAFETY"]);

export type TentativaIa = {
  modelo: string;
  operacao: "extracao" | "chat";
  tentativa: number;
};
export type MedicaoIa = TentativaIa & {
  duracaoMs: number;
  tokensEntrada: number | null;
  tokensSaida: number | null;
  tokensPensamento: number | null;
  tokensTotais: number | null;
  statusHttp: number | null;
  custoCentavos: 0;
  motivo: MotivoIa | "sucesso";
};
export type OpcoesGemini = {
  antesDaChamada?: (tentativa: TentativaIa) => void | Promise<void>;
  aoMedir?: (medicao: MedicaoIa) => void | Promise<void>;
};

export function modeloGeminiConfigurado(): string {
  const modelo = process.env.AI_MODEL ?? MODELO_GEMINI;
  if (!MODELOS_FREE.has(modelo)) throw new ErroIa("configuracao");
  return modelo;
}

function criarCliente() {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey || process.env.AI_PROVIDER !== "gemini" ||
      process.env.AI_GEMINI_FREE_TIER_CONFIRMED !== "true") throw new ErroIa("configuracao");
  return new GoogleGenAI({
    apiKey,
    vertexai: false,
    httpOptions: {
      baseUrl: "https://generativelanguage.googleapis.com",
      apiVersion: "v1beta",
      retryOptions: { attempts: 1 },
    },
  });
}

function statusHttp(erro: unknown): number | null {
  if (erro && typeof erro === "object" && "status" in erro && typeof erro.status === "number") {
    return erro.status;
  }
  return null;
}

function traduzirFalha(erro: unknown, sinal: AbortSignal): ErroIa {
  if (sinal.aborted) return new ErroIa("tempo");
  if (erro instanceof ErroIa) return erro;
  if (erro instanceof Error && ["TimeoutError", "AbortError"].includes(erro.name)) return new ErroIa("tempo");
  const status = statusHttp(erro);
  if (status === 429) return new ErroIa("cota");
  if (status === 408 || status === 504) return new ErroIa("tempo");
  if (status === 401 || status === 403 ||
      (status === 400 && erro instanceof Error && /API_KEY_INVALID|API key not valid/i.test(erro.message))) {
    return new ErroIa("autenticacao");
  }
  if (erro instanceof TypeError) return new ErroIa("rede");
  return new ErroIa("indisponivel");
}

function lerJson(resposta: GenerateContentResponse): unknown {
  if (resposta.promptFeedback?.blockReason) throw new ErroIa("bloqueio");
  const candidato = resposta.candidates?.[0];
  if (candidato?.finishReason && MOTIVOS_BLOQUEIO.has(candidato.finishReason)) throw new ErroIa("bloqueio");
  if (candidato?.finishReason !== "STOP") throw new ErroIa("resposta");
  const partes = candidato.content?.parts?.filter((parte) => !parte.thought);
  if (!partes?.length || partes.some((parte) => typeof parte.text !== "string")) throw new ErroIa("resposta");
  const texto = partes.map((parte) => parte.text).join("");
  try {
    return JSON.parse(texto) as unknown;
  } catch {
    throw new ErroIa("resposta");
  }
}

async function executarControle<T>(callback: ((dado: T) => void | Promise<void>) | undefined, dado: T) {
  try {
    await callback?.(dado);
  } catch (erro) {
    throw erro instanceof ErroIa ? erro : new ErroIa("controle");
  }
}

type Pedido<T> = {
  operacao: TentativaIa["operacao"];
  partes: Part[];
  instrucao: string;
  esquema: unknown;
  validar: (json: unknown) => T;
};

async function gerar<T>(pedido: Pedido<T>, opcoes: OpcoesGemini): Promise<ComCusto<T>> {
  const modelo = modeloGeminiConfigurado();
  const cliente = criarCliente();
  const sinal = AbortSignal.timeout(TEMPO_TOTAL_MS);
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    const info = { modelo, operacao: pedido.operacao, tentativa };
    if (sinal.aborted) throw new ErroIa("tempo");
    await executarControle(opcoes.antesDaChamada, info);
    const inicio = performance.now();
    let resposta: GenerateContentResponse | undefined;
    let resultado: T;
    let falha: ErroIa | undefined;
    let status: number | null = null;
    try {
      sinal.throwIfAborted();
      resposta = await cliente.models.generateContent({
        model: modelo,
        contents: [{ role: "user", parts: pedido.partes }],
        config: {
          systemInstruction: tentativa === 1 ? pedido.instrucao : pedido.instrucao +
            "\nA resposta anterior falhou na validação. Releia os dados e confira campos, limites e tipos. Responda de forma concisa.",
          responseMimeType: "application/json",
          responseJsonSchema: pedido.esquema,
          maxOutputTokens: pedido.operacao === "chat" ? 4096 : 16_384,
          abortSignal: sinal,
        },
      });
      resultado = pedido.validar(lerJson(resposta));
    } catch (erro) {
      falha = traduzirFalha(erro, sinal);
      status = statusHttp(erro);
    }
    const uso = resposta?.usageMetadata;
    await executarControle(opcoes.aoMedir, {
      ...info, duracaoMs: Math.round(performance.now() - inicio),
      tokensEntrada: uso?.promptTokenCount ?? null,
      tokensSaida: uso?.candidatesTokenCount ?? null,
      tokensPensamento: uso?.thoughtsTokenCount ?? null,
      tokensTotais: uso?.totalTokenCount ?? null,
      statusHttp: status ?? (resposta ? 200 : null),
      custoCentavos: 0, motivo: falha?.motivo ?? "sucesso",
    });
    if (!falha) return { resultado: resultado!, custoCentavos: 0 };
    // Repetir rede, bloqueios e 429 gastaria outra reserva sem reparar a causa.
    if (falha.motivo !== "resposta" || tentativa === 2) throw falha;
  }
  throw new ErroIa("resposta");
}

export function criarGeminiProvider(opcoes: OpcoesGemini = {}): AiProvider {
  return {
    async extrair(entrada, hoje) {
      const validada = IngestRequest.safeParse(entrada);
      if (!validada.success || !DataISO.safeParse(hoje).success) throw new ErroIa("entrada");
      const dado = validada.data;
      await validarMidia(dado);
      const partes: Part[] = [];
      if (dado.kind === "texto") {
        partes.push({ text: dado.texto });
      } else {
        const arquivo = dado.arquivo;
        partes.push({
          inlineData: {
            mimeType: arquivo.type === "audio/mp4" ? "audio/m4a" : arquivo.type,
            data: Buffer.from(await arquivo.arrayBuffer()).toString("base64"),
          },
        });
      }
      return gerar({
        operacao: "extracao", partes, esquema: ESQUEMA_EXTRACAO,
        instrucao: instrucaoExtracao(dado.kind, hoje), validar: (json) => lerExtracao(json, dado.kind),
      }, opcoes);
    },
    async responder(mensagens, contexto) {
      const { texto, fontes } = prepararChat(mensagens, contexto);
      return gerar({
        operacao: "chat", partes: [{ text: texto }], esquema: ESQUEMA_CHAT,
        instrucao: INSTRUCAO_CHAT, validar: (json) => lerChat(json, fontes),
      }, opcoes);
    },
  };
}
