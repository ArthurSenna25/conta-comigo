const BASE = "http://localhost";
const MAX = 512;
/** Telas de acesso: voltar para elas depois do login criaria um laço. */
const TELAS_DE_ACESSO = new Set(["/entrar", "/cadastrar", "/consentimento"]);

const semBarraFinal = (caminho: string) => caminho.replace(/\/+$/, "") || "/";
const decodificar = (caminho: string) => {
  try {
    return decodeURIComponent(caminho);
  } catch {
    return caminho;
  }
};

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
  if (url.origin !== BASE) return padrao;

  // O parser remove "." e ".." mas deixa o segmento vazio: "/..//evil.com" vira "//evil.com".
  // Por isso a SAÍDA também é validada, não só a entrada.
  const saida = url.pathname + url.search;
  if (/^\/[/\\]/.test(saida)) return padrao;

  // O Next decodifica a rota e ignora barra final: "/%65ntrar" e "/entrar/" também são /entrar.
  if (TELAS_DE_ACESSO.has(semBarraFinal(decodificar(url.pathname)))) return padrao;
  return saida;
}
