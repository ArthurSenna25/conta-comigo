import { describe, expect, it } from "vitest";
import { ErroResposta, VERSAO_CONSENTIMENTO, type FinalidadeConsentimento } from "@/lib/contracts";
import { envioIaVigente, origemConfere, origemDaRequisicao, respostaErro } from "./portao-api";

const ORIGEM = "https://contacomigo.example";

describe("origemConfere", () => {
  it("leitura não exige Origin", () => {
    expect(origemConfere("GET", null, ORIGEM)).toBe(true);
    expect(origemConfere("HEAD", null, ORIGEM)).toBe(true);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE", "OPTIONS", "post"])("%s exige Origin igual ao da aplicação", (metodo) => {
    expect(origemConfere(metodo, ORIGEM, ORIGEM)).toBe(true);
    expect(origemConfere(metodo, "https://evil.example", ORIGEM)).toBe(false);
    expect(origemConfere(metodo, null, ORIGEM)).toBe(false); // falha fechada: sem Origin não escreve
  });

  it("recusa Origin com esquema, porta ou subdomínio diferentes, e o literal 'null'", () => {
    expect(origemConfere("POST", "http://contacomigo.example", ORIGEM)).toBe(false);
    expect(origemConfere("POST", "https://contacomigo.example:8443", ORIGEM)).toBe(false);
    expect(origemConfere("POST", "https://contacomigo.example.evil.com", ORIGEM)).toBe(false);
    expect(origemConfere("POST", "null", ORIGEM)).toBe(false);
  });

  it("origem esperada inválida falha fechada", () => {
    expect(origemConfere("POST", ORIGEM, "nao-e-url")).toBe(false);
  });
});

describe("origemDaRequisicao", () => {
  it("sem x-forwarded usa a URL da requisição", () => {
    expect(origemDaRequisicao("http://localhost:3000/api/x", null, null)).toBe("http://localhost:3000");
  });

  it("atrás de proxy vale o host público, não o interno", () => {
    expect(origemDaRequisicao("http://interno:3000/api/x", "app.example.com", "https")).toBe("https://app.example.com");
    expect(origemDaRequisicao("http://interno:3000/api/x", "app.example.com, outro", null)).toBe("http://app.example.com");
  });
});

describe("envioIaVigente", () => {
  const aceite = (versao: string, revogadoEm: string | null = null, finalidade: FinalidadeConsentimento = "envio_ia") => ({
    finalidade,
    versao,
    revogadoEm,
  });

  it("vale só com envio_ia na versão atual e não revogado", () => {
    expect(envioIaVigente([aceite(VERSAO_CONSENTIMENTO)])).toBe(true);
  });

  it("envio_ia de versão antiga não vale (AMEACAS #16)", () => {
    expect(envioIaVigente([aceite("2020-01-01")])).toBe(false);
  });

  it("revogado não vale", () => {
    expect(envioIaVigente([aceite(VERSAO_CONSENTIMENTO, "2026-11-24T10:00:00Z")])).toBe(false);
  });

  it("termos aceitos sem envio_ia não valem; vazio não vale", () => {
    expect(envioIaVigente([aceite(VERSAO_CONSENTIMENTO, null, "termos_uso")])).toBe(false);
    expect(envioIaVigente([])).toBe(false);
  });
});

describe("respostaErro", () => {
  it.each([
    ["nao_autenticado", 401],
    ["proibido", 403],
    ["invalido", 400],
    ["nao_encontrado", 404],
    ["limite_ia", 429],
    ["ia_indisponivel", 503],
    ["interno", 500],
  ] as const)("%s → %i com corpo ErroResposta válido, sem cache nem redirect", async (codigo, status) => {
    const r = respostaErro(codigo);
    expect(r.status).toBe(status);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(r.headers.get("location")).toBeNull();
    expect(ErroResposta.parse(await r.json()).erro.codigo).toBe(codigo);
  });
});
