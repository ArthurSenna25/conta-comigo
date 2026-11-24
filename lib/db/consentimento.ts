import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { FinalidadeConsentimento } from "@/lib/contracts";

const Linha = z.array(
  z.object({
    finalidade: FinalidadeConsentimento,
    versao: z.string(),
    revogado_em: z.string().nullable(),
  }),
);

/** Aceites do usuário (a RLS já limita ao dono; o filtro por id só deixa a intenção explícita). */
export async function listarAceites(
  db: SupabaseClient,
  userId: string,
): Promise<{ finalidade: FinalidadeConsentimento; versao: string; revogadoEm: string | null }[]> {
  const { data, error } = await db
    .from("consentimentos")
    .select("finalidade, versao, revogado_em")
    .eq("user_id", userId);
  if (error) throw new Error(`falha ao ler consentimentos (${error.code ?? "sem código"})`);
  return Linha.parse(data).map((l) => ({ finalidade: l.finalidade, versao: l.versao, revogadoEm: l.revogado_em }));
}

/** Grava os aceites numa só instrução (atômica). Repetir o mesmo aceite não dá erro. */
export async function registrarAceites(
  db: SupabaseClient,
  userId: string,
  finalidades: FinalidadeConsentimento[],
  versao: string,
): Promise<void> {
  const linhas = finalidades.map((finalidade) => ({ user_id: userId, finalidade, versao }));
  const { error } = await db
    .from("consentimentos")
    .upsert(linhas, { onConflict: "user_id,finalidade,versao", ignoreDuplicates: true });
  if (error) throw new Error(`falha ao registrar consentimento (${error.code ?? "sem código"})`);
}
