"use server";

import { PerfilInput, type Perfil, type Resultado } from "@/lib/contracts";
import { mockPerfil } from "@/lib/contracts/mocks";
import { criarClienteServidor } from "@/lib/db/cliente-servidor";
import { atualizarPerfil, criarPerfil, lerPerfil } from "@/lib/db/perfil";
import { bloqueioDaContaDemo } from "@/lib/security/demo";
import { modoMock } from "@/lib/security/modo-mock";
import { interno, invalido } from "./resultado";
import { exigirAcesso } from "./sessao";

/**
 * Onboarding e edição do perfil do negócio. Valida com `PerfilInput` e grava para o usuário da SESSÃO
 * (um `userId` vindo do cliente é descartado pelo Zod). Etapa "consentimento": o perfil ainda não existe
 * no primeiro uso, então o portão não pode exigi-lo. Cria se não há perfil, atualiza se há.
 */
export async function salvarPerfil(entrada: unknown): Promise<Resultado<Perfil>> {
  const acesso = modoMock() ? null : await exigirAcesso("consentimento");
  const parsed = PerfilInput.safeParse(entrada);
  if (!parsed.success) return invalido(parsed.error);
  if (!acesso) return { ok: true, dados: { ...mockPerfil, ...parsed.data } };
  // conta compartilhada: o perfil dela é a base dos números da demo (AMEACAS #21)
  const bloqueio = bloqueioDaContaDemo(acesso.demo);
  if (bloqueio) return bloqueio;

  const { userId } = acesso;
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
