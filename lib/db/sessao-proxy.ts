import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configSupabase } from "./config";
import { cookieSeguro } from "./cookies";

/**
 * Renova a sessão no proxy e lê a identidade com `getClaims()` (assinatura validada, com chave
 * assimétrica ES256 isso é local, sem ida ao Auth). Devolve a `response` que carrega os cookies
 * renovados: o proxy TEM de devolver esta (ou copiar cookies e cabeçalhos dela), senão a sessão
 * se perde no navegador. Nada pode rodar entre criar o client e o `getClaims()`.
 */
export async function atualizarSessao(
  request: NextRequest,
): Promise<{ response: NextResponse; userId: string | null }> {
  const { url, chave } = configSupabase();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(lista, cabecalhos) {
        for (const { name, value } of lista) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of lista) response.cookies.set(name, value, cookieSeguro(options));
        // Cache-Control: private, no-store etc.: resposta com cookie de sessão nunca pode ser cacheada.
        for (const [nome, valor] of Object.entries(cabecalhos)) response.headers.set(nome, valor);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  return { response, userId: data?.claims.sub ?? null };
}
