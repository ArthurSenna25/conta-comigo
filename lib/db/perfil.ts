import type { SupabaseClient } from "@supabase/supabase-js";
import type { Perfil, PerfilInput } from "@/lib/contracts";
import { camposDoPerfil, COLUNAS_PERFIL, linhaParaPerfil, perfilParaLinha } from "./mapeamento";

const falha = (o: string, e: { code?: string }) => new Error(`falha ao ${o} perfil (${e.code ?? "sem código"})`);

/**
 * O usuário já preencheu o onboarding? Erro do banco NÃO vira "não tem perfil": propaga,
 * senão uma falha de rede mandaria todo mundo para o onboarding.
 */
export async function existePerfil(db: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await db.from("perfis").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) throw falha("ler", error);
  return data !== null;
}

/** Perfil do usuário, ou null se não existe (ou é de outro: a RLS esconde). */
export async function lerPerfil(db: SupabaseClient, userId: string): Promise<Perfil | null> {
  const { data, error } = await db.from("perfis").select(COLUNAS_PERFIL).eq("user_id", userId).maybeSingle();
  if (error) throw falha("ler", error);
  return data ? linhaParaPerfil(data) : null;
}

/** Cria o perfil. Segunda chamada para o mesmo usuário lança (PK); a RLS barra `userId` de outra pessoa. */
export async function criarPerfil(db: SupabaseClient, userId: string, input: PerfilInput): Promise<Perfil> {
  const { data, error } = await db.from("perfis").insert(perfilParaLinha(userId, input)).select(COLUNAS_PERFIL).single();
  if (error) throw falha("criar", error);
  return linhaParaPerfil(data);
}

/** Atualiza o perfil. null se não existe ou não é do usuário (0 linhas: a RLS filtra, sem erro). */
export async function atualizarPerfil(db: SupabaseClient, userId: string, input: PerfilInput): Promise<Perfil | null> {
  // atualizado_em: o trigger do banco cuida (relógio do app não vale)
  const { data, error } = await db
    .from("perfis")
    .update(camposDoPerfil(input))
    .eq("user_id", userId)
    .select(COLUNAS_PERFIL)
    .maybeSingle();
  if (error) throw falha("atualizar", error);
  return data ? linhaParaPerfil(data) : null;
}
