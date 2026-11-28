import type { ContextoChat, Lancamento, Perfil, TrechoKb } from "@/lib/contracts";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { listarLancamentosDashboard } from "@/lib/db/lancamento";
import { lerPerfil } from "@/lib/db/perfil";
import { projecaoAnual, proximoVencimentoDas, receitaAnualCentavos, resumoMes, statusLimiteMei, valorDas } from "@/lib/engine";
import { hojeBrasil } from "@/lib/security/datas";

export function montarContexto(perfil: Perfil, lancamentos: Lancamento[], hoje: string, kb: TrechoKb[]): ContextoChat {
  const receitasAnoCentavos = receitaAnualCentavos(perfil, lancamentos, hoje);
  const entrada = { receitasAnoCentavos, dataAbertura: perfil.dataAbertura, hoje };
  const vencimento = proximoVencimentoDas(hoje);
  // O vencimento em janeiro corresponde à competência de dezembro.
  const competencia = Number(vencimento.slice(0, 4)) - Number(vencimento.slice(5, 7) === "01");
  return {
    perfil, kb,
    dashboard: {
      resumoMes: resumoMes(lancamentos.filter((l) => l.data <= hoje), hoje.slice(0, 7)),
      limiteMei: { ...statusLimiteMei(entrada), projecaoAnualCentavos: projecaoAnual(entrada) },
      proximoDas: { vencimento, valorCentavos: valorDas(perfil.atividade, competencia) },
      alertas: [],
    },
  };
}

export async function carregarContexto(userId: string, kb: TrechoKb[]): Promise<ContextoChat | null> {
  const hoje = hojeBrasil();
  const db = await criarClienteServidor();
  const perfil = await lerPerfil(db, userId);
  if (!perfil) return null;
  const ano = Number(hoje.slice(0, 4));
  const lancamentos = await listarLancamentosDashboard(db, userId, { de: `${ano}-01-01`, ate: `${ano + 1}-01-01` });
  return montarContexto(perfil, lancamentos, hoje, kb);
}
