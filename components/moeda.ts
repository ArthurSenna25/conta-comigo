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

export type ColagemMoeda = { ok: true; centavos: number } | { ok: false; erro: string };

export const ERRO_COLAGEM = "Não entendi esse valor. Digite, por exemplo, 1.234,56.";
export const ERRO_COLAGEM_NEGATIVO = "O valor deve ser positivo.";

const MILHAR = /^\d{1,3}([.,])\d{3}(\1\d{3})*$/;
const DECIMAL = /^(\d+|\d{1,3}([.,])\d{3}(\2\d{3})*)([.,])(\d{1,2})$/;

function parseValorColado(limpo: string): number | null {
  if (/^\d+$/.test(limpo)) return Number(limpo) * 100;
  if (MILHAR.test(limpo)) return Number(limpo.replace(/\D/g, "")) * 100;
  const m = DECIMAL.exec(limpo);
  if (!m || (m[2] && m[2] === m[4])) return null;
  return Number(`${m[1].replace(/\D/g, "")}${m[5].padEnd(2, "0")}`);
}

/**
 * Texto colado → centavos só quando é um valor monetário claro (inteiro, milhar "1.000"/"1,000" ou decimal com até
 * 2 casas, "R$" e espaços opcionais). Qualquer outra coisa é recusada e o campo não muda.
 */
export function centavosDoTextoColado(texto: string): ColagemMoeda {
  const limpo = texto.replace(/R\$/gi, "").replace(/\s/g, "");
  const negativo = limpo.startsWith("-");
  const corpo = negativo ? limpo.slice(1) : limpo;
  const centavos = /^[\d.,]+$/.test(corpo) ? parseValorColado(corpo) : null;
  if (centavos === null) return { ok: false, erro: ERRO_COLAGEM };
  if (negativo) return { ok: false, erro: ERRO_COLAGEM_NEGATIVO };
  return { ok: true, centavos };
}
