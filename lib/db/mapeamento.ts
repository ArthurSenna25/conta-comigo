// Linha do Postgres (snake_case) ↔ contrato (camelCase). Puro: sem cliente, testável sem rede.
// Toda linha lida passa por Zod: o que o banco devolve também é entrada externa.
import { z } from "zod";
import {
  Atividade,
  Categoria,
  Centavos,
  DataISO,
  FormaPgto,
  Lancamento,
  Origem,
  Perfil,
  TipoLancamento,
  Timestamp,
  Uuid,
  type LancamentoInput,
  type PerfilInput,
} from "@/lib/contracts";

const LinhaLancamento = z.object({
  id: Uuid,
  documento_id: Uuid.nullable(),
  tipo: TipoLancamento,
  data: DataISO,
  valor_centavos: Centavos,
  categoria: Categoria,
  descricao: z.string(),
  contraparte: z.string().nullable(),
  forma_pgto: FormaPgto.nullable(),
  origem: Origem,
  criado_em: Timestamp,
  atualizado_em: Timestamp,
});

const LinhaPerfil = z.object({
  user_id: Uuid,
  nome_negocio: z.string(),
  eh_mei: z.boolean(),
  atividade: Atividade,
  uf: z.string(),
  municipio: z.string(),
  data_abertura: DataISO,
  receita_inicial_centavos: z.int().min(0),
  criado_em: Timestamp,
});

/** Colunas lidas (nunca `select *`: coluna nova no banco não vaza sem querer). */
export const COLUNAS_LANCAMENTO =
  "id, documento_id, tipo, data, valor_centavos, categoria, descricao, contraparte, forma_pgto, origem, criado_em, atualizado_em";
export const COLUNAS_PERFIL =
  "user_id, nome_negocio, eh_mei, atividade, uf, municipio, data_abertura, receita_inicial_centavos, criado_em";

/** Campos editáveis (sem dono nem documento): é o que `editarLancamento` grava. */
export function camposDoLancamento(l: LancamentoInput) {
  return {
    tipo: l.tipo,
    data: l.data,
    valor_centavos: l.valorCentavos,
    categoria: l.categoria,
    descricao: l.descricao,
    contraparte: l.contraparte,
    forma_pgto: l.formaPgto,
    origem: l.origem,
  };
}

export function lancamentoParaLinha(userId: string, l: LancamentoInput, documentoId: string | null) {
  return { user_id: userId, documento_id: documentoId, ...camposDoLancamento(l) };
}

export function linhaParaLancamento(linha: unknown): Lancamento {
  const r = LinhaLancamento.parse(linha);
  return {
    id: r.id,
    documentoId: r.documento_id,
    tipo: r.tipo,
    data: r.data,
    valorCentavos: r.valor_centavos,
    categoria: r.categoria,
    descricao: r.descricao,
    contraparte: r.contraparte,
    formaPgto: r.forma_pgto,
    origem: r.origem,
    criadoEm: r.criado_em,
    atualizadoEm: r.atualizado_em,
  };
}

/** Campos editáveis do perfil (sem o dono): é o que `atualizarPerfil` grava. */
export function camposDoPerfil(p: PerfilInput) {
  return {
    nome_negocio: p.nomeNegocio,
    eh_mei: p.ehMei,
    atividade: p.atividade,
    uf: p.uf,
    municipio: p.municipio,
    data_abertura: p.dataAbertura,
    receita_inicial_centavos: p.receitaInicialCentavos,
  };
}

export function perfilParaLinha(userId: string, p: PerfilInput) {
  return { user_id: userId, ...camposDoPerfil(p) };
}

export function linhaParaPerfil(linha: unknown): Perfil {
  const r = LinhaPerfil.parse(linha);
  return {
    userId: r.user_id,
    nomeNegocio: r.nome_negocio,
    ehMei: r.eh_mei,
    atividade: r.atividade,
    uf: r.uf,
    municipio: r.municipio,
    dataAbertura: r.data_abertura,
    receitaInicialCentavos: r.receita_inicial_centavos,
    criadoEm: r.criado_em,
  };
}

const EXTENSOES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Extensão do path no Storage (CHECK de documentos.storage_path). Mime fora da lista lança. */
export function extensaoDoMime(mime: string): string {
  const ext = EXTENSOES[mime];
  if (!ext) throw new Error("tipo de imagem não permitido");
  return ext;
}
