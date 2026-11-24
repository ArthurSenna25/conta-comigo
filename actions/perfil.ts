"use server";

import { PerfilInput, type Perfil, type Resultado } from "@/lib/contracts";
import { mockPerfil } from "@/lib/contracts/mocks";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { atualizarPerfil, criarPerfil, lerPerfil } from "@/lib/db/perfil";
import { modoMock } from "@/lib/security/modo-mock";
import { interno, invalido } from "./resultado";
import { exigirAcesso } from "./sessao";

/**
 * Onboarding e edição do perfil do negócio. Valida com `PerfilInput` e grava para o usuário da SESSÃO
 * (um `userId` vindo do cliente é descartado pelo Zod). Etapa "consentimento": o perfil ainda não existe
 * no primeiro uso, então o portão não pode exigi-lo. Cria se não há perfil, atualiza se há.
 */
export async function salvarPerfil(entrada: unknown): Promise<Resultado<Perfil>> {
  const parsed = PerfilInput.safeParse(entrada);
  if (!parsed.success) return invalido(parsed.error);
  if (modoMock()) return { ok: true, dados: { ...mockPerfil, ...parsed.data } };

  const { userId } = await exigirAcesso("consentimento");
  try {
    const db = await criarClienteServidor();
    const perfil = (await lerPerfil(db, userId))
      ? await atualizarPerfil(db, userId, parsed.data)
      : await criarPerfil(db, userId, parsed.data);
    return perfil ? { ok: true, dados: perfil } : interno("salvarPerfil", new Error("perfil sumiu na atualização"));
  } catch (e) {
    return interno("salvarPerfil", e);
  }
}
