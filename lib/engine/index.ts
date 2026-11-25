/**
 * Motor de regras: PURO e determinístico. Datas como "YYYY-MM-DD" (fuso
 * America/Sao_Paulo resolvido na borda), dinheiro em centavos inteiros.
 * Dono: Murilo. Cada função ganha seu arquivo + teste ao ser implementada.
 */
import type {
  Alerta,
  Atividade,
  Lancamento,
  Perfil,
  ResumoMes,
} from "@/lib/contracts";

export { statusLimiteMei } from "./status-limite-mei";
export { projecaoAnual } from "./projecao-anual";

/** DAS-MEI do ano: 5% do salário mínimo + R$ 1 (ICMS) e/ou R$ 5 (ISS). Em centavos. */
export function valorDas(atividade: Atividade, ano: number): number {
  void atividade;
  void ano;
  throw new Error("not implemented");
}

/** Próximo dia 20 a partir de `hoje` (inclusive). */
export function proximoVencimentoDas(hoje: string): string {
  void hoje;
  throw new Error("not implemented");
}

export type EntradaLimite = {
  /** Receitas confirmadas do ano + receitaInicialCentavos do perfil. */
  receitasAnoCentavos: number;
  /** No ano de abertura o limite é proporcional aos meses. */
  dataAbertura: string;
  hoje: string;
};

/** `mes` = "YYYY-MM". Só lançamentos do mês entram. */
export function resumoMes(lancamentos: readonly Lancamento[], mes: string): ResumoMes {
  void lancamentos;
  void mes;
  throw new Error("not implemented");
}

export type EstadoAlertas = {
  perfil: Perfil;
  /** Pelo menos os últimos 3 meses (despesa atípica compara com a média). */
  lancamentos: readonly Lancamento[];
  hoje: string;
};

/** DAS (7 e 2 dias antes), limite 70/90/100, despesa atípica, mistura PF/PJ, nota faltando. */
export function gerarAlertas(estado: EstadoAlertas): Alerta[] {
  void estado;
  throw new Error("not implemented");
}
