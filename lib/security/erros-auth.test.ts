import { describe, expect, it } from "vitest";
import { ErroResposta } from "@/lib/contracts";
import { erroDeAuth } from "./erros-auth";

describe("erroDeAuth: mensagens genéricas (não revelam se o e-mail existe)", () => {
  it("login: credencial errada, e-mail inexistente e e-mail não confirmado têm a MESMA resposta", () => {
    const a = erroDeAuth("login", { code: "invalid_credentials", status: 400 });
    const b = erroDeAuth("login", { code: "user_not_found", status: 400 });
    const c = erroDeAuth("login", { code: "email_not_confirmed", status: 400 });
    expect(b).toEqual(a);
    expect(c).toEqual(a);
    expect(a.erro.codigo).toBe("nao_autenticado");
  });

  it("cadastro: e-mail já existente tem a MESMA resposta de uma falha qualquer", () => {
    const existe = erroDeAuth("cadastro", { code: "email_exists", status: 422 });
    const existe2 = erroDeAuth("cadastro", { code: "user_already_exists", status: 422 });
    const outra = erroDeAuth("cadastro", { code: "unexpected_failure", status: 400 });
    expect(existe2).toEqual(existe);
    expect(outra).toEqual(existe);
  });

  it("cadastro: a mensagem não diz 'já existe', 'cadastrado' nem 'registrado'", () => {
    const { erro } = erroDeAuth("cadastro", { code: "email_exists" });
    expect(erro.mensagem).not.toMatch(/j[áa] (existe|cadastrad|registrad)|existe|cadastrado|registrado/i);
  });

  it("nunca repassa o texto bruto do Supabase", () => {
    const r = erroDeAuth("login", { code: "invalid_credentials", message: "User foo@bar.com not found in auth.users" });
    expect(JSON.stringify(r)).not.toContain("foo@bar.com");
    expect(JSON.stringify(r)).not.toContain("auth.users");
  });

  it("senha fraca: erro no campo senha (não envolve e-mail, pode ser específico)", () => {
    const r = erroDeAuth("cadastro", { code: "weak_password", status: 422 });
    expect(r.erro.codigo).toBe("invalido");
    expect(r.erro.campos?.senha).toBeTruthy();
  });

  it("e-mail recusado pelo domínio/formato (email_address_invalid) aponta o campo e-mail, sem revelar contas", () => {
    const r = erroDeAuth("cadastro", { code: "email_address_invalid", status: 400 });
    expect(r.erro.codigo).toBe("invalido");
    expect(r.erro.campos?.email).toMatch(/e-mail/i);
    expect(r.erro.campos?.email).not.toMatch(/j[áa] (existe|cadastrad|registrad)|existe|cadastrado|registrado/i);
  });

  it.each(["over_request_rate_limit", "over_email_send_rate_limit"])("limite de taxa (%s): pede para aguardar", (code) => {
    const r = erroDeAuth("login", { code, status: 429 });
    expect(r.erro.codigo).toBe("proibido");
    expect(r.erro.mensagem).toMatch(/aguarde|tente.*(mais tarde|depois|minutos)/i);
  });

  it("status 429 sem código também vira limite de taxa", () => {
    expect(erroDeAuth("login", { status: 429 }).erro.codigo).toBe("proibido");
  });

  it.each([500, 502, 503])("falha do servidor (%i) não vira 'senha incorreta': é erro interno", (status) => {
    for (const contexto of ["login", "cadastro"] as const) {
      const r = erroDeAuth(contexto, { status });
      expect(r.erro.codigo).toBe("interno");
      expect(r.erro.mensagem).not.toMatch(/senha|e-mail/i);
    }
  });

  it("falha de rede (fetch sem resposta, status 0) não vira 'senha incorreta' nem 'não foi possível criar a conta'", () => {
    for (const contexto of ["login", "cadastro"] as const) {
      for (const e of [{ status: 0 }, { name: "AuthRetryableFetchError" }, { name: "AuthRetryableFetchError", status: 0 }]) {
        const r = erroDeAuth(contexto, e);
        expect(r.erro.codigo).toBe("interno");
        expect(r.erro.mensagem).not.toMatch(/senha|e-mail|conta/i);
      }
    }
  });

  it("erro desconhecido ou nulo no login não vaza e usa mensagem genérica", () => {
    const r = erroDeAuth("login", { code: "algo_novo" });
    expect(r.erro.codigo).toBe("nao_autenticado");
    expect(erroDeAuth("login", null).erro.mensagem).toBe(r.erro.mensagem);
  });

  it("toda saída respeita o contrato ErroResposta e ok=false", () => {
    for (const contexto of ["login", "cadastro"] as const) {
      for (const code of ["invalid_credentials", "email_exists", "weak_password", "over_request_rate_limit", "x"]) {
        const r = erroDeAuth(contexto, { code });
        expect(r.ok).toBe(false);
        expect(ErroResposta.safeParse({ erro: r.erro }).success).toBe(true);
      }
    }
  });
});
