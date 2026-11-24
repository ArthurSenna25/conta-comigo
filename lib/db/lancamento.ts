import type { SupabaseClient } from "@supabase/supabase-js";

/** Quantos lançamentos o usuário tem (a RLS já limita ao dono; só conta, não traz linhas). */
export async function contarLancamentos(db: SupabaseClient): Promise<number> {
  const { count, error } = await db.from("lancamentos").select("id", { count: "exact", head: true });
  if (error) throw new Error(`falha ao contar lançamentos (${error.code ?? "sem código"})`);
  return count ?? 0;
}
