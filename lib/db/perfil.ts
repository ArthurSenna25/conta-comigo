import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * O usuário já preencheu o onboarding? Erro do banco NÃO vira "não tem perfil": propaga,
 * senão uma falha de rede mandaria todo mundo para o onboarding.
 */
export async function existePerfil(db: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await db.from("perfis").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`falha ao ler perfil (${error.code ?? "sem código"})`);
  return data !== null;
}
