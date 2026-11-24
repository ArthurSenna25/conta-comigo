import type { CookieOptions } from "@supabase/ssr";

/**
 * O @supabase/ssr grava o cookie de sessão com `httpOnly: false` e sem `secure` (utils/constants.js):
 * ele precisa ser legível só se existir client no NAVEGADOR, e aqui não existe. Um XSS futuro roubaria
 * access e refresh token (400 dias). Por isso forçamos HttpOnly, SameSite=Lax e Secure em produção.
 * Fora de produção `secure` fica falso: sem HTTPS em localhost o navegador descartaria o cookie.
 * Se um dia houver `createBrowserClient`, este helper precisa ser revisto (ele não lerá o cookie).
 */
export function cookieSeguro(options: CookieOptions, producao = process.env.NODE_ENV === "production"): CookieOptions {
  return { ...options, httpOnly: true, secure: producao, sameSite: "lax" };
}
