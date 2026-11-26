"use server";

import { type Atividade, DashboardResponse, MesISO, type Resultado } from "@/lib/contracts";
import { mockDashboard } from "@/lib/contracts/mocks";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { listarLancamentosDashboard } from "@/lib/db/lancamento";
import { lerPerfil } from "@/lib/db/perfil";
import {
  anoDaCompetenciaDas,
  gerarAlertas,
  projecaoAnual,
  proximoVencimentoDas,
  receitaAnualCentavos,
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
 * Painel do mês. `mes` "YYYY-MM" (padrão: mês atual em Brasília).
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
    const [anoSelecionado, mesSelecionado] = parsed.data.split("-");
    const fimMes = mesSelecionado === "12"
      ? `${String(Number(anoSelecionado) + 1).padStart(4, "0")}-01-01`
      : `${anoSelecionado}-${String(Number(mesSelecionado) + 1).padStart(2, "0")}-01`;

    // Comprovantes: mês civil atual e os dois anteriores, até hoje inclusive.
    const inicioLembretes = new Date(`${hoje.slice(0, 7)}-01`);
    inicioLembretes.setUTCMonth(inicioLembretes.getUTCMonth() - 2);
    const fimLembretes = new Date(hoje);
    fimLembretes.setUTCDate(fimLembretes.getUTCDate() + 1);
    const [receitas, despesasRecentes, lancamentosMes] = await Promise.all([
      listarLancamentosDashboard(db, userId, { de: `${ano}-01-01`, ate: `${ano + 1}-01-01` }, "receita"),
      listarLancamentosDashboard(db, userId, {
        de: inicioLembretes.toISOString().slice(0, 10),
        ate: fimLembretes.toISOString().slice(0, 10),
      }, "despesa"),
      listarLancamentosDashboard(db, userId, { de: `${parsed.data}-01`, ate: fimMes }),
    ]);

    const entrada = { receitasAnoCentavos: receitaAnualCentavos(perfil, receitas, hoje), dataAbertura: perfil.dataAbertura, hoje };
    const vencimento = proximoVencimentoDas(hoje);
    const valorDoDas = valorDasOuNulo(perfil.atividade, anoDaCompetenciaDas(vencimento));
    // sem valor oficial para a competência: painel vazio (só este RangeError; os demais seguem como erro interno)
    if (valorDoDas === null) return { ok: true, dados: dashboardVazio(parsed.data, hoje) };
    const resposta: DashboardResponse = {
      resumoMes: resumoMes(lancamentosMes, parsed.data),
      limiteMei: { ...statusLimiteMei(entrada), projecaoAnualCentavos: projecaoAnual(entrada) },
      proximoDas: { vencimento, valorCentavos: valorDoDas },
      alertas: gerarAlertas({ perfil, lancamentos: [...receitas, ...despesasRecentes], hoje }),
    };
    return { ok: true, dados: DashboardResponse.parse(resposta) };
  } catch (e) {
    return interno("obterDashboard", e);
  }
}
