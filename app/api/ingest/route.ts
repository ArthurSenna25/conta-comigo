import { criarPostIngestao } from "@/app/api/ingest/processar";
import { reservarTentativa } from "@/app/api/ingest/reserva";

export const runtime = "nodejs";
export const maxDuration = 30;

// Reserva atômica por tentativa no banco (reservar_uso_ia); sem ela o provedor real nunca é chamado.
export const POST = criarPostIngestao(reservarTentativa);
