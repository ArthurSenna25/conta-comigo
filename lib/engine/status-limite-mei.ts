import type { StatusLimiteMei } from "@/lib/contracts";
import type { EntradaLimite } from "./index";

const LIMITE_MENSAL_CENTAVOS = 675_000;

export function statusLimiteMei({ receitasAnoCentavos, dataAbertura, hoje }: EntradaLimite): StatusLimiteMei {
  if (dataAbertura > hoje) {
    throw new RangeError("A data de abertura é posterior à data de referência");
  }

  const abriuNesteAno = dataAbertura.slice(0, 4) === hoje.slice(0, 4);
  const mesInicial = abriuNesteAno ? Number(dataAbertura.slice(5, 7)) : 1;
  const limiteCentavos = (13 - mesInicial) * LIMITE_MENSAL_CENTAVOS;
  const pct = (receitasAnoCentavos * 100) / limiteCentavos;
  const faixa = pct >= 100 ? "100" : pct >= 90 ? "90" : pct >= 70 ? "70" : "ok";

  return { usadoCentavos: receitasAnoCentavos, limiteCentavos, pct, faixa };
}
