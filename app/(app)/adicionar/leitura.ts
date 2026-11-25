import { ErroResposta, IngestResponse, type Rascunho } from "@/lib/contracts";

/** "Enviar para a IA" libera com mais de 2 caracteres (04 § /adicionar). */
export const podeEnviarTexto = (texto: string) => texto.trim().length > 2;

export type Leitura =
  | { tipo: "rascunhos"; rascunhos: Rascunho[] }
  | { tipo: "erro"; codigo: "503" | "429" }
  | { tipo: "falha"; status: number; mensagem: string };

const SEM_RASCUNHO = "Não achamos um lançamento nesse texto. Escreva o valor e o que foi, ou preencha na mão.";
export const MSG_DEMORA = "A IA demorou mais que o esperado. Tente novamente ou preencha manualmente.";
const MSG_SEM_REDE = "Sem conexão com a internet. Confira e tente de novo.";
/** Acima do maxDuration (30 s) da rota: o que passar disso o cliente trata como demora. */
export const TEMPO_MAX_LEITURA_MS = 35_000;
const GENERICA = "Não foi possível ler agora. Tente de novo ou preencha na mão.";

/** Traduz a resposta de POST /api/ingest para a tela. Corpo fora do contrato conta como IA fora do ar. */
export function resultadoDaLeitura(status: number, corpo: unknown): Leitura {
  if (status === 429) return { tipo: "erro", codigo: "429" };
  if (status >= 500) {
    // nosso ErroResposta traz a mensagem pública (ex.: 503 ia_indisponivel); 504 sem ele é o tempo da Vercel
    const nosso = ErroResposta.safeParse(corpo);
    if (nosso.success) return { tipo: "falha", status, mensagem: nosso.data.erro.mensagem };
    if (status === 504) return { tipo: "falha", status, mensagem: MSG_DEMORA };
    return { tipo: "erro", codigo: "503" };
  }
  if (status >= 200 && status < 300) {
    const ok = IngestResponse.safeParse(corpo);
    if (!ok.success) return { tipo: "erro", codigo: "503" };
    if (ok.data.rascunhos.length === 0) return { tipo: "falha", status, mensagem: SEM_RASCUNHO };
    return { tipo: "rascunhos", rascunhos: ok.data.rascunhos };
  }
  const erro = ErroResposta.safeParse(corpo);
  return { tipo: "falha", status, mensagem: erro.success ? erro.data.erro.mensagem : GENERICA };
}

/** fetch sem resposta: estouro do tempo do cliente é demora; o resto é falta de conexão. */
export const mensagemSemResposta = (estourouTempo: boolean) => (estourouTempo ? MSG_DEMORA : MSG_SEM_REDE);
