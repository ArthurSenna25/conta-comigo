import { ErroResposta, IngestResponse, type Rascunho } from "@/lib/contracts";

/** "Enviar para a IA" libera com mais de 2 caracteres (04 § /adicionar). */
export const podeEnviarTexto = (texto: string) => texto.trim().length > 2;

export type Leitura =
  | { tipo: "rascunhos"; rascunhos: Rascunho[] }
  | { tipo: "erro"; codigo: "503" | "429" }
  | { tipo: "falha"; status: number; mensagem: string };

const SEM_RASCUNHO = "Não achamos um lançamento nesse texto. Escreva o valor e o que foi, ou preencha na mão.";
const GENERICA = "Não foi possível ler agora. Tente de novo ou preencha na mão.";

/** Traduz a resposta de POST /api/ingest para a tela. Corpo fora do contrato conta como IA fora do ar. */
export function resultadoDaLeitura(status: number, corpo: unknown): Leitura {
  if (status === 429) return { tipo: "erro", codigo: "429" };
  if (status >= 500) return { tipo: "erro", codigo: "503" };
  if (status >= 200 && status < 300) {
    const ok = IngestResponse.safeParse(corpo);
    if (!ok.success) return { tipo: "erro", codigo: "503" };
    if (ok.data.rascunhos.length === 0) return { tipo: "falha", status, mensagem: SEM_RASCUNHO };
    return { tipo: "rascunhos", rascunhos: ok.data.rascunhos };
  }
  const erro = ErroResposta.safeParse(corpo);
  return { tipo: "falha", status, mensagem: erro.success ? erro.data.erro.mensagem : GENERICA };
}
