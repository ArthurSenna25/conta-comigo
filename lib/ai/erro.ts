import type { CodigoErro } from "@/lib/contracts";

const FALHAS = {
  entrada: ["invalido", 400, "Confira a entrada e envie novamente."],
  configuracao: ["ia_indisponivel", 503, "A IA ainda não está configurada. Você pode preencher manualmente."],
  autenticacao: ["ia_indisponivel", 503, "O provedor de IA está indisponível. Você pode preencher manualmente."],
  cota: ["limite_ia", 429, "O limite de uso da IA foi atingido. Você pode preencher manualmente."],
  cota_provedor: ["limite_ia", 429, "O Gemini atingiu um limite de uso. Tente novamente mais tarde ou preencha manualmente."],
  tempo: ["ia_indisponivel", 504, "A IA demorou para responder. Você pode preencher manualmente."],
  rede: ["ia_indisponivel", 503, "Falha na conexão com a IA. Você pode preencher manualmente."],
  indisponivel: ["ia_indisponivel", 503, "A IA está temporariamente indisponível. Você pode preencher manualmente."],
  resposta: ["ia_indisponivel", 502, "A IA não conseguiu interpretar a entrada com segurança. Você pode preencher manualmente."],
  bloqueio: ["ia_indisponivel", 422, "A IA não conseguiu processar esse conteúdo. Você pode preencher manualmente."],
  controle: ["ia_indisponivel", 503, "O controle de uso da IA está indisponível. Você pode preencher manualmente."],
} as const satisfies Record<string, readonly [CodigoErro, number, string]>;

export type MotivoIa = keyof typeof FALHAS;

/** Somente mensagens públicas fixas. Nunca encadeia a exceção do SDK. */
export class ErroIa extends Error {
  readonly codigo: CodigoErro;
  readonly status: number;

  constructor(readonly motivo: MotivoIa) {
    const [codigo, status, mensagem] = FALHAS[motivo];
    super(mensagem);
    this.name = "ErroIa";
    this.codigo = codigo;
    this.status = status;
  }
}
