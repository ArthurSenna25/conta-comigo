"use server";

import { type Atividade, DashboardResponse, MesISO, type Resultado } from "@/lib/contracts";
import { mockDashboard } from "@/lib/contracts/mocks";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { listarLancamentos } from "@/lib/db/lancamento";
import { lerPerfil } from "@/lib/db/perfil";
import {
  anoDaCompetenciaDas,
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

/** `valorDas` lança RangeError para competência sem tabela oficial; só esse caso vira null. */
function valorDasOuNulo(atividade: Atividade, ano: number): number | null {
  try {
    return valorDas(atividade, ano);
  } catch (e) {
    if (e instanceof RangeError) return null;
    throw e;
  }
}

/** Dia 20 seguinte (inclusive) a `hoje`. Só para o painel vazio: o DAS real vem do engine. */
function proximoDia20(hoje: string): string {
  const [ano, mes, dia] = hoje.split("-").map(Number) as [number, number, number];
  const alvo = dia <= 20 ? new Date(Date.UTC(ano, mes - 1, 20)) : new Date(Date.UTC(ano, mes, 20));
  return alvo.toISOString().slice(0, 10);
}

/**
 * Painel vazio e válido, usado só quando não há valor oficial do DAS (competência sem tabela, a partir de 01/2027).
 * `valorCentavos: 1` é marcador: o contrato exige DAS positivo e a action nunca inventa imposto; a tela não deve
 * exibir esse valor como real. TODO: remover quando o contrato aceitar `proximoDas` nulo (PR próprio) ou a tabela 2027.
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
  const acesso = modoMock() ? null : await exigirAcesso();
  const hoje = hojeBrasil();
  const parsed = MesISO.safeParse(mes ?? hoje.slice(0, 7));
  if (!parsed.success) return invalido(parsed.error);
  if (!acesso) return { ok: true, dados: mockDashboard };

  const { userId } = acesso;
  try {
    const db = await criarClienteServidor();
    const perfil = await lerPerfil(db, userId);
    if (!perfil) return erro("nao_encontrado");
    const ano = Number(hoje.slice(0, 4));
    const anoDoMes = Number(parsed.data.slice(0, 4));
    // cobre o ano corrente (limite do MEI), o mês pedido e os 3 meses anteriores a cada um (alertas)
    const lancamentos = await listarLancamentos(db, userId, {
      de: `${Math.min(ano, anoDoMes) - 1}-10-01`,
      ate: `${Math.max(ano, anoDoMes) + 1}-01-01`,
    });

    const receitasAno = lancamentos
      .filter((l) => l.tipo === "receita" && l.data.startsWith(String(ano)))
      .reduce((soma, l) => soma + l.valorCentavos, 0);
    const entrada = { receitasAnoCentavos: receitasAno + perfil.receitaInicialCentavos, dataAbertura: perfil.dataAbertura, hoje };
    const vencimento = proximoVencimentoDas(hoje);
    const valorDoDas = valorDasOuNulo(perfil.atividade, anoDaCompetenciaDas(vencimento));
    // sem valor oficial para a competência: painel vazio (só este RangeError; os demais seguem como erro interno)
    if (valorDoDas === null) return { ok: true, dados: dashboardVazio(parsed.data, hoje) };
    const resposta: DashboardResponse = {
      resumoMes: resumoMes(lancamentos, parsed.data),
      limiteMei: { ...statusLimiteMei(entrada), projecaoAnualCentavos: projecaoAnual(entrada) },
      proximoDas: { vencimento, valorCentavos: valorDoDas },
      // TODO gerarAlertas (Murilo, até 26/11)
      alertas: [],
    };
    return { ok: true, dados: DashboardResponse.parse(resposta) };
  } catch (e) {
    return interno("obterDashboard", e);
  }
}
