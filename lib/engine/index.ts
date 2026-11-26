/**
 * Motor de regras: PURO e determinístico. Datas como "YYYY-MM-DD" (fuso
 * America/Sao_Paulo resolvido na borda), dinheiro em centavos inteiros.
 * Dono: Murilo. Cada função ganha seu arquivo + teste ao ser implementada.
 */
import type {
  Lancamento,
  Perfil,
} from "@/lib/contracts";

export { statusLimiteMei } from "./status-limite-mei";
export { projecaoAnual } from "./projecao-anual";

export { valorDas } from "./valor-das";

export { proximoVencimentoDas } from "./proximo-vencimento-das";

export { anoDaCompetenciaDas } from "./competencia-das";

export type EntradaLimite = {
  /** Receitas confirmadas do ano + receitaInicialCentavos do perfil. */
  receitasAnoCentavos: number;
  /** No ano de abertura o limite é proporcional aos meses. */
  dataAbertura: string;
  hoje: string;
};

export { resumoMes } from "./resumo-mes";
export { receitaAnualCentavos } from "./receita-anual";

export type EstadoAlertas = {
  perfil: Perfil;
  /** Receitas do ano civil e lançamentos do período que deve gerar lembretes. */
  lancamentos: readonly Lancamento[];
  hoje: string;
};

export { gerarAlertas } from "./gerar-alertas";
