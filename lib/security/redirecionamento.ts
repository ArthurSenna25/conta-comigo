const BASE = "http://localhost";
const MAX = 512;
/** Telas de acesso: voltar para elas depois do login criaria um laço. */
const TELAS_DE_ACESSO = new Set(["/entrar", "/cadastrar", "/consentimento"]);

/**
 * Valida o parâmetro de retorno (?next=) contra open redirect.
 * Só devolve caminho relativo do próprio site (caminho + query); qualquer outra coisa vira `padrao`.
 */
export function destinoSeguro(next: unknown, padrao = "/painel"): string {
  if (typeof next !== "string" || next.length === 0 || next.length > MAX) return padrao;
  // Começa com UMA barra (nem "//" nem "/\"), sem controle (tab/CR/LF/NUL) nem barra invertida:
  // o parser de URL do navegador remove tab/LF e normaliza "\" em "/", virando "//host".
  if (!/^\/(?![/\\])/.test(next) || /[\u0000-\u001f\u007f\\]/.test(next)) return padrao;

  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return padrao;
  }
  if (url.origin !== BASE || TELAS_DE_ACESSO.has(url.pathname)) return padrao;
  return url.pathname + url.search;
}
