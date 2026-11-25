import { describe, expect, it } from "vitest";
import { CadastroInput, ConsentimentoInput, FinalidadeConsentimento, LoginInput, VERSAO_CONSENTIMENTO } from "./auth";

const valido = {
  email: "marta@exemplo.com.br",
  senha: "senha-forte-123",
  aceiteTermosUso: true,
  aceitePrivacidade: true,
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

  it("o limite de 72 do bcrypt é em BYTES: acentos e emojis contam mais que 1", () => {
    expect(CadastroInput.safeParse({ ...valido, senha: "ç".repeat(36) }).success).toBe(true); // 72 bytes
    expect(CadastroInput.safeParse({ ...valido, senha: "ç".repeat(37) }).success).toBe(false); // 74 bytes
    expect(CadastroInput.safeParse({ ...valido, senha: "😀".repeat(19) }).success).toBe(false); // 76 bytes
    expect(CadastroInput.safeParse({ ...valido, senha: "😀".repeat(18) }).success).toBe(true); // 72 bytes
  });

  it.each(["aceiteTermosUso", "aceitePrivacidade"])("exige %s: false e ausente são rejeitados", (campo) => {
    expect(CadastroInput.safeParse({ ...valido, [campo]: false }).success).toBe(false);
    const semAceite = Object.fromEntries(Object.entries(valido).filter(([k]) => k !== campo));
    expect(CadastroInput.safeParse(semAceite).success).toBe(false);
  });

  it("não aceita aceite como string (caixa de formulário vem convertida pela action)", () => {
    expect(CadastroInput.safeParse({ ...valido, aceiteTermosUso: "on" }).success).toBe(false);
    expect(CadastroInput.safeParse({ ...valido, aceitePrivacidade: "on" }).success).toBe(false);
  });

  it("aceita envio à IA marcado", () => {
    expect(CadastroInput.parse({ ...valido, aceiteEnvioIa: true }).aceiteEnvioIa).toBe(true);
  });
});

describe("ConsentimentoInput", () => {
  it("é a parte de consentimento do cadastro: termos e privacidade obrigatórios, IA opcional", () => {
    const base = { aceiteTermosUso: true, aceitePrivacidade: true, aceiteEnvioIa: false };
    expect(ConsentimentoInput.safeParse(base).success).toBe(true);
    expect(ConsentimentoInput.safeParse({ ...base, aceiteTermosUso: false, aceiteEnvioIa: true }).success).toBe(false);
    expect(ConsentimentoInput.safeParse({ ...base, aceitePrivacidade: false, aceiteEnvioIa: true }).success).toBe(false);
  });

  it("cada aceite obrigatório tem a sua mensagem em português", () => {
    const r = ConsentimentoInput.safeParse({ aceiteTermosUso: false, aceitePrivacidade: false, aceiteEnvioIa: false });
    if (r.success) throw new Error("deveria falhar");
    const msgs = Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
    expect(msgs.aceiteTermosUso).toMatch(/Termos de Uso/);
    expect(msgs.aceitePrivacidade).toMatch(/Política de Privacidade/);
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

  it("senha acima de 72 bytes nunca existiu no cadastro: o login a rejeita sem consultar o Auth", () => {
    expect(LoginInput.safeParse({ email: "a@b.com", senha: "ç".repeat(37) }).success).toBe(false);
    expect(LoginInput.safeParse({ email: "a@b.com", senha: "ç".repeat(36) }).success).toBe(true);
  });

  it("não impõe regra de força no login (só no cadastro)", () => {
    expect(LoginInput.safeParse({ email: "a@b.com", senha: "1" }).success).toBe(true);
  });
});

describe("consentimento: finalidades e versão", () => {
  it("finalidades são exatamente as do CHECK da tabela consentimentos", () => {
    expect(FinalidadeConsentimento.options).toEqual(["termos_uso", "privacidade", "envio_ia"]);
  });

  it("versão do texto é uma data ISO (ex.: 2026-11-26)", () => {
    expect(VERSAO_CONSENTIMENTO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(VERSAO_CONSENTIMENTO).toBe("2026-11-26");
  });
});
