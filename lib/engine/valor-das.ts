import type { Atividade } from "@/lib/contracts";

// Decreto nº 12.797/2025, consultado em 25/11/2026.
// https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm
const SALARIO_MINIMO_2026_CENTAVOS = 162_100;

// Fonte da alíquota de INSS e dos valores de ICMS e ISS: Receita Federal,
// MEI - atualização de valores devidos em 2026, consultada em 25/11/2026.
// https://www8.receita.fazenda.gov.br/simplesnacional/Noticias/NoticiaCompleta.aspx?id=c3b2044c-ff97-432a-b33c-ecf2a3df6dc3
const ALIQUOTA_INSS_PERCENTUAL = 5;
const ICMS_CENTAVOS = 100;
const ISS_CENTAVOS = 500;

/** Valor mensal do DAS do MEI comum em centavos, pelo ano de competência. */
export function valorDas(atividade: Atividade, ano: number): number {
  if (ano !== 2026) {
    throw new RangeError("Ano de competência do DAS não suportado");
  }

  const inssCentavos = (SALARIO_MINIMO_2026_CENTAVOS * ALIQUOTA_INSS_PERCENTUAL) / 100;
  const icmsCentavos = atividade === "servicos" ? 0 : ICMS_CENTAVOS;
  const issCentavos = atividade === "comercio" ? 0 : ISS_CENTAVOS;
  return inssCentavos + icmsCentavos + issCentavos;
}
