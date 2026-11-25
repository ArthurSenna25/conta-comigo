// Datas de calendário no fuso do negócio (America/Sao_Paulo). Puro: recebe o instante, devolve "YYYY-MM-DD".

export { hojeBrasil } from "@/lib/contracts/comum";

/** Lançamento no futuro não existe (DADOS.md: "Zod barra data futura"; o contrato só valida o formato). */
export function dataFutura(data: string, hoje: string): boolean {
  return data > hoje; // ISO compara certo como texto
}
