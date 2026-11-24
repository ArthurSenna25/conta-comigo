import "server-only";
import { mockLancamentos } from "@/lib/contracts/mocks";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { contarLancamentos } from "@/lib/db/lancamento";
import { modoMock } from "@/lib/security/modo-mock";

/**
 * STUB do painel: só a contagem de lançamentos do usuário logado (pela RLS). A página já passou pelo portão
 * (exigirAcesso). TODO(Frigeri/Gui): trocar por `DashboardResponse` calculado em lib/engine.
 */
export async function totalDeLancamentos(userId: string): Promise<number> {
  if (modoMock()) return mockLancamentos.length;
  return contarLancamentos(await criarClienteServidor(), userId);
}
