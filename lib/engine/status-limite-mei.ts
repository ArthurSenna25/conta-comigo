import type { StatusLimiteMei } from "@/lib/contracts";
import type { EntradaLimite } from "./index";
import { LIMIAR_70_MEI, LIMIAR_90_MEI, LIMIAR_100_MEI } from "./limiares-mei";

const LIMITE_MENSAL_CENTAVOS = 675_000;

export function statusLimiteMei({ receitasAnoCentavos, dataAbertura, hoje }: EntradaLimite): StatusLimiteMei {
  if (dataAbertura > hoje) {
    throw new RangeError("A data de abertura é posterior à data de referência");
  }

  const abriuNesteAno = dataAbertura.slice(0, 4) === hoje.slice(0, 4);
  const mesInicial = abriuNesteAno ? Number(dataAbertura.slice(5, 7)) : 1;
  const limiteCentavos = (13 - mesInicial) * LIMITE_MENSAL_CENTAVOS;
  const pct = (receitasAnoCentavos * 100) / limiteCentavos;
  const faixa = pct >= LIMIAR_100_MEI ? "100"
    : pct >= LIMIAR_90_MEI ? "90"
    : pct >= LIMIAR_70_MEI ? "70"
    : "ok";

  return { usadoCentavos: receitasAnoCentavos, limiteCentavos, pct, faixa };
}
