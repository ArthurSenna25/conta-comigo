import { Categoria, MesISO, type Lancamento, type ResumoMes } from "@/lib/contracts";

function somarCentavos(total: number, valor: number): number {
  const soma = total + valor;
  if (!Number.isSafeInteger(soma)) {
    throw new RangeError("O total mensal ultrapassa o limite de inteiros seguros em centavos");
  }
  return soma;
}

/** Resume os lançamentos do mês civil informado no formato YYYY-MM. */
export function resumoMes(lancamentos: readonly Lancamento[], mes: string): ResumoMes {
  if (!MesISO.safeParse(mes).success) {
    throw new RangeError("O mês deve estar no formato YYYY-MM, com mês entre 01 e 12");
  }

  let receitaCentavos = 0;
  let despesaCentavos = 0;
  const totaisPorCategoria = new Map<Categoria, number>();

  for (const { data, tipo, categoria, valorCentavos } of lancamentos) {
    if (data.slice(0, 7) !== mes) continue;

    if (tipo === "receita") {
      receitaCentavos = somarCentavos(receitaCentavos, valorCentavos);
    } else {
      despesaCentavos = somarCentavos(despesaCentavos, valorCentavos);
      // Como as despesas são positivas, cada subtotal cabe no total já verificado.
      const totalCategoria = totaisPorCategoria.get(categoria) ?? 0;
      totaisPorCategoria.set(categoria, totalCategoria + valorCentavos);
    }
  }

  // A ordenação estável preserva a ordem do enum quando os totais empatam.
  const despesasPorCategoria = Categoria.options.flatMap((categoria) => {
    const totalCentavos = totaisPorCategoria.get(categoria);
    return totalCentavos === undefined ? [] : [{ categoria, totalCentavos }];
  }).sort((a, b) => b.totalCentavos - a.totalCentavos);

  return {
    mes,
    receitaCentavos,
    despesaCentavos,
    saldoCentavos: receitaCentavos - despesaCentavos,
    despesasPorCategoria,
  };
}
