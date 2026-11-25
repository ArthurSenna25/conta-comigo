/**
 * Dados de EXEMPLO da seção "O limite" (05-LANDING.md). Não são do usuário nem do lib/engine:
 * só ilustram o Fio. Valores em centavos.
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

export type NivelExemplo = "folga" | "atencao" | "estourou";

/** Regra visual de 03-COMPONENTES (80% atenção, acima de 100% estourou). Ilustração, não cálculo fiscal. */
export function nivelExemplo(acumuladoCentavos: number, tetoCentavos = TETO_EXEMPLO_CENTAVOS): NivelExemplo {
  const pct = (acumuladoCentavos / tetoCentavos) * 100;
  if (pct > 100) return "estourou";
  return pct >= 80 ? "atencao" : "folga";
}

/** Cada barra com a altura relativa ao maior mês e o nível pelo acumulado até ela. */
export function barrasExemplo() {
  const maior = Math.max(...MESES_EXEMPLO.map((m) => m.centavos));
  let acumulado = 0;
  return MESES_EXEMPLO.map(({ mes, centavos }) => {
    acumulado += centavos;
    return { mes, centavos, altura: centavos / maior, nivel: nivelExemplo(acumulado) };
  });
}

export const TOTAL_EXEMPLO_CENTAVOS = MESES_EXEMPLO.reduce((soma, m) => soma + m.centavos, 0);
