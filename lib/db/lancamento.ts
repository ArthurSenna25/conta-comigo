import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lancamento, LancamentoInput } from "@/lib/contracts";
import { camposDoLancamento, COLUNAS_LANCAMENTO, lancamentoParaLinha, linhaParaLancamento } from "./mapeamento";

const falha = (o: string, e: { code?: string }) => new Error(`falha ao ${o} lançamento (${e.code ?? "sem código"})`);

/** Quantos lançamentos o usuário tem (só conta, não traz linhas). */
export async function contarLancamentos(db: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await db
    .from("lancamentos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw falha("contar", error);
  return count ?? 0;
}

/**
 * Grava o lote numa só instrução (tudo ou nada). `documentoId` (ou null) vale para todos; a FK composta
 * barra documento de outro usuário. Todo filtro leva `user_id` além da RLS (defesa em profundidade).
 */
export async function criarLancamentos(
  db: SupabaseClient,
  userId: string,
  itens: readonly LancamentoInput[],
  documentoId: string | null,
): Promise<Lancamento[]> {
  if (itens.length === 0) return []; // o limite superior (LOTE_MAX) é do Zod da action
  const { data, error } = await db
    .from("lancamentos")
    .insert(itens.map((i) => lancamentoParaLinha(userId, i, documentoId)))
    .select(COLUNAS_LANCAMENTO);
  if (error) throw falha("criar", error);
  return data.map(linhaParaLancamento);
}

/** Lançamentos com `de <= data < ate` ("YYYY-MM-DD"), do mais novo ao mais antigo. Sem paginação (DADOS.md). */
export async function listarLancamentos(
  db: SupabaseClient,
  userId: string,
  periodo: { de: string; ate: string },
): Promise<Lancamento[]> {
  const { data, error } = await db
    .from("lancamentos")
    .select(COLUNAS_LANCAMENTO)
    .eq("user_id", userId)
    .gte("data", periodo.de)
    .lt("data", periodo.ate)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false });
  if (error) throw falha("listar", error);
  return data.map(linhaParaLancamento);
}

/** Edita um lançamento do usuário. null se não existe ou não é dele. O documento anexado não muda aqui. */
export async function editarLancamento(
  db: SupabaseClient,
  userId: string,
  id: string,
  input: LancamentoInput,
): Promise<Lancamento | null> {
  const { data, error } = await db
    .from("lancamentos")
    .update(camposDoLancamento(input))
    .eq("id", id)
    .eq("user_id", userId)
    .select(COLUNAS_LANCAMENTO)
    .maybeSingle();
  if (error) throw falha("editar", error);
  return data ? linhaParaLancamento(data) : null;
}

/** Exclui e devolve o documento que ele usava (para a action limpar se for o último). null se não existe ou não é dele. */
export async function excluirLancamento(
  db: SupabaseClient,
  userId: string,
  id: string,
): Promise<{ documentoId: string | null } | null> {
  const { data, error } = await db
    .from("lancamentos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("documento_id")
    .maybeSingle();
  if (error) throw falha("excluir", error);
  return data ? { documentoId: (data.documento_id as string | null) ?? null } : null;
}

/** Quantos lançamentos ainda usam o documento. */
export async function contarLancamentosDoDocumento(
  db: SupabaseClient,
  userId: string,
  documentoId: string,
): Promise<number> {
  const { count, error } = await db
    .from("lancamentos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("documento_id", documentoId);
  if (error) throw falha("contar", error);
  return count ?? 0;
}
