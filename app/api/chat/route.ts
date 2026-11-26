import { exigirAcessoApi } from "@/actions/portao-api";
import { carregarContexto } from "@/app/api/chat/contexto";
import { selecionarTrechos } from "@/app/api/chat/conhecimento";
import { reservarTentativa } from "@/app/api/ingest/reserva";
import { criarGeminiProvider, ErroIa } from "@/lib/ai/gemini";
import { ChatRequest, ChatResponse } from "@/lib/contracts";
import { mockAiProvider, mockDashboard, mockPerfil } from "@/lib/contracts/mocks";
import { MENSAGEM_IA_SOMENTE_DEMO, respostaErro } from "@/lib/security/portao-api";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_JSON = 64 * 1024;

async function lerPedido(req: Request): Promise<unknown> {
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json" || !req.body) {
    return null;
  }
  const leitor = req.body.getReader();
  const dados = new Uint8Array(MAX_JSON);
  let tamanho = 0;
  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(dados.subarray(0, tamanho))) as unknown;
      if (tamanho + value.byteLength > MAX_JSON) {
        void leitor.cancel().catch(() => {});
        return null;
      }
      dados.set(value, tamanho);
      tamanho += value.byteLength;
    }
  } catch {
    return null;
  } finally {
    leitor.releaseLock();
  }
}

export async function POST(req: Request): Promise<Response> {
  const acesso = await exigirAcessoApi(req, { ia: true });
  if (acesso instanceof Response) return acesso;
  // O Free só pode receber dados sintéticos. A conta é identificada por claims verificadas.
  if (!acesso.mock && !acesso.demo) return respostaErro("proibido", MENSAGEM_IA_SOMENTE_DEMO);
  const entrada = ChatRequest.safeParse(await lerPedido(req));
  if (!entrada.success) return respostaErro("invalido");

  let etapa: "contexto" | "resposta" = "contexto";
  const inicio = performance.now();
  try {
    const { mensagens } = entrada.data;
    if (acesso.mock) {
      const { resultado } = await mockAiProvider.responder(mensagens, { perfil: mockPerfil, dashboard: mockDashboard, kb: [] });
      return Response.json(ChatResponse.parse(resultado), { headers: { "cache-control": "no-store" } });
    }
    const kb = await selecionarTrechos(mensagens.at(-1)?.conteudo ?? "");
    const contexto = await carregarContexto(acesso.userId, kb);
    if (!contexto) return respostaErro("nao_encontrado");
    etapa = "resposta";
    const provider = criarGeminiProvider({ antesDaChamada: () => reservarTentativa(acesso) });
    const { resultado } = await provider.responder(mensagens, contexto);
    return Response.json(ChatResponse.parse(resultado), { headers: { "cache-control": "no-store" } });
  } catch (erro) {
    if (!(erro instanceof ErroIa)) {
      console.warn(JSON.stringify({ evento: "chat_falha", etapa, duracaoMs: Math.round(performance.now() - inicio) }));
      return respostaErro("ia_indisponivel");
    }
    switch (erro.motivo) {
      case "cota":
        return respostaErro("limite_ia", "O limite diário de uso da IA foi atingido. Tente novamente quando ele for renovado ou preencha manualmente.");
      case "cota_provedor":
        return respostaErro("limite_ia", erro.message);
      case "tempo":
        return respostaErro("ia_indisponivel", "A IA demorou mais que o esperado. Tente novamente ou preencha manualmente.");
      case "rede":
        return respostaErro("ia_indisponivel", "Falha temporária na conexão com a IA. Tente novamente em alguns instantes ou preencha manualmente.");
      case "indisponivel":
        return respostaErro("ia_indisponivel", "A IA está temporariamente indisponível. Tente novamente em alguns instantes ou preencha manualmente.");
      default:
        return respostaErro("ia_indisponivel");
    }
  }
}
