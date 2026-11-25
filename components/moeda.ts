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
