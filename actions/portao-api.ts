import "server-only";
import { mockPerfil } from "@/lib/contracts/mocks";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { listarAceites } from "@/lib/db/consentimento";
import { existePerfil } from "@/lib/db/perfil";
import { consentimentoVigente } from "@/lib/security/acesso";
import { ehContaDemo } from "@/lib/security/demo";
import { modoMock } from "@/lib/security/modo-mock";
import { envioIaVigente, origemConfere, origemDaRequisicao, respostaErro } from "@/lib/security/portao-api";

export type AcessoApi = { userId: string; demo: boolean };

/**
 * Portão de TODO handler em app/api/* (`tests/portao.test.ts` falha se faltar). Irmão de `exigirAcesso`,
 * mas nunca redireciona: devolve `Response` 401/403/500 com `ErroResposta`.
 * Uso: `const a = await exigirAcessoApi(req); if (a instanceof Response) return a;`
 * Rotas que mandam dado ao provedor de IA passam `{ ia: true }`: exige também `envio_ia` aceito NA VERSÃO ATUAL
 * e não revogado (AMEACAS #16), na mesma consulta. Ordem: Origin (só escrita) → sessão (getClaims) →
 * consentimento → perfil → IA. Falha fechada. No modo mock o Origin também é checado (curl sem Origin leva 403).
 */
export async function exigirAcessoApi(req: Request, opcoes: { ia?: boolean } = {}): Promise<AcessoApi | Response> {
  try {
    const esperada = origemDaRequisicao(
      req.url,
      req.headers.get("x-forwarded-host"),
      req.headers.get("x-forwarded-proto"),
    );
    if (!origemConfere(req.method, req.headers.get("origin"), esperada)) return respostaErro("proibido");
    if (modoMock()) return { userId: mockPerfil.userId, demo: false };

    const db = await criarClienteServidor();
    const { data } = await db.auth.getClaims();
    const userId = data?.claims.sub;
    if (!data || !userId) return respostaErro("nao_autenticado");
    const aceites = await listarAceites(db, userId);
    if (!consentimentoVigente(aceites)) return respostaErro("proibido");
    if (!(await existePerfil(db, userId))) return respostaErro("proibido");
    if (opcoes.ia && !envioIaVigente(aceites)) return respostaErro("proibido");
    return { userId, demo: ehContaDemo(data.claims) };
  } catch (e) {
    // só o tipo do erro: a mensagem (do banco ou do modoMock) pode carregar dado ou nome de variável
    console.error("[portao-api] falha", e instanceof Error ? e.name : "desconhecido");
    return respostaErro("interno");
  }
}
