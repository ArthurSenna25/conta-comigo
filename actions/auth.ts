"use server";

import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import {
  CadastroInput,
  ConsentimentoInput,
  LoginInput,
  VERSAO_CONSENTIMENTO,
  type Resultado,
} from "@/lib/contracts";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { listarAceites, registrarAceites } from "@/lib/db/consentimento";
import { consentimentoVigente, finalidadesDoAceite } from "@/lib/security/acesso";
import { erroDeAuth } from "@/lib/security/erros-auth";
import { modoMock } from "@/lib/security/modo-mock";
import { destinoSeguro } from "@/lib/security/redirecionamento";
import { exigirAcesso } from "./sessao";
import { camposDoErro, lerCadastro, lerConsentimento, lerLogin } from "./formularios";

// Assinatura de useActionState: (estado anterior, FormData) => novo estado.
type Estado<T> = Resultado<T> | null;

const invalido = (erro: ZodError): Resultado<never> => ({
  ok: false,
  erro: { codigo: "invalido", mensagem: "Confira os campos destacados.", campos: camposDoErro(erro) },
});

export async function entrar(_anterior: Estado<null>, form: FormData): Promise<Estado<null>> {
  const entrada = LoginInput.safeParse(lerLogin(form));
  if (!entrada.success) return invalido(entrada.error);

  const destino = destinoSeguro(form.get("next")); // ?next= validado contra open redirect
  if (modoMock()) redirect(destino);

  const db = await criarClienteServidor();
  const { error } = await db.auth.signInWithPassword({ email: entrada.data.email, password: entrada.data.senha });
  if (error) return erroDeAuth("login", error);
  redirect(destino); // o portão (exigirAcesso) manda para /consentimento ou /onboarding se faltar algo
}

export async function cadastrar(
  _anterior: Estado<{ confirmarEmail: boolean }>,
  form: FormData,
): Promise<Estado<{ confirmarEmail: boolean }>> {
  const entrada = CadastroInput.safeParse(lerCadastro(form));
  if (!entrada.success) return invalido(entrada.error);
  if (modoMock()) redirect("/painel");

  const db = await criarClienteServidor();
  const { data, error } = await db.auth.signUp({ email: entrada.data.email, password: entrada.data.senha });
  if (error) return erroDeAuth("cadastro", error);

  // Sem sessão = o projeto exige confirmar o e-mail (ou o e-mail já existia: o Supabase responde igual).
  // Resposta neutra nos dois casos. O consentimento é pedido de novo em /consentimento após o login.
  if (!data.session || !data.user) return { ok: true, dados: { confirmarEmail: true } };

  try {
    await registrarAceites(db, data.user.id, finalidadesDoAceite(entrada.data), VERSAO_CONSENTIMENTO);
  } catch (e) {
    // Falha parcial: conta criada e logada, sem aceite. NÃO derruba o cadastro: o portão manda o
    // usuário para /consentimento e ele não usa o app antes de aceitar. Só o código vai ao log.
    console.error("cadastro: aceite não gravado", e instanceof Error ? e.message : "erro desconhecido");
  }
  redirect("/painel");
}

/** Etapa /consentimento: quem está logado mas sem aceite vigente (falha parcial, versão nova, e-mail confirmado depois). */
export async function registrarConsentimento(_anterior: Estado<null>, form: FormData): Promise<Estado<null>> {
  const { userId } = await exigirAcesso("sessao");
  const entrada = ConsentimentoInput.safeParse(lerConsentimento(form));
  if (!entrada.success) return invalido(entrada.error);
  if (modoMock()) redirect("/painel");

  const db = await criarClienteServidor();
  try {
    await registrarAceites(db, userId, finalidadesDoAceite(entrada.data), VERSAO_CONSENTIMENTO);
    // Aceite revogado da mesma versão não é reativado pelo insert: confere em vez de assumir.
    if (!consentimentoVigente(await listarAceites(db, userId))) throw new Error("aceite não vigente após gravar");
  } catch (e) {
    console.error("consentimento: não gravado", e instanceof Error ? e.message : "erro desconhecido");
    return {
      ok: false,
      erro: { codigo: "interno", mensagem: "Não foi possível registrar o aceite agora. Tente de novo em instantes." },
    };
  }
  redirect("/painel");
}

/** Encerra só ESTA sessão (scope local); o padrão do Supabase derrubaria o usuário em todos os aparelhos. */
export async function sair(): Promise<void> {
  if (modoMock()) redirect("/");
  const db = await criarClienteServidor();
  await db.auth.signOut({ scope: "local" });
  redirect("/entrar");
}
