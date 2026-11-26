import { VALOR_MAX_CENTAVOS } from "@/lib/contracts/comum";

/** null preserva a receita atual. NaN representa entrada inválida. */
export function lerReceitaInicial(entrada: FormDataEntryValue | null): number | null {
  if (entrada === null) return null;
  if (typeof entrada !== "string") return NaN;
  const valor = entrada.trim();
  if (valor === "") return null;

  const brasileiro = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(valor);
  const decimalComPonto = /^\d+\.\d{1,2}$/.test(valor);
  if (!brasileiro && !decimalComPonto) return NaN;

  const [reais, centavos = ""] = brasileiro
    ? valor.replaceAll(".", "").split(",")
    : valor.split(".");
  const total = Number(reais + centavos.padEnd(2, "0"));
  return total <= VALOR_MAX_CENTAVOS ? total : NaN;
}

export function receitaParaCampo(centavos: number): string {
  const reais = Math.trunc(centavos / 100);
  return `${reais.toLocaleString("pt-BR")},${String(centavos % 100).padStart(2, "0")}`;
}
