import { IngestResponse, type ErroResposta } from "@/lib/contracts";
import { mockAiProvider } from "@/lib/contracts/mocks";
import { criarGeminiProvider, ErroIa, type TentativaIa } from "@/lib/ai/gemini";
import { validarMidia } from "@/lib/ai/midia";
import type { AcessoApi } from "@/actions/portao-api";
import { recusaEntradaIaDemo } from "@/lib/security/demo";
import { ErroIngestao, lerEntrada } from "./entrada";

/** Reserva UMA chamada por tentativa (ver `reserva.ts`), inclusive em concorrência e com custo zero. */
export type ReservarTentativa = (acesso: AcessoApi, tentativa: TentativaIa) => Promise<void>;

const cabecalhos = { "Cache-Control": "private, no-store" };
const calendario = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
});

/**
 * Corpo da rota depois do portão (`exigirAcessoApi(req, { ia: true })` em route.ts: Origin, sessão,
 * consentimento, perfil, envio_ia e teto diário). Aqui só: ler a entrada, reservar a chamada e extrair.
 */
export function criarProcessarIngestao(reservar?: ReservarTentativa) {
  return async function processar(request: Request, acesso: AcessoApi): Promise<Response> {
    try {
      if (!acesso.mock && !reservar) throw new ErroIa("controle");
      const entrada = await lerEntrada(request);
      // Demo pública no Free (AMEACAS #22): só texto curto. Recusa antes do provedor e da reserva.
      const recusa = acesso.demo && !acesso.mock ? recusaEntradaIaDemo(entrada) : null;
      if (recusa) throw new ErroIngestao(400, "invalido", recusa);
      const provider = acesso.mock || !reservar
        ? mockAiProvider
        : criarGeminiProvider({ antesDaChamada: (t) => reservar(acesso, t) });
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
