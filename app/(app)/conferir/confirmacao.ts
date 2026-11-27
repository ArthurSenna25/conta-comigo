import type { ConfirmarResponse, Resultado } from "@/lib/contracts";
import type { Aviso } from "@/app/(app)/fluxo-lancamento";

export const MSG_AMBIGUA = "Não sabemos se o lançamento foi salvo. Confira em Lançamentos antes de confirmar de novo.";

export type Desfecho =
  | { tipo: "salvo"; quantidade: number }
  | { tipo: "ambiguo" } // pode ter gravado: sem nova tentativa automática, rascunho preservado
  | { tipo: "corrigir"; mensagem: string }; // recusa clara (4xx): o usuário corrige e reenvia

/** Exceção (rede, timeout) e erro "interno" (5xx) não dizem se gravou; o resto é recusa clara. */
export function desfechoDaConfirmacao(r: Resultado<ConfirmarResponse> | "excecao"): Desfecho {
  if (r === "excecao") return { tipo: "ambiguo" };
  if (r.ok) return { tipo: "salvo", quantidade: r.dados.lancamentos.length };
  if (r.erro.codigo === "interno") return { tipo: "ambiguo" };
  return { tipo: "corrigir", mensagem: r.erro.mensagem };
}

/** Um envio por vez (clique duplo, toque rápido). Sucesso não solta: a tela já está navegando. */
export function criarTrava() {
  let ocupada = false;
  return {
    pegar: () => (ocupada ? false : (ocupada = true)),
    soltar: () => {
      ocupada = false;
    },
  };
}

export const MSG_TENTAR_DE_NOVO = "Já conferi e não está lá, tentar de novo";

/**
 * Aviso ao descartar. "Nada foi salvo" só vale se nenhuma confirmação ficou incerta; senão manda conferir.
 * Manual sem incerteza não avisa nada (a pessoa só cancelou o formulário).
 */
export function avisoDoDescarte(manual: boolean, incerto: boolean): Aviso | null {
  if (incerto) return { titulo: "Rascunho descartado", sub: "Confira em Lançamentos se o lançamento chegou a ser salvo" };
  return manual ? null : { titulo: "Rascunho descartado", sub: "Nada foi salvo" };
}
