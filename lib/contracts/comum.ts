import { z } from "zod";

/** Dinheiro sempre em centavos inteiros. Teto de sanidade: R$ 10 milhões. */
export const VALOR_MAX_CENTAVOS = 1_000_000_000;
export const Centavos = z.int().positive().max(VALOR_MAX_CENTAVOS);

/** Data de calendário "YYYY-MM-DD", sem hora (fuso America/Sao_Paulo na borda). */
export const DataISO = z.iso.date();
/** Mês "YYYY-MM". */
export const MesISO = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "mês inválido (YYYY-MM)");
export const Uuid = z.uuid();
export const Timestamp = z.iso.datetime({ offset: true });

export const CodigoErro = z.enum([
  "nao_autenticado",
  "proibido",
  "invalido",
  "nao_encontrado",
  "limite_ia", // orçamento diário de IA esgotado
  "ia_indisponivel", // provedor falhou: UI oferece "preencher manualmente"
  "interno",
]);

/** Erro padrão de toda action e rota. `mensagem` é segura para mostrar ao usuário. */
export const ErroResposta = z.object({
  erro: z.object({
    codigo: CodigoErro,
    mensagem: z.string().max(300),
    campos: z.record(z.string(), z.string()).optional(),
  }),
});

export type CodigoErro = z.infer<typeof CodigoErro>;
export type ErroResposta = z.infer<typeof ErroResposta>;
/** Retorno de toda action: dado ou erro padrão. */
export type Resultado<T> = { ok: true; dados: T } | ({ ok: false } & ErroResposta);
