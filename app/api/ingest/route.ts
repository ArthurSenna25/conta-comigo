import { exigirAcessoApi } from "@/actions/portao-api";
import { criarProcessarIngestao } from "@/app/api/ingest/processar";
import { reservarTentativa } from "@/app/api/ingest/reserva";
import { MENSAGEM_IA_SOMENTE_DEMO, respostaErro } from "@/lib/security/portao-api";

export const runtime = "nodejs";
export const maxDuration = 30;

// Reserva atômica por tentativa no banco (reservar_uso_ia); sem ela o provedor real nunca é chamado.
const processar = criarProcessarIngestao(reservarTentativa);

export async function POST(req: Request): Promise<Response> {
  const acesso = await exigirAcessoApi(req, { ia: true });
  if (acesso instanceof Response) return acesso; // 401/403/429/500 prontos
  // O Free só pode receber dados sintéticos: recusa antes de ler o corpo e de reservar chamada.
  if (!acesso.mock && !acesso.demo) return respostaErro("proibido", MENSAGEM_IA_SOMENTE_DEMO);
  return processar(req, acesso);
}
