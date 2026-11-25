import { exigirAcessoApi } from "@/actions/portao-api";
import { carregarContexto } from "@/app/api/chat/contexto";
import { selecionarTrechos } from "@/app/api/chat/conhecimento";
import { reservarTentativa } from "@/app/api/ingest/reserva";
import { criarGeminiProvider, ErroIa } from "@/lib/ai/gemini";
import { ChatRequest, ChatResponse } from "@/lib/contracts";
import { mockAiProvider, mockDashboard, mockPerfil } from "@/lib/contracts/mocks";
import { respostaErro } from "@/lib/security/portao-api";

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
  const entrada = ChatRequest.safeParse(await lerPedido(req));
  if (!entrada.success) return respostaErro("invalido");
  // O Free só pode receber dados sintéticos. A conta é identificada por claims verificadas.
  if (!acesso.mock && !acesso.demo) return respostaErro("proibido");

  try {
    const { mensagens } = entrada.data;
    if (acesso.mock) {
      const { resultado } = await mockAiProvider.responder(mensagens, { perfil: mockPerfil, dashboard: mockDashboard, kb: [] });
      return Response.json(ChatResponse.parse(resultado), { headers: { "cache-control": "no-store" } });
    }
    const kb = await selecionarTrechos(mensagens.at(-1)?.conteudo ?? "");
    const contexto = await carregarContexto(acesso.userId, kb);
    if (!contexto) return respostaErro("nao_encontrado");
    const provider = criarGeminiProvider({ antesDaChamada: () => reservarTentativa(acesso) });
    const { resultado } = await provider.responder(mensagens, contexto);
    return Response.json(ChatResponse.parse(resultado), { headers: { "cache-control": "no-store" } });
  } catch (erro) {
    return respostaErro(erro instanceof ErroIa && erro.codigo === "limite_ia" ? "limite_ia" : "ia_indisponivel");
  }
}
