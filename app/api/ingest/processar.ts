import { IngestResponse, type ErroResposta } from "@/lib/contracts";
import { mockAiProvider } from "@/lib/contracts/mocks";
import { criarGeminiProvider, ErroIa, type TentativaIa } from "@/lib/ai/gemini";
import { validarMidia } from "@/lib/ai/midia";
import { autorizarIngestao, type AcessoIngestao } from "./acesso";
import { ErroIngestao, lerEntrada } from "./entrada";

type AcessoReal = Extract<AcessoIngestao, { mock: false }>;
/** Implementado pela integração compartilhada de Arthur. Deve reservar UMA
 * chamada por tentativa, inclusive em concorrência e quando o custo é zero. */
export type ReservarTentativa = (acesso: AcessoReal, tentativa: TentativaIa) => Promise<void>;

const cabecalhos = { "Cache-Control": "private, no-store" };
const calendario = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
});

export function criarPostIngestao(reservar?: ReservarTentativa) {
  return async function post(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      // O Next pode normalizar a URL interna para localhost. Compare com a
      // autoridade que o cliente usou, sem usar X-Forwarded-Host do pedido.
      const host = request.headers.get("host") ?? url.host;
      if (request.headers.get("origin") !== `${url.protocol}//${host}`) {
        throw new ErroIngestao(403, "proibido", "Envie o formulário a partir do Conta Comigo.");
      }
      const acesso = await autorizarIngestao();
      let provider = mockAiProvider;
      if (!acesso.mock) {
        if (!reservar) throw new ErroIa("controle");
        provider = criarGeminiProvider({ antesDaChamada: (t) => reservar(acesso, t) });
      }
      const entrada = await lerEntrada(request);
      if (acesso.mock) await validarMidia(entrada);
      const { resultado } = await provider.extrair(entrada, calendario.format(new Date()));
      const saida = IngestResponse.safeParse(resultado);
      if (!saida.success) throw new ErroIa("resposta");
      return Response.json(saida.data, { headers: cabecalhos });
    } catch (e) {
      const falha = e instanceof ErroIa || e instanceof ErroIngestao
        ? e : new ErroIngestao(503, "interno", "O serviço está indisponível. Você pode preencher manualmente.");
      const corpo: ErroResposta = { erro: { codigo: falha.codigo, mensagem: falha.message } };
      return Response.json(corpo, { status: falha.status, headers: cabecalhos });
    }
  };
}
