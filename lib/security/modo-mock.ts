type Env = { NEXT_PUBLIC_USE_MOCKS?: string; NODE_ENV?: string };

const AMBIENTES_PERMITIDOS = new Set(["development", "test"]);

/**
 * Modo mock (time desenvolve sem chaves). Liga só com NEXT_PUBLIC_USE_MOCKS="true" E NODE_ENV
 * "development" ou "test". Qualquer outro ambiente (produção, staging, NODE_ENV ausente ou com
 * typo) com a flag ligada derruba a requisição com erro visível (500): nunca serve um usuário
 * falso em silêncio. Só o servidor chama isto (o proxy e as actions); é a ÚNICA leitura da flag.
 */
export function modoMock(env: Env = process.env): boolean {
  if (env.NEXT_PUBLIC_USE_MOCKS !== "true") return false;
  if (!AMBIENTES_PERMITIDOS.has(env.NODE_ENV ?? "")) {
    throw new Error(
      "NEXT_PUBLIC_USE_MOCKS=true só é permitido em desenvolvimento ou teste, nunca em produção. Remova a variável do ambiente (Vercel) e faça novo deploy.",
    );
  }
  return true;
}
