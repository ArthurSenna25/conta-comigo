import "server-only";
import { mockPerfil } from "@/lib/contracts/mocks";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { listarAceites } from "@/lib/db/consentimento";
import { existePerfil } from "@/lib/db/perfil";
import { consentimentoVigente } from "@/lib/security/acesso";
import { ehContaDemo, tetoDiarioIaCentavos } from "@/lib/security/demo";
import { modoMock } from "@/lib/security/modo-mock";
import { envioIaVigente, origemConfere, origemDaRequisicao, respostaErro } from "@/lib/security/portao-api";

/** `mock`: modo mock (sem sessão nem provedor real); a rota usa o provider falso. */
export type AcessoApi = { userId: string; demo: boolean; mock: boolean };

/**
 * Portão de TODO handler em app/api/* (`tests/portao.test.ts` falha se faltar). Irmão de `exigirAcesso`,
 * mas nunca redireciona: devolve `Response` 401/403/500 com `ErroResposta`.
 * Uso: `const a = await exigirAcessoApi(req); if (a instanceof Response) return a;`
 * Rotas que mandam dado ao provedor de IA passam `{ ia: true }`: exige também `envio_ia` aceito NA VERSÃO ATUAL
 * e não revogado (AMEACAS #16), na mesma consulta, e o teto diário de IA em centavos: teto 0 (ausente,
 * inválido ou desligado) devolve 429 `limite_ia` e a IA fica desativada. A reserva de chamadas é da rota
 * (`reservar_uso_ia`). Ordem: Origin (só escrita) → sessão (getClaims) → consentimento → perfil → IA → teto.
 * Falha fechada. No modo mock o Origin também é checado (curl sem Origin leva 403).
 */
export async function exigirAcessoApi(req: Request, opcoes: { ia?: boolean } = {}): Promise<AcessoApi | Response> {
  try {
    const esperada = origemDaRequisicao(req.url, req.headers.get("host"));
    if (!origemConfere(req.method, req.headers.get("origin"), esperada)) return respostaErro("proibido");
    if (modoMock()) return { userId: mockPerfil.userId, demo: false, mock: true };

    const db = await criarClienteServidor();
    const { data } = await db.auth.getClaims();
    const userId = data?.claims.sub;
    if (!data || !userId) return respostaErro("nao_autenticado");
    const aceites = await listarAceites(db, userId);
    if (!consentimentoVigente(aceites)) return respostaErro("proibido");
    if (!(await existePerfil(db, userId))) return respostaErro("proibido");
    if (opcoes.ia && !envioIaVigente(aceites)) return respostaErro("proibido");
    const demo = ehContaDemo(data.claims);
    if (opcoes.ia) {
      const teto = tetoDiarioIaCentavos(demo, {
        AI_DAILY_BUDGET_CENTS: process.env.AI_DAILY_BUDGET_CENTS,
        DEMO_AI_DAILY_BUDGET_CENTS: process.env.DEMO_AI_DAILY_BUDGET_CENTS,
      });
      if (teto === 0) return respostaErro("limite_ia");
    }
    return { userId, demo, mock: false };
  } catch (e) {
    // só o tipo do erro: a mensagem (do banco ou do modoMock) pode carregar dado ou nome de variável
    console.error("[portao-api] falha", e instanceof Error ? e.name : "desconhecido");
    return respostaErro("interno");
  }
}
