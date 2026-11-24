import "server-only";
import { redirect } from "next/navigation";
import { mockPerfil } from "@/lib/contracts/mocks";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { listarAceites } from "@/lib/db/consentimento";
import { existePerfil } from "@/lib/db/perfil";
import { consentimentoVigente, destinoDoAcesso } from "@/lib/security/acesso";
import { ehContaDemo } from "@/lib/security/demo";
import { modoMock } from "@/lib/security/modo-mock";

/** Até onde o portão exige: só login (tela de consentimento), + consentimento (onboarding) ou tudo (app). */
export type Etapa = "sessao" | "consentimento" | "completo";

/**
 * Portão do app autenticado, chamado por TODA página e action protegida (o proxy é só otimista).
 * Identidade vem de getClaims() (assinatura validada), nunca de getSession(). Sem acesso, redireciona:
 * sem sessão → /entrar; sem consentimento vigente → /consentimento (não usa nada do app);
 * sem perfil → /onboarding. Erro do banco propaga (falha fechada), não vira "sem perfil".
 */
export async function exigirAcesso(
  etapa: Etapa = "completo",
): Promise<{ userId: string; consentimentoVigente: boolean; demo: boolean }> {
  if (modoMock()) return { userId: mockPerfil.userId, consentimentoVigente: true, demo: false };

  const db = await criarClienteServidor();
  const { data } = await db.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/entrar");

  const vigente = consentimentoVigente(await listarAceites(db, userId));
  const temPerfil = etapa === "completo" && vigente ? await existePerfil(db, userId) : true;
  const destino = destinoDoAcesso({
    logado: true,
    consentimentoVigente: etapa === "sessao" ? true : vigente,
    temPerfil,
  });
  if (destino) redirect(destino);
  // demo vem do JWT validado (app_metadata só é escrito pela API admin), não de e-mail nem de user_metadata.
  return { userId, consentimentoVigente: vigente, demo: ehContaDemo(data?.claims) };
}
