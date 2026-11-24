// Apoio dos testes de RLS contra o Supabase linkado (rede + segredos): só `pnpm test:rls` importa isto.
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishableKey || !secretKey) {
  throw new Error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou SUPABASE_SECRET_KEY. Rode com `pnpm test:rls`.",
  );
}

const SEM_SESSAO = { auth: { persistSession: false, autoRefreshToken: false } } as const;
export const BUCKET = "documentos";
export const admin = createClient(url, secretKey, SEM_SESSAO);

export type Usuario = { id: string; db: SupabaseClient };
const criados: string[] = [];

/** Usuário descartável com sessão própria (a RLS vale). Registra antes do login: `limparUsuarios` apaga mesmo se falhar. */
export async function criarUsuario(): Promise<Usuario> {
  const senha = `${randomUUID()}${randomUUID()}`;
  const email = `rls-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser falhou: ${error?.message}`);
  criados.push(data.user.id);
  const db = createClient(url!, publishableKey!, SEM_SESSAO);
  const login = await db.auth.signInWithPassword({ email, password: senha });
  if (login.error) throw new Error(`login falhou: ${login.error.message}`);
  return { id: data.user.id, db };
}

/** Apaga arquivos (o Storage não cai em cascata) e depois os usuários (cascade nas linhas). */
export async function limparUsuarios(): Promise<void> {
  const falhas: string[] = [];
  for (const id of criados) {
    try {
      const lista = await admin.storage.from(BUCKET).list(id, { limit: 1000 });
      if (lista.error) falhas.push(`list ${id}: ${lista.error.message}`);
      if (lista.data?.length) {
        const rm = await admin.storage.from(BUCKET).remove(lista.data.map((f) => `${id}/${f.name}`));
        if (rm.error) falhas.push(`remove ${id}: ${rm.error.message}`);
      }
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) falhas.push(`deleteUser ${id}: ${error.message}`);
    } catch (e) {
      falhas.push(`limpeza ${id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (falhas.length) throw new Error(`Usuários de teste podem ter sobrado:\n${falhas.join("\n")}`);
}
