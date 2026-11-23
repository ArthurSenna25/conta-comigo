import { z } from "zod";
import { Lancamento, LancamentoInput, Rascunho } from "./lancamento";

export const IMAGEM_MAX_BYTES = 5 * 1024 * 1024;
export const AUDIO_MAX_BYTES = 2 * 1024 * 1024; // ~60 s comprimido
export const LOTE_MAX = 50;

/** Foto de nota ou print de vendas. Só vai ao Storage quando o usuário confirma. */
export const ImagemArquivo = z
  .file()
  .min(1)
  .max(IMAGEM_MAX_BYTES)
  .mime(["image/jpeg", "image/png", "image/webp"]);

/** Áudio: processado em memória e descartado. NUNCA é gravado. */
export const AudioArquivo = z
  .file()
  .min(1)
  .max(AUDIO_MAX_BYTES)
  .mime(["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav"]);

/** Enviado como FormData para /api/ingest. */
export const IngestRequest = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("texto"), texto: z.string().trim().min(1).max(2000) }),
  z.object({ kind: z.literal("imagem"), arquivo: ImagemArquivo }),
  z.object({ kind: z.literal("audio"), arquivo: AudioArquivo }),
]);

export const IngestResponse = z.object({
  rascunhos: z.array(Rascunho).max(LOTE_MAX),
  /** Ex.: "Qual foi o valor?" quando a IA não leu um campo obrigatório. */
  perguntasPendentes: z.array(z.string().max(200)).max(10),
});

/**
 * Confirmação (FormData). O servidor revalida cada lançamento com Zod;
 * o que veio da IA não tem privilégio nenhum sobre o que o usuário digita.
 */
export const ConfirmarRequest = z.object({
  lancamentos: z.array(LancamentoInput).min(1).max(LOTE_MAX),
  /** Presente quando a origem foi foto/print: é aqui que o arquivo vai ao Storage. */
  imagem: ImagemArquivo.optional(),
});

export const ConfirmarResponse = z.object({
  lancamentos: z.array(Lancamento),
});

export type IngestRequest = z.infer<typeof IngestRequest>;
export type IngestResponse = z.infer<typeof IngestResponse>;
export type ConfirmarRequest = z.infer<typeof ConfirmarRequest>;
export type ConfirmarResponse = z.infer<typeof ConfirmarResponse>;
