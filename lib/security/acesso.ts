import { VERSAO_CONSENTIMENTO, type ConsentimentoInput, type FinalidadeConsentimento } from "@/lib/contracts";

/** Linha de `consentimentos` já lida do banco (só o que a regra precisa). */
export type AceiteRegistrado = {
  finalidade: FinalidadeConsentimento;
  versao: string;
  revogadoEm: string | null;
};

export type EstadoAcesso = {
  logado: boolean;
  consentimentoVigente: boolean;
  temPerfil: boolean;
};

const OBRIGATORIAS: FinalidadeConsentimento[] = ["termos_uso", "privacidade"];

/**
 * O que o cadastro grava em `consentimentos`: cada caixa grava só a sua finalidade. O contrato já exige as
 * duas obrigatórias; sem uma delas `consentimentoVigente` seria falso e o usuário ficaria preso em /consentimento.
 */
export function finalidadesDoAceite(c: ConsentimentoInput): FinalidadeConsentimento[] {
  // `aceiteTermosUso` e `aceitePrivacidade` são `true` por contrato: cada um mapeia 1:1 a sua finalidade.
  return [
    ...(c.aceiteTermosUso ? (["termos_uso"] as const) : []),
    ...(c.aceitePrivacidade ? (["privacidade"] as const) : []),
    ...(c.aceiteEnvioIa ? (["envio_ia"] as const) : []),
  ];
}

/** Vigente = termos e privacidade aceitos na versão atual e não revogados. `envio_ia` é opcional. */
export function consentimentoVigente(aceites: AceiteRegistrado[], versaoAtual = VERSAO_CONSENTIMENTO): boolean {
  return OBRIGATORIAS.every((finalidade) =>
    aceites.some((a) => a.finalidade === finalidade && a.versao === versaoAtual && a.revogadoEm === null),
  );
}

/**
 * Portão do app autenticado: sessão → consentimento → perfil.
 * Devolve para onde mandar o usuário, ou null se pode seguir. Consentimento vem antes do perfil:
 * quem ficou sem aceite (falha parcial no cadastro) não usa nada do app.
 */
export function destinoDoAcesso(e: EstadoAcesso): "/entrar" | "/consentimento" | "/onboarding" | null {
  if (!e.logado) return "/entrar";
  if (!e.consentimentoVigente) return "/consentimento";
  if (!e.temPerfil) return "/onboarding";
  return null;
}
