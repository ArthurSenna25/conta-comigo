/**
 * URL e chave publicável do Supabase (públicas por desenho; a proteção é a RLS).
 * A secret key NUNCA é lida aqui: este módulo é alcançável a partir do proxy e das telas.
 * `process.env.X` precisa ser acesso direto para o Next inlinar NEXT_PUBLIC_* no bundle.
 */
export function configSupabase(): { url: string; chave: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url) throw new Error("Variável NEXT_PUBLIC_SUPABASE_URL ausente (veja .env.example).");
  if (!chave) throw new Error("Variável NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausente (veja .env.example).");
  return { url, chave };
}
