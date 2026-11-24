import type { ErroResposta } from "@/lib/contracts";

/** Só o que lemos do erro do Supabase. `message` é ignorado de propósito: texto bruto pode vazar dado. */
export type ErroSupabase = { code?: string; status?: number; message?: string } | null;
export type ErroAuth = { ok: false } & ErroResposta;

const LIMITE_DE_TAXA = new Set(["over_request_rate_limit", "over_email_send_rate_limit"]);

const erro = (codigo: ErroResposta["erro"]["codigo"], mensagem: string, campos?: Record<string, string>): ErroAuth => ({
  ok: false,
  erro: { codigo, mensagem, ...(campos ? { campos } : {}) },
});

/**
 * Traduz o erro do Supabase Auth em mensagem genérica. Contas inexistentes, senha errada, e-mail
 * já cadastrado e e-mail não confirmado produzem a MESMA resposta: não dá para enumerar e-mails.
 */
export function erroDeAuth(contexto: "login" | "cadastro", e: ErroSupabase): ErroAuth {
  if (e && (e.status === 429 || (e.code && LIMITE_DE_TAXA.has(e.code)))) {
    return erro("proibido", "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
  }
  if (contexto === "login") return erro("nao_autenticado", "E-mail ou senha incorretos.");

  if (e?.code === "weak_password") {
    return erro("invalido", "Revise a senha.", {
      senha: "Senha muito fraca. Use letras, números e ao menos 8 caracteres.",
    });
  }
  return erro("invalido", "Não foi possível criar a conta. Confira os dados ou tente entrar.");
}
