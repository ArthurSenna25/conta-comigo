import type { NivelFio } from "@/components/fio-do-limite";
import { nivelDoFio } from "@/components/nivel-do-fio";
import { statusLimiteMei } from "@/lib/engine";

/**
 * Dados de EXEMPLO da seção "O limite" (05-LANDING.md). Não são do usuário: só ilustram o Fio.
 * Valores em centavos.
 * Teto R$ 81.000,00: LC 123/2006, art. 18-A, § 1º, consultado em 24/11/2026 em planalto.gov.br
 * (proporcional R$ 6.750,00/mês no § 2º, mesma data).
 * §§ 1º e 2º trazem 'Vide LC 238/2026'; conferir art. 10 antes de qualquer menção.
 */
export const TETO_EXEMPLO_CENTAVOS = 8_100_000;

export const MESES_EXEMPLO = [
  { mes: "jan", centavos: 520_000 },
  { mes: "fev", centavos: 610_000 },
  { mes: "mar", centavos: 680_000 },
  { mes: "abr", centavos: 740_000 },
  { mes: "mai", centavos: 700_000 },
  { mes: "jun", centavos: 790_000 },
  { mes: "jul", centavos: 830_000 },
  { mes: "ago", centavos: 860_000 },
  { mes: "set", centavos: 890_000 },
  { mes: "out", centavos: 910_000 },
  { mes: "nov", centavos: 894_000 },
] as const;

/** MEI aberto antes do ano do exemplo: o engine usa o teto cheio de R$ 81 mil. */
const DATAS_EXEMPLO = { dataAbertura: "2025-01-01", hoje: "2026-11-30" } as const;

/** Quem decide a faixa é o lib/engine; nivelDoFio só a traduz para o desenho. */
export function nivelExemplo(acumuladoCentavos: number): NivelFio {
  return nivelDoFio(statusLimiteMei({ receitasAnoCentavos: acumuladoCentavos, ...DATAS_EXEMPLO }).faixa);
}

export interface BarraExemplo {
  mes: string;
  centavos: number;
  /** Altura relativa ao maior mês (0..1). */
  altura: number;
  /** Nível pelo acumulado até esta barra. */
  nivel: NivelFio;
}

export function barrasExemplo(): BarraExemplo[] {
  const maior = Math.max(...MESES_EXEMPLO.map((m) => m.centavos));
  let acumulado = 0;
  return MESES_EXEMPLO.map(({ mes, centavos }) => {
    acumulado += centavos;
    return { mes, centavos, altura: centavos / maior, nivel: nivelExemplo(acumulado) };
  });
}

export const TOTAL_EXEMPLO_CENTAVOS = MESES_EXEMPLO.reduce((soma, m) => soma + m.centavos, 0);

/** Scroll (0..1) → barra i preenche clamp(progresso × n − i, 0, 1) (05-LANDING.md, "Mecânica"). */
export function preenchimento(progresso: number, i: number, n: number): number {
  return Math.min(1, Math.max(0, progresso * n - i));
}

/** Total desenhado no Fio: soma de cada mês × seu preenchimento. */
export function totalNoProgresso(barras: readonly { centavos: number }[], progresso: number): number {
  return barras.reduce((soma, b, i) => soma + b.centavos * preenchimento(progresso, i, barras.length), 0);
}

/** Meses já cheios: o odômetro e o status andam mês a mês. */
export function mesesCheios(progresso: number, n: number): number {
  return Math.min(n, Math.max(0, Math.floor(progresso * n)));
}
