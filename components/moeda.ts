const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const COMPACTO = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

/** Centavos inteiros → "R$ 34.020,00" (o Intl põe espaço não separável depois de "R$"). */
export function formatarCentavos(centavos: number): string {
  return BRL.format(centavos / 100);
}

/** Centavos → "81 mil" (legenda do Fio). */
export function formatarCompacto(centavos: number): string {
  return COMPACTO.format(centavos / 100);
}

const SEM_SIMBOLO = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Centavos inteiros → "34.020,00" (campo de valor, com "R$" fixo ao lado). */
export function formatarSemSimbolo(centavos: number): string {
  return SEM_SIMBOLO.format(centavos / 100);
}

/**
 * Texto colado → centavos, sem perder nada. Termina em separador + 1 ou 2 dígitos ("10,5", "1.234,56", "1,234.56")
 * é decimal; o resto é milhar ("1.000" = 1000,00). Letras e símbolos (R$, espaço) são ignorados.
 * Acima de ~15 dígitos o número perde precisão, mas já está muito acima do teto do contrato e é recusado.
 */
export function centavosDoTextoColado(texto: string): number {
  const limpo = texto.replace(/[^\d.,]/g, "");
  const decimal = /^(.*?)[.,](\d{1,2})$/.exec(limpo);
  const inteiro = (decimal ? decimal[1] : limpo).replace(/\D/g, "");
  const frac = decimal ? decimal[2].padEnd(2, "0") : "00";
  const digitos = `${inteiro}${frac}`.replace(/^0+/, "");
  return digitos ? Number(digitos) : 0;
}
