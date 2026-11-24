"use server";

import { DashboardResponse, MesISO, type Resultado } from "@/lib/contracts";
import { mockDashboard } from "@/lib/contracts/mocks";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { listarLancamentos } from "@/lib/db/lancamento";
import { lerPerfil } from "@/lib/db/perfil";
import {
  gerarAlertas,
  projecaoAnual,
  proximoVencimentoDas,
  resumoMes,
  statusLimiteMei,
  valorDas,
} from "@/lib/engine";
import { hojeBrasil } from "@/lib/security/datas";
import { modoMock } from "@/lib/security/modo-mock";
import { erro, interno, invalido } from "./resultado";
import { exigirAcesso } from "./sessao";

/** Os stubs do engine (Murilo) lançam exatamente isto. Só este erro vira painel vazio; qualquer outro é bug de verdade. */
const ehNaoImplementado = (e: unknown) => e instanceof Error && e.message === "not implemented";

/** Dia 20 seguinte (inclusive) a `hoje`. Só para o painel vazio: o DAS real vem do engine. */
function proximoDia20(hoje: string): string {
  const [ano, mes, dia] = hoje.split("-").map(Number) as [number, number, number];
  const alvo = dia <= 20 ? new Date(Date.UTC(ano, mes - 1, 20)) : new Date(Date.UTC(ano, mes, 20));
  return alvo.toISOString().slice(0, 10);
}

/**
 * Painel vazio e válido, usado só enquanto lib/engine não está implementado. `valorCentavos: 1` é marcador: o
 * contrato exige DAS positivo e a IA/action nunca inventa imposto; a tela não deve exibir esse valor como real.
 * TODO(Murilo): remover quando o engine existir (ou o contrato aceitar `proximoDas` nulo, em PR próprio).
 */
function dashboardVazio(mes: string, hoje: string): DashboardResponse {
  return {
    resumoMes: { mes, receitaCentavos: 0, despesaCentavos: 0, saldoCentavos: 0, despesasPorCategoria: [] },
    limiteMei: { usadoCentavos: 0, limiteCentavos: 0, pct: 0, faixa: "ok", projecaoAnualCentavos: 0 },
    proximoDas: { vencimento: proximoDia20(hoje), valorCentavos: 1 },
    alertas: [],
  };
}

/**
 * Painel do mês. Lê perfil e lançamentos (do ano, mais os últimos meses do ano anterior para os alertas) e entrega
 * ao lib/engine; esta action NÃO calcula nada. `mes` "YYYY-MM" (padrão: mês atual em Brasília).
 */
export async function obterDashboard(mes?: unknown): Promise<Resultado<DashboardResponse>> {
  const hoje = hojeBrasil();
  const parsed = MesISO.safeParse(mes ?? hoje.slice(0, 7));
  if (!parsed.success) return invalido(parsed.error);
  if (modoMock()) return { ok: true, dados: mockDashboard };

  const { userId } = await exigirAcesso();
  try {
    const db = await criarClienteServidor();
    const perfil = await lerPerfil(db, userId);
    if (!perfil) return erro("nao_encontrado");
    const ano = Number(hoje.slice(0, 4));
    const lancamentos = await listarLancamentos(db, userId, { de: `${ano - 1}-10-01`, ate: `${ano + 1}-01-01` });

    try {
      const receitasAno = lancamentos
        .filter((l) => l.tipo === "receita" && l.data.startsWith(String(ano)))
        .reduce((soma, l) => soma + l.valorCentavos, 0);
      const entrada = { receitasAnoCentavos: receitasAno + perfil.receitaInicialCentavos, dataAbertura: perfil.dataAbertura, hoje };
      const resposta: DashboardResponse = {
        resumoMes: resumoMes(lancamentos, parsed.data),
        limiteMei: { ...statusLimiteMei(entrada), projecaoAnualCentavos: projecaoAnual(entrada) },
        proximoDas: { vencimento: proximoVencimentoDas(hoje), valorCentavos: valorDas(perfil.atividade, ano) },
        alertas: gerarAlertas({ perfil, lancamentos, hoje }),
      };
      return { ok: true, dados: DashboardResponse.parse(resposta) };
    } catch (e) {
      if (ehNaoImplementado(e)) return { ok: true, dados: dashboardVazio(parsed.data, hoje) };
      throw e;
    }
  } catch (e) {
    return interno("obterDashboard", e);
  }
}
