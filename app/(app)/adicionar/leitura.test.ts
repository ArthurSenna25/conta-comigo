import { describe, expect, it } from "vitest";
import { mockIngest } from "@/lib/contracts/mocks";
import { podeEnviarTexto, resultadoDaLeitura } from "./leitura";

describe("podeEnviarTexto", () => {
  it("libera só com mais de 2 caracteres, sem contar espaços", () => {
    expect(podeEnviarTexto("")).toBe(false);
    expect(podeEnviarTexto("ab")).toBe(false);
    expect(podeEnviarTexto("   ab   ")).toBe(false);
    expect(podeEnviarTexto("abc")).toBe(true);
  });
});

describe("resultadoDaLeitura", () => {
  it("200 no contrato → rascunhos", () => {
    expect(resultadoDaLeitura(200, mockIngest)).toEqual({ tipo: "rascunhos", rascunhos: mockIngest.rascunhos });
  });

  it("200 sem rascunho → falha com saída manual", () => {
    expect(resultadoDaLeitura(200, { rascunhos: [], perguntasPendentes: [] })).toMatchObject({ tipo: "falha", status: 200 });
  });

  it("200 fora do contrato conta como IA fora do ar", () => {
    expect(resultadoDaLeitura(200, { rascunhos: "x" })).toEqual({ tipo: "erro", codigo: "503" });
  });

  it("429 e 5xx viram EstadoErro", () => {
    expect(resultadoDaLeitura(429, null)).toEqual({ tipo: "erro", codigo: "429" });
    expect(resultadoDaLeitura(503, null)).toEqual({ tipo: "erro", codigo: "503" });
    expect(resultadoDaLeitura(500, null)).toEqual({ tipo: "erro", codigo: "503" });
  });

  it("401/403/422 mostram a mensagem segura da rota", () => {
    const corpo = { erro: { codigo: "nao_autenticado", mensagem: "Entre na sua conta para continuar." } };
    expect(resultadoDaLeitura(401, corpo)).toEqual({ tipo: "falha", status: 401, mensagem: "Entre na sua conta para continuar." });
    expect(resultadoDaLeitura(403, "lixo")).toMatchObject({ tipo: "falha", status: 403 });
  });
});
