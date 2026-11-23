import { z } from "zod";
import { DataISO } from "./comum";

/**
 * O cliente só envia mensagens do usuário (role "user").
 * Respostas do assistente nunca voltam do cliente: não dá para forjar
 * histórico do assistente nem injetar "fontes".
 */
export const ChatRequest = z.object({
  mensagens: z
    .array(
      z.object({
        role: z.literal("user"),
        conteudo: z.string().trim().min(1).max(1000),
      }),
    )
    .min(1)
    .max(10),
});

/** Citação de um arquivo de kb/*.md. Gerada só pelo servidor. */
export const Fonte = z.object({
  titulo: z.string().max(120),
  arquivo: z.string().regex(/^kb\/[a-z0-9-]+\.md$/, "fonte fora de kb/"),
  url: z.url().nullable(),
  verificadoEm: DataISO,
});

export const ChatResponse = z.object({
  resposta: z.string().max(4000),
  /** Vazio = sem base legal; a resposta deve dizer "consulte um contador". */
  fontes: z.array(Fonte).max(5),
});

export type ChatRequest = z.infer<typeof ChatRequest>;
export type Fonte = z.infer<typeof Fonte>;
export type ChatResponse = z.infer<typeof ChatResponse>;
