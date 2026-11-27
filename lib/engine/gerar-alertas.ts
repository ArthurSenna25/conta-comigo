import { DataISO, type Alerta, type Lancamento } from "@/lib/contracts";
import type { EstadoAlertas } from "./index";
import { LIMIAR_100_MEI } from "./limiares-mei";
import { proximoVencimentoDas } from "./proximo-vencimento-das";
import { receitaAnualCentavos } from "./receita-anual";
import { statusLimiteMei } from "./status-limite-mei";

const MILISSEGUNDOS_POR_DIA = 86_400_000;

function alertaDas(hoje: string, dataAbertura: string): Alerta | undefined {
  const vencimento = proximoVencimentoDas(hoje);
  const dias = (Date.parse(vencimento) - Date.parse(hoje)) / MILISSEGUNDOS_POR_DIA;
  if (dias !== 7 && dias !== 2) return;

  // A competência é o mês anterior ao vencimento ordinário do DAS.
  const competencia = new Date(vencimento);
  competencia.setUTCMonth(competencia.getUTCMonth() - 1, 1);
  if (competencia.toISOString().slice(0, 7) < dataAbertura.slice(0, 7)) return;

  return {
    chave: `das_vencendo:${vencimento.slice(0, 7)}`,
    tipo: "das_vencendo",
    severidade: dias === 2 ? "atencao" : "info",
    titulo: `Vencimento do DAS em ${dias} dias`,
    mensagem: "Confira a guia do DAS para a data indicada.",
    vencimento,
    lancamentoId: null,
  };
}

function alertaLimite(estado: EstadoAlertas, lancamentos: readonly Lancamento[]): Alerta | undefined {
  const { perfil, hoje } = estado;
  const ano = hoje.slice(0, 4);
  const { faixa, usadoCentavos, limiteCentavos } = statusLimiteMei({
    receitasAnoCentavos: receitaAnualCentavos(perfil, lancamentos, hoje),
    dataAbertura: perfil.dataAbertura,
    hoje,
  });
  if (faixa === "ok") return;

  const critico = Number(faixa) === LIMIAR_100_MEI;
  const titulo = critico
    ? usadoCentavos === limiteCentavos ? "Limite do MEI atingido" : "Limite do MEI ultrapassado"
    : `Você já usou pelo menos ${faixa}% do limite do MEI`;

  return {
    chave: `limite_mei:${ano}:${faixa}`,
    tipo: "limite_mei",
    severidade: critico ? "critico" : "atencao",
    titulo,
    mensagem: "Confira o faturamento acumulado e o limite do MEI para este ano.",
    vencimento: null,
    lancamentoId: null,
  };
}

function alertaNotaFaltando(
  lancamentos: readonly Lancamento[],
  anoReferencia: string,
): Alerta | undefined {
  const lancamentoIds = lancamentos
    .filter(({ tipo, categoria, documentoId }) =>
      tipo === "despesa" && (categoria === "estoque" || categoria === "frete") && documentoId === null,
    )
    .map(({ id }) => id)
    .sort();
  const quantidade = lancamentoIds.length;
  if (quantidade === 0) return;

  return {
    chave: `nota_faltando:${anoReferencia}`,
    tipo: "nota_faltando",
    severidade: "info",
    titulo: `${quantidade} ${quantidade === 1 ? "despesa" : "despesas"} de estoque ou frete sem comprovante`,
    mensagem: "Guarde os comprovantes, se estiverem disponíveis.",
    vencimento: null,
    lancamentoId: null,
    lancamentoIds,
  };
}

/** Calcula alertas com os lançamentos confirmados, incluindo o ano inteiro para o limite do MEI. */
export function gerarAlertas(estado: EstadoAlertas): Alerta[] {
  const { perfil, hoje } = estado;
  if (!DataISO.safeParse(hoje).success) {
    throw new RangeError("A data de referência deve ser uma data civil válida no formato YYYY-MM-DD");
  }
  if (perfil.dataAbertura > hoje) {
    throw new RangeError("A data de abertura é posterior à data de referência");
  }

  const lancamentosPorId = new Map<string, Lancamento>();
  for (const lancamento of estado.lancamentos) {
    if (lancamento.data >= perfil.dataAbertura && lancamento.data <= hoje && !lancamentosPorId.has(lancamento.id)) {
      lancamentosPorId.set(lancamento.id, lancamento);
    }
  }
  const lancamentos = [...lancamentosPorId.values()];
  const alertas: Alerta[] = [];
  if (perfil.ehMei) {
    const das = alertaDas(hoje, perfil.dataAbertura);
    const limite = alertaLimite(estado, lancamentos);
    if (das) alertas.push(das);
    if (limite) alertas.push(limite);
  }

  const nota = alertaNotaFaltando(lancamentos, hoje.slice(0, 4));
  if (nota) alertas.push(nota);
  return alertas;
}
