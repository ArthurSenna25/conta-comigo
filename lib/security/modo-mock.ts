type Env = { NEXT_PUBLIC_USE_MOCKS?: string; NODE_ENV?: string };

/**
 * Modo mock (time desenvolve sem chaves). Liga só com NEXT_PUBLIC_USE_MOCKS="true" E fora de produção.
 * Em produção a flag nunca é honrada: ligada, derruba a requisição com erro visível (500), em vez de
 * servir um usuário falso em silêncio. Só o servidor chama isto (o proxy e as actions).
 */
export function modoMock(env: Env = process.env): boolean {
  if (env.NEXT_PUBLIC_USE_MOCKS !== "true") return false;
  if (env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_USE_MOCKS=true não é permitido em produção. Remova a variável do ambiente (Vercel) e faça novo deploy.",
    );
  }
  return true;
}
