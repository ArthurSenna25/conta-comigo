/**
 * Caminho como o Next o enxerga ao escolher a rota: decodificado e sem barra final.
 * "/%65ntrar" e "/entrar/" são a rota /entrar. Percent-encoding inválido fica como veio.
 */
export function normalizarCaminho(caminho: string): string {
  let decodificado = caminho;
  try {
    decodificado = decodeURIComponent(caminho);
  } catch {
    // mantém o original
  }
  return decodificado.replace(/\/+$/, "") || "/";
}

const PUBLICAS = new Set(["/", "/entrar", "/cadastrar", "/legal"]);

/** Allowlist: só estas rotas abrem sem sessão. Rota nova nasce protegida (negar por padrão). */
export function rotaPublica(caminho: string): boolean {
  const p = normalizarCaminho(caminho);
  return PUBLICAS.has(p) || p.startsWith("/legal/");
}

export type DecisaoDoProxy = "seguir" | "entrar" | "painel" | "nao_autenticado";

/**
 * Camada otimista do proxy (não é a autorização: toda página e action autoriza de novo).
 * API sem sessão responde 401 em vez de redirecionar para uma tela HTML.
 */
export function decidirNoProxy(caminho: string, logado: boolean): DecisaoDoProxy {
  const p = normalizarCaminho(caminho);
  if (!logado && !rotaPublica(p)) return p === "/api" || p.startsWith("/api/") ? "nao_autenticado" : "entrar";
  if (logado && (p === "/entrar" || p === "/cadastrar")) return "painel";
  return "seguir";
}
