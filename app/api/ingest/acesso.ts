import "server-only";
import { VERSAO_CONSENTIMENTO } from "@/lib/contracts";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { listarAceites } from "@/lib/db/consentimento";
import { existePerfil } from "@/lib/db/perfil";
import { consentimentoVigente } from "@/lib/security/acesso";
import { ehContaDemo, tetoDiarioIaCentavos } from "@/lib/security/demo";
import { modoMock } from "@/lib/security/modo-mock";
import { ErroIngestao } from "./entrada";

export type AcessoIngestao =
  | { mock: true }
  | { mock: false; userId: string; demo: boolean; tetoCentavos: number };

export async function autorizarIngestao(): Promise<AcessoIngestao> {
  if (modoMock()) return { mock: true };
  const db = await criarClienteServidor();
  const { data, error } = await db.auth.getClaims();
  if (error || !data?.claims.sub) throw new ErroIngestao(401, "nao_autenticado", "Entre na sua conta para continuar.");

  const userId = data.claims.sub;
  const aceites = await listarAceites(db, userId);
  if (!consentimentoVigente(aceites) || !aceites.some((a) =>
    a.finalidade === "envio_ia" && a.versao === VERSAO_CONSENTIMENTO && a.revogadoEm === null
  )) throw new ErroIngestao(403, "proibido", "Confira os consentimentos atuais para enviar dados à IA. Você pode preencher manualmente.");
  if (!await existePerfil(db, userId)) throw new ErroIngestao(403, "proibido", "Conclua o perfil do negócio antes de usar a IA.");

  const demo = ehContaDemo(data.claims);
  const tetoCentavos = tetoDiarioIaCentavos(demo, {
    AI_DAILY_BUDGET_CENTS: process.env.AI_DAILY_BUDGET_CENTS,
    DEMO_AI_DAILY_BUDGET_CENTS: process.env.DEMO_AI_DAILY_BUDGET_CENTS,
  });
  if (tetoCentavos === 0) throw new ErroIngestao(429, "limite_ia", "A IA está desativada pelo limite diário. Você pode preencher manualmente.");
  return { mock: false, userId, demo, tetoCentavos };
}
