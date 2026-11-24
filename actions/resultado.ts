import "server-only";
import type { ZodError } from "zod";
import type { CodigoErro, Resultado } from "@/lib/contracts";
import { camposDoErro } from "./formularios";

// Helpers de erro das actions de dados. NÃO é "use server": exporta funções síncronas.

const MENSAGEM: Record<"invalido" | "nao_encontrado" | "interno", string> = {
  invalido: "Confira os dados e tente de novo.",
  nao_encontrado: "Não encontramos o que você procura.",
  interno: "Algo deu errado. Tente de novo em instantes.",
};

export function erro(codigo: keyof typeof MENSAGEM, mensagem = MENSAGEM[codigo]): Resultado<never> {
  return { ok: false, erro: { codigo: codigo satisfies CodigoErro, mensagem } };
}

/** Erro de validação do Zod: mensagens do contrato por campo, nunca o valor digitado. */
export function invalido(e: ZodError): Resultado<never> {
  return { ok: false, erro: { codigo: "invalido", mensagem: MENSAGEM.invalido, campos: camposDoErro(e) } };
}

/**
 * Falha inesperada: o usuário recebe mensagem genérica; o log leva só a operação e o código (AMEACAS #10).
 * Erro nosso (`new Error` de lib/db, só "falha ao X (código)") loga a mensagem; qualquer outro, só o nome do tipo,
 * porque ZodError, erro de rede e afins podem carregar dado.
 */
export function interno(contexto: string, e: unknown): Resultado<never> {
  const detalhe = e instanceof Error ? (e.constructor === Error ? e.message : e.name) : "desconhecido";
  console.error(`[${contexto}] ${detalhe}`);
  return erro("interno");
}
