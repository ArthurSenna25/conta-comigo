import { criarPostIngestao } from "@/app/api/ingest/processar";

export const runtime = "nodejs";
export const maxDuration = 30;

// Arthur fornece a reserva compartilhada antes de habilitar o provedor real.
export const POST = criarPostIngestao();
