import { exigirAcessoApi } from "@/actions/portao-api";
import { criarProcessarIngestao } from "@/app/api/ingest/processar";
import { reservarTentativa } from "@/app/api/ingest/reserva";

export const runtime = "nodejs";
export const maxDuration = 30;

// Reserva atômica por tentativa no banco (reservar_uso_ia); sem ela o provedor real nunca é chamado.
const processar = criarProcessarIngestao(reservarTentativa);

export async function POST(req: Request): Promise<Response> {
  const acesso = await exigirAcessoApi(req, { ia: true });
  if (acesso instanceof Response) return acesso; // 401/403/429/500 prontos
  return processar(req, acesso);
}
