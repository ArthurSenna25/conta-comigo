import type { Lancamento, Perfil } from "@/lib/contracts";

const anoEmSaoPaulo = new Intl.DateTimeFormat("pt-BR", {
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export function receitaAnualCentavos(perfil: Perfil, lancamentos: readonly Lancamento[], hoje: string): number {
  const ano = hoje.slice(0, 4);
  let total = anoEmSaoPaulo.format(new Date(perfil.criadoEm)) === ano ? perfil.receitaInicialCentavos : 0;
  const ids = new Set<string>();
  for (const { id, tipo, data, valorCentavos } of lancamentos) {
    if (tipo !== "receita" || data.slice(0, 4) !== ano || data < perfil.dataAbertura || data > hoje || ids.has(id)) continue;
    ids.add(id);
    total += valorCentavos;
    if (!Number.isSafeInteger(total)) {
      throw new RangeError("A receita anual ultrapassa o limite de inteiros seguros em centavos");
    }
  }
  return total;
}
