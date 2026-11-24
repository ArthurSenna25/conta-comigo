// Datas de calendário no fuso do negócio (America/Sao_Paulo). Puro: recebe o instante, devolve "YYYY-MM-DD".

/** Hoje no Brasil. `sv-SE` formata como ISO (YYYY-MM-DD); 23h30 em Brasília ainda é o mesmo dia. */
export function hojeBrasil(agora: Date = new Date()): string {
  return agora.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

/** Lançamento no futuro não existe (DADOS.md: "Zod barra data futura"; o contrato só valida o formato). */
export function dataFutura(data: string, hoje: string): boolean {
  return data > hoje; // ISO compara certo como texto
}
