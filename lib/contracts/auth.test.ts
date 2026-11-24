import { describe, expect, it } from "vitest";
import { CadastroInput, ConsentimentoInput, FinalidadeConsentimento, LoginInput, VERSAO_CONSENTIMENTO } from "./auth";

const valido = {
  email: "marta@exemplo.com.br",
  senha: "senha-forte-123",
  aceiteTermos: true,
  aceiteEnvioIa: false,
};

describe("CadastroInput", () => {
  it("aceita cadastro válido e deixa envio à IA como opcional (desmarcado)", () => {
    const r = CadastroInput.safeParse(valido);
    expect(r.success).toBe(true);
  });

  it("normaliza o e-mail (trim e minúsculas)", () => {
    const r = CadastroInput.parse({ ...valido, email: "  Marta@Exemplo.COM.br " });
    expect(r.email).toBe("marta@exemplo.com.br");
  });

  it.each(["", "sem-arroba", "a@b", "a@@b.com", "x".repeat(250) + "@a.com"])("rejeita e-mail inválido %j", (email) => {
    expect(CadastroInput.safeParse({ ...valido, email }).success).toBe(false);
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    expect(CadastroInput.safeParse({ ...valido, senha: "1234567" }).success).toBe(false);
  });

  it("rejeita senha com mais de 72 caracteres (limite do bcrypt)", () => {
    expect(CadastroInput.safeParse({ ...valido, senha: "a".repeat(73) }).success).toBe(false);
    expect(CadastroInput.safeParse({ ...valido, senha: "a".repeat(72) }).success).toBe(true);
  });

  it("exige o aceite dos termos: false e ausente são rejeitados", () => {
    expect(CadastroInput.safeParse({ ...valido, aceiteTermos: false }).success).toBe(false);
    const semAceite = { email: valido.email, senha: valido.senha, aceiteEnvioIa: false };
    expect(CadastroInput.safeParse(semAceite).success).toBe(false);
  });

  it("não aceita aceite como string (caixa de formulário vem convertida pela action)", () => {
    expect(CadastroInput.safeParse({ ...valido, aceiteTermos: "on" }).success).toBe(false);
  });

  it("aceita envio à IA marcado", () => {
    expect(CadastroInput.parse({ ...valido, aceiteEnvioIa: true }).aceiteEnvioIa).toBe(true);
  });
});

describe("ConsentimentoInput", () => {
  it("é a parte de consentimento do cadastro: termos obrigatórios, IA opcional", () => {
    expect(ConsentimentoInput.safeParse({ aceiteTermos: true, aceiteEnvioIa: false }).success).toBe(true);
    expect(ConsentimentoInput.safeParse({ aceiteTermos: false, aceiteEnvioIa: true }).success).toBe(false);
  });
});

describe("LoginInput", () => {
  it("aceita e-mail e senha e normaliza o e-mail", () => {
    const r = LoginInput.parse({ email: " A@B.com ", senha: "x" });
    expect(r).toEqual({ email: "a@b.com", senha: "x" });
  });

  it("rejeita senha vazia e e-mail inválido", () => {
    expect(LoginInput.safeParse({ email: "a@b.com", senha: "" }).success).toBe(false);
    expect(LoginInput.safeParse({ email: "nao-e-email", senha: "x" }).success).toBe(false);
  });

  it("não impõe regra de força no login (só no cadastro)", () => {
    expect(LoginInput.safeParse({ email: "a@b.com", senha: "1" }).success).toBe(true);
  });
});

describe("consentimento: finalidades e versão", () => {
  it("finalidades são exatamente as do CHECK da tabela consentimentos", () => {
    expect(FinalidadeConsentimento.options).toEqual(["termos_uso", "privacidade", "envio_ia"]);
  });

  it("versão do texto é uma data ISO (ex.: 2026-11-24)", () => {
    expect(VERSAO_CONSENTIMENTO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
