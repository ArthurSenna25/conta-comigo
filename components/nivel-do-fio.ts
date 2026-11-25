import type { FaixaLimite } from "@/lib/contracts";
import type { NivelFio } from "./fio-do-limite";

/**
 * Única ponte entre a FaixaLimite do lib/engine e o nível visual do FioDoLimite.
 * As telas devem usar só esta função (nunca mapear por conta própria nem recalcular pelo percentual).
 *
 * PROVISÓRIO: vale até o PR de limiares do lib/engine definir o conjunto final de faixas
 * (docs/handoff/00-LEIA-PRIMEIRO.md, decisão 5). Quando o enum mudar, só este arquivo muda.
 */
const MAPA: Record<FaixaLimite, NivelFio> = {
  ok: "folga",
  "70": "atencao",
  "90": "atencao",
  "100": "estourou",
};

export function nivelDoFio(faixa: FaixaLimite): NivelFio {
  return MAPA[faixa];
}
