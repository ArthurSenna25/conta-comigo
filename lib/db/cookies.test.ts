import { describe, expect, it } from "vitest";
import { cookieSeguro } from "./cookies";

// Padrão do @supabase/ssr (utils/constants.js): httpOnly false, sem secure, 400 dias.
const padraoDoSsr = { path: "/", sameSite: "lax" as const, httpOnly: false, maxAge: 400 * 24 * 60 * 60 };

describe("cookieSeguro: cookie de sessão não pode ser lido por JavaScript", () => {
  it("força HttpOnly mesmo que o ssr mande httpOnly false (defesa contra XSS roubando o token)", () => {
    expect(cookieSeguro(padraoDoSsr, true).httpOnly).toBe(true);
    expect(cookieSeguro(padraoDoSsr, false).httpOnly).toBe(true);
  });

  it("Secure em produção (só trafega por HTTPS); fora dela fica sem, senão localhost/http não grava o cookie", () => {
    expect(cookieSeguro(padraoDoSsr, true).secure).toBe(true);
    expect(cookieSeguro(padraoDoSsr, false).secure).toBe(false);
  });

  it("em produção nada que venha nas opções consegue desligar Secure/HttpOnly", () => {
    const r = cookieSeguro({ ...padraoDoSsr, secure: false, httpOnly: false }, true);
    expect(r.secure).toBe(true);
    expect(r.httpOnly).toBe(true);
  });

  it("SameSite fica Lax (nem None, nem ausente)", () => {
    expect(cookieSeguro({ ...padraoDoSsr, sameSite: "none" }, true).sameSite).toBe("lax");
    expect(cookieSeguro({ path: "/" }, true).sameSite).toBe("lax");
  });

  it("preserva path, maxAge e expires: o logout (maxAge 0) continua apagando o cookie", () => {
    const apagar = cookieSeguro({ path: "/", maxAge: 0 }, true);
    expect(apagar.maxAge).toBe(0);
    expect(apagar.path).toBe("/");
    const data = new Date(0);
    expect(cookieSeguro({ expires: data }, true).expires).toBe(data);
  });

  it("não altera o objeto recebido (imutável)", () => {
    const original = { ...padraoDoSsr };
    cookieSeguro(original, true);
    expect(original).toEqual(padraoDoSsr);
  });

  it("sem segundo argumento decide por NODE_ENV (no teste não é production)", () => {
    expect(cookieSeguro(padraoDoSsr).secure).toBe(process.env.NODE_ENV === "production");
  });
});
