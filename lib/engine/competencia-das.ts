import { DataISO } from "@/lib/contracts";

/** Ano da competência do DAS: o DAS vence no mês seguinte à competência (janeiro de ANO => competência de ANO-1). */
export function anoDaCompetenciaDas(vencimento: string): number {
  if (!DataISO.safeParse(vencimento).success) {
    throw new RangeError("Vencimento do DAS inválido");
  }
  const ano = Number(vencimento.slice(0, 4));
  return vencimento.slice(5, 7) === "01" ? ano - 1 : ano;
}
