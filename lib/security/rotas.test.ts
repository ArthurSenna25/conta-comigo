import { describe, expect, it } from "vitest";
import { decidirNoProxy, normalizarCaminho, rotaPublica } from "./rotas";

describe("normalizarCaminho: como o Next enxerga a rota", () => {
  it.each([
    ["/entrar", "/entrar"],
    ["/entrar/", "/entrar"],
    ["/entrar//", "/entrar"],
    ["/%65ntrar", "/entrar"],
    ["/", "/"],
    ["//", "/"],
    ["/legal/termos/", "/legal/termos"],
  ])("%s -> %s", (entrada, esperado) => {
    expect(normalizarCaminho(entrada)).toBe(esperado);
  });

  it("percent-encoding inválido não quebra: devolve o caminho como veio", () => {
    expect(normalizarCaminho("/%E0%A4%A")).toBe("/%E0%A4%A");
  });
});

describe("rotaPublica: allowlist; tudo o mais exige login", () => {
  it.each(["/", "/entrar", "/cadastrar", "/entrar/", "/%65ntrar", "/legal", "/legal/termos", "/legal/privacidade/"])(
    "%s é pública",
    (caminho) => {
      expect(rotaPublica(caminho)).toBe(true);
    },
  );

  it.each([
    "/painel",
    "/onboarding",
    "/consentimento",
    "/api/ingest",
    "/api/chat",
    "/legalx",
    "/legal-privado",
    "/entrar/x",
    "/lancamentos/123",
    "/%70ainel",
  ])("%s é protegida", (caminho) => {
    expect(rotaPublica(caminho)).toBe(false);
  });
});

describe("decidirNoProxy", () => {
  it("visitante em rota protegida de página vai para /entrar", () => {
    expect(decidirNoProxy("/painel", false)).toBe("entrar");
    expect(decidirNoProxy("/onboarding", false)).toBe("entrar");
  });

  it("visitante em rota protegida de API recebe 401, não redirect", () => {
    expect(decidirNoProxy("/api/ingest", false)).toBe("nao_autenticado");
    expect(decidirNoProxy("/api/chat/", false)).toBe("nao_autenticado");
  });

  it("visitante em rota pública segue", () => {
    for (const p of ["/", "/entrar", "/cadastrar", "/legal/termos"]) expect(decidirNoProxy(p, false)).toBe("seguir");
  });

  it("logado em /entrar ou /cadastrar vai para o painel (o portão decide o resto)", () => {
    expect(decidirNoProxy("/entrar", true)).toBe("painel");
    expect(decidirNoProxy("/cadastrar/", true)).toBe("painel");
    expect(decidirNoProxy("/%65ntrar", true)).toBe("painel");
  });

  it("logado segue nas demais rotas, inclusive públicas e /consentimento", () => {
    for (const p of ["/", "/painel", "/consentimento", "/onboarding", "/api/chat", "/legal"]) {
      expect(decidirNoProxy(p, true)).toBe("seguir");
    }
  });
});
