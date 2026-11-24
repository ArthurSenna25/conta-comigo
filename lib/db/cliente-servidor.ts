import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { configSupabase } from "./config";

/**
 * Client do USUÁRIO para Server Components, Server Actions e Route Handlers: a RLS vale.
 * Um client novo por requisição (nunca compartilhar). Para ler a identidade use `getClaims()`;
 * `getSession()` não é confiável no servidor porque lê o cookie sem validar.
 */
export async function criarClienteServidor(): Promise<SupabaseClient> {
  const { url, chave } = configSupabase();
  const jar = await cookies();
  return createServerClient(url, chave, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(lista) {
        try {
          for (const { name, value, options } of lista) jar.set(name, value, options);
        } catch {
          // Server Component não pode escrever cookie. Sem problema: o proxy renova a sessão
          // em toda navegação e grava os cookies na resposta.
        }
      },
    },
  });
}
