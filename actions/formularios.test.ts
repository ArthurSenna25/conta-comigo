import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CadastroInput } from "@/lib/contracts";
import { camposDoErro, lerCadastro, lerConsentimento, lerLogin } from "./formularios";

const form = (campos: Record<string, string | File>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
};

describe("lerCadastro: caixa de formulário vira boolean, ausência vira false", () => {
  it("marcada ('on') vira true", () => {
    const r = lerCadastro(form({ email: "a@b.com", senha: "12345678", aceiteTermos: "on", aceiteEnvioIa: "on" }));
    expect(r).toEqual({ email: "a@b.com", senha: "12345678", aceiteTermos: true, aceiteEnvioIa: true });
  });

  it("desmarcada (campo ausente) vira false: nada vem pré-marcado", () => {
    const r = lerCadastro(form({ email: "a@b.com", senha: "12345678" }));
    expect(r.aceiteTermos).toBe(false);
    expect(r.aceiteEnvioIa).toBe(false);
  });

  it("só o valor exato 'on' conta: 'true', '1' e 'false' não marcam a caixa", () => {
    for (const valor of ["true", "1", "false", "ON", ""]) {
      expect(lerCadastro(form({ aceiteTermos: valor })).aceiteTermos).toBe(false);
    }
  });

  it("campo de texto enviado como arquivo vira string vazia (nunca objeto)", () => {
    const r = lerCadastro(form({ email: new File(["x"], "x.txt"), senha: new File(["x"], "y.txt") }));
    expect(r.email).toBe("");
    expect(r.senha).toBe("");
  });

  it("o resultado passa pelo contrato CadastroInput", () => {
    const r = lerCadastro(form({ email: " A@B.com ", senha: "12345678", aceiteTermos: "on" }));
    expect(CadastroInput.parse(r).email).toBe("a@b.com");
  });

  it("ignora campos extras (não deixa o cliente injetar aceite de outra finalidade)", () => {
    const r = lerCadastro(form({ email: "a@b.com", senha: "12345678", aceiteTermos: "on", finalidade: "x" }));
    expect(Object.keys(r).sort()).toEqual(["aceiteEnvioIa", "aceiteTermos", "email", "senha"]);
  });
});

describe("lerLogin e lerConsentimento", () => {
  it("lerLogin devolve só e-mail e senha", () => {
    expect(lerLogin(form({ email: "a@b.com", senha: "x", next: "/painel" }))).toEqual({ email: "a@b.com", senha: "x" });
  });

  it("lerConsentimento devolve só as duas caixas", () => {
    expect(lerConsentimento(form({ aceiteTermos: "on" }))).toEqual({ aceiteTermos: true, aceiteEnvioIa: false });
  });
});

describe("camposDoErro: primeira mensagem por campo, em texto fixo do contrato", () => {
  it("mapeia cada campo inválido para uma mensagem", () => {
    const r = CadastroInput.safeParse(lerCadastro(form({ email: "ruim", senha: "123" })));
    expect(r.success).toBe(false);
    if (r.success) return;
    const campos = camposDoErro(r.error);
    expect(Object.keys(campos).sort()).toEqual(["aceiteTermos", "email", "senha"]);
    expect(campos.senha).toBe("use ao menos 8 caracteres");
  });

  it("não ecoa o valor digitado (e-mail e senha nunca voltam na mensagem)", () => {
    const r = CadastroInput.safeParse(lerCadastro(form({ email: "segredo@x", senha: "minhasenha-curta" })));
    if (r.success) throw new Error("deveria falhar");
    expect(JSON.stringify(camposDoErro(r.error))).not.toMatch(/segredo|minhasenha/);
  });

  it("erro sem caminho (raiz) vai para a chave _", () => {
    const r = z.string().refine(() => false, "falhou").safeParse("x");
    if (r.success) throw new Error("deveria falhar");
    expect(camposDoErro(r.error)).toEqual({ _: "falhou" });
  });
});
