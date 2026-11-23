import { z } from "zod";
import { Centavos, DataISO, Timestamp, Uuid } from "./comum";

export const TipoLancamento = z.enum(["receita", "despesa"]);

/** Lista fechada (dossiê §6). No banco: CHECK com os mesmos valores. */
export const Categoria = z.enum([
  "vendas",
  "servicos_prestados",
  "estoque",
  "aluguel",
  "contas_consumo", // energia, água, internet
  "frete",
  "marketing",
  "impostos_das",
  "salario",
  "material_consumo",
  "retirada", // pró-labore / retirada do dono
  "outras",
]);

export const Origem = z.enum(["foto", "audio", "texto", "print", "manual"]);
export const FormaPgto = z.enum(["pix", "cartao", "dinheiro", "boleto", "outro"]);

/** O que o usuário confirma. O servidor revalida tudo com este schema. */
export const LancamentoInput = z.object({
  tipo: TipoLancamento,
  data: DataISO,
  valorCentavos: Centavos,
  categoria: Categoria,
  descricao: z.string().trim().min(1).max(200),
  contraparte: z.string().trim().max(120).nullable(),
  formaPgto: FormaPgto.nullable(),
  origem: Origem,
});

export const Lancamento = LancamentoInput.extend({
  id: Uuid,
  documentoId: Uuid.nullable(),
  criadoEm: Timestamp,
  atualizadoEm: Timestamp,
});

const Confianca = z.number().min(0).max(1);

/**
 * Saída da IA. NÃO é persistida: vive na tela até o usuário confirmar.
 * Campos que a IA não leu vêm null (nunca inventados).
 */
export const Rascunho = z.object({
  tipo: TipoLancamento,
  data: DataISO.nullable(),
  valorCentavos: Centavos.nullable(),
  categoria: Categoria,
  descricao: z.string().max(200),
  contraparte: z.string().max(120).nullable(),
  formaPgto: FormaPgto.nullable(),
  origem: Origem,
  confianca: z.object({ data: Confianca, valor: Confianca, categoria: Confianca }),
});

export type TipoLancamento = z.infer<typeof TipoLancamento>;
export type Categoria = z.infer<typeof Categoria>;
export type Origem = z.infer<typeof Origem>;
export type FormaPgto = z.infer<typeof FormaPgto>;
export type LancamentoInput = z.infer<typeof LancamentoInput>;
export type Lancamento = z.infer<typeof Lancamento>;
export type Rascunho = z.infer<typeof Rascunho>;
