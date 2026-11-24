import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./redirecionamento";

const PADRAO = "/painel";

describe("destinoSeguro: aceita só caminho relativo do próprio site", () => {
  it.each([
    ["/painel", "/painel"],
    ["/painel?mes=2026-11", "/painel?mes=2026-11"],
    ["/lancamentos/abc-123", "/lancamentos/abc-123"],
    ["/onboarding", "/onboarding"],
  ])("aceita %s", (entrada, esperado) => {
    expect(destinoSeguro(entrada)).toBe(esperado);
  });

  it("descarta o fragmento (#) e mantém caminho e query", () => {
    expect(destinoSeguro("/painel?a=1#topo")).toBe("/painel?a=1");
  });
});

describe("destinoSeguro: bloqueia open redirect", () => {
  it.each([
    ["URL absoluta https", "https://evil.com"],
    ["URL absoluta http", "http://evil.com/painel"],
    ["protocol-relative", "//evil.com"],
    ["protocol-relative com 3 barras", "///evil.com"],
    ["barra invertida", "/\\evil.com"],
    ["só barra invertida", "\\evil.com"],
    ["esquema javascript", "javascript:alert(1)"],
    ["esquema data", "data:text/html,<script>1</script>"],
    ["sem barra inicial", "evil.com"],
    ["tab escondido (o parser de URL remove e vira //)", "/\t/evil.com"],
    ["quebra de linha (header injection)", "/painel\r\nSet-Cookie: x=1"],
    ["caractere nulo", "/painel\u0000"],
    ["userinfo com @", "https://painel@evil.com"],
  ])("rejeita %s", (_nome, entrada) => {
    expect(destinoSeguro(entrada)).toBe(PADRAO);
  });

  it.each([null, undefined, 42, {}, [], true, ""])("usa o padrão para entrada não-texto ou vazia (%j)", (entrada) => {
    expect(destinoSeguro(entrada)).toBe(PADRAO);
  });

  it("rejeita destino gigante (> 512 caracteres)", () => {
    expect(destinoSeguro("/" + "a".repeat(600))).toBe(PADRAO);
  });
});

describe("destinoSeguro: normalização de dot-segments não pode produzir //host", () => {
  it.each([
    "/..//evil.com",
    "/.//evil.com",
    "/a/..//evil.com",
    "/%2e%2e//evil.com",
    "/.%2e//evil.com",
    "/a/%2e%2e//evil.com",
    "/a/../..//evil.com",
  ])("rejeita %s", (entrada) => {
    expect(destinoSeguro(entrada)).toBe(PADRAO);
  });

  it.each([
    "/painel",
    "/a/../painel",
    "/..//evil.com",
    "/.%2e//evil.com",
    "/%2F/evil.com",
    "/%5Cevil.com",
    "//evil.com",
    "/\\evil.com",
    "/painel?next=//evil.com",
    "/painel?x=%2F%2Fevil.com",
  ])("a saída para %s nunca começa com // nem /\\", (entrada) => {
    expect(destinoSeguro(entrada)).not.toMatch(/^\/[/\\]/);
  });
});

describe("destinoSeguro: evita laço de login", () => {
  it.each(["/%65ntrar", "/%65ntrar/", "/entrar/.", "/cadastrar/..//entrar"])(
    "codificação e ponto final não escapam da lista (%s)",
    (entrada) => {
      expect(destinoSeguro(entrada)).toBe(PADRAO);
    },
  );

  it.each(["/entrar/", "/cadastrar/", "/consentimento/", "/entrar//"])("barra final não escapa da lista (%s)", (entrada) => {
    expect(destinoSeguro(entrada)).toBe(PADRAO);
  });

  it.each(["/entrar", "/cadastrar", "/entrar?next=/painel", "/consentimento"])(
    "não devolve a própria tela de acesso (%s)",
    (entrada) => {
      expect(destinoSeguro(entrada)).toBe(PADRAO);
    },
  );
});

describe("destinoSeguro: padrão configurável", () => {
  it("usa o padrão informado quando o destino é inválido", () => {
    expect(destinoSeguro("//evil.com", "/onboarding")).toBe("/onboarding");
  });
});
