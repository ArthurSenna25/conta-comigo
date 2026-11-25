import { describe, expect, it } from "vitest";
import { mockIngest } from "@/lib/contracts/mocks";
import { MSG_DEMORA, mensagemSemResposta, podeEnviarTexto, resultadoDaLeitura } from "./leitura";

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

  it("429 vira EstadoErro de limite, com ou sem corpo", () => {
    expect(resultadoDaLeitura(429, null)).toEqual({ tipo: "erro", codigo: "429" });
    const corpo = { erro: { codigo: "limite_ia", mensagem: "Limite" } };
    expect(resultadoDaLeitura(429, corpo)).toEqual({ tipo: "erro", codigo: "429" });
  });

  it("504 sem o nosso JSON (Vercel) mostra a demora, não 'indisponível'", () => {
    expect(resultadoDaLeitura(504, null)).toEqual({ tipo: "falha", status: 504, mensagem: MSG_DEMORA });
    expect(resultadoDaLeitura(504, "<html>Gateway Timeout</html>")).toMatchObject({ tipo: "falha", mensagem: MSG_DEMORA });
  });

  it("timeout do cliente (fetch sem resposta) mostra a demora; outra falha, a conexão", () => {
    expect(mensagemSemResposta(true)).toBe(MSG_DEMORA);
    expect(mensagemSemResposta(false)).toMatch(/conexão/);
  });

  it("5xx com o nosso ErroResposta mantém a mensagem pública do servidor", () => {
    const corpo = { erro: { codigo: "ia_indisponivel", mensagem: "A IA está fora do ar agora." } };
    expect(resultadoDaLeitura(503, corpo)).toEqual({ tipo: "falha", status: 503, mensagem: "A IA está fora do ar agora." });
  });

  it("5xx sem o nosso JSON (que não seja 504) continua IA fora do ar", () => {
    expect(resultadoDaLeitura(503, null)).toEqual({ tipo: "erro", codigo: "503" });
    expect(resultadoDaLeitura(500, null)).toEqual({ tipo: "erro", codigo: "503" });
  });

  it("401/403/422 mostram a mensagem segura da rota", () => {
    const corpo = { erro: { codigo: "nao_autenticado", mensagem: "Entre na sua conta para continuar." } };
    expect(resultadoDaLeitura(401, corpo)).toEqual({ tipo: "falha", status: 401, mensagem: "Entre na sua conta para continuar." });
    expect(resultadoDaLeitura(403, "lixo")).toMatchObject({ tipo: "falha", status: 403 });
  });
});
