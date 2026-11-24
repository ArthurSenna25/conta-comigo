import { NextResponse, type NextRequest } from "next/server";
import type { ErroResposta } from "@/lib/contracts";
import { atualizarSessao } from "@/lib/db/sessao-proxy";
import { modoMock } from "@/lib/security/modo-mock";
import { decidirNoProxy } from "@/lib/security/rotas";

/**
 * Renova a sessão do Supabase e faz a checagem OTIMISTA de acesso (sem banco, só getClaims).
 * Não é a autorização: toda página e action valida de novo (docs/08, CVE-2025-29927).
 */
export async function proxy(request: NextRequest) {
  // Modo mock (só development/test; em produção com a flag ligada isto lança e a página dá 500).
  if (modoMock()) return NextResponse.next();

  const { response, userId } = await atualizarSessao(request);
  const { pathname, search } = request.nextUrl;

  switch (decidirNoProxy(pathname, userId !== null)) {
    case "entrar": {
      const url = request.nextUrl.clone();
      url.pathname = "/entrar";
      url.search = "";
      url.searchParams.set("next", pathname + search); // validado por destinoSeguro na action
      return comSessao(NextResponse.redirect(url), response);
    }
    case "painel": {
      const url = request.nextUrl.clone();
      url.pathname = "/painel";
      url.search = "";
      return comSessao(NextResponse.redirect(url), response);
    }
    case "nao_autenticado": {
      const corpo = { erro: { codigo: "nao_autenticado", mensagem: "Faça login para continuar." } } satisfies ErroResposta;
      return comSessao(NextResponse.json(corpo, { status: 401 }), response);
    }
    default:
      return response;
  }
}

/** Copia os cookies renovados e os cabeçalhos anti-cache para uma resposta diferente da original. */
function comSessao(destino: NextResponse, sessao: NextResponse): NextResponse {
  for (const cookie of sessao.cookies.getAll()) destino.cookies.set(cookie);
  for (const nome of ["cache-control", "expires", "pragma"]) {
    const valor = sessao.headers.get(nome);
    if (valor) destino.headers.set(nome, valor);
  }
  return destino;
}

export const config = {
  // Tudo, menos arquivos estáticos do Next e imagens/ícones públicos.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)"],
};
