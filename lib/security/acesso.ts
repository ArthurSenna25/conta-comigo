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
 * O que o cadastro grava em `consentimentos`. A caixa dos termos cobre as DUAS finalidades obrigatórias:
 * gravar só uma deixaria `consentimentoVigente` falso e o usuário trancado em /consentimento.
 */
export function finalidadesDoAceite(c: ConsentimentoInput): FinalidadeConsentimento[] {
  return [...OBRIGATORIAS, ...(c.aceiteEnvioIa ? (["envio_ia"] as const) : [])];
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
