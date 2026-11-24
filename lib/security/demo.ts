// Conta de demonstração (acesso do júri sem login). Lógica pura: sem Supabase, sem next.
// Só `import type` aqui: scripts/seed-demo.mjs importa este arquivo direto pelo Node (sem build).
import type { Resultado } from "@/lib/contracts";

/** Teto diário de IA da demo (centavos) quando DEMO_AI_DAILY_BUDGET_CENTS falta ou é inválida. */
export const TETO_IA_DEMO_PADRAO_CENTAVOS = 100;

const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/**
 * Conta de demo = `app_metadata.demo === true` no JWT. app_metadata só é escrito pela API admin
 * (secret key); `user_metadata` o próprio usuário edita, por isso nunca vale como marca.
 */
export function ehContaDemo(claims: unknown): boolean {
  if (!ehObjeto(claims) || !ehObjeto(claims.app_metadata)) return false;
  return claims.app_metadata.demo === true;
}

/** Credenciais da demo, só do ambiente do servidor (nunca NEXT_PUBLIC_). Sem as duas, não há demo. */
export function credenciaisDemo(env: {
  DEMO_EMAIL?: string;
  DEMO_PASSWORD?: string;
}): { email: string; senha: string } | null {
  const email = env.DEMO_EMAIL?.trim().toLowerCase();
  const senha = env.DEMO_PASSWORD;
  if (!email || !senha || !senha.trim()) return null;
  return { email, senha };
}

/** Inteiro >= 0 escrito só com dígitos; qualquer outra coisa (vazio, "1e9", "-1", "2.5") é inválida. */
function centavos(valor: string | undefined): number | null {
  if (valor === undefined || !/^\d+$/.test(valor)) return null;
  const n = Number(valor);
  return Number.isSafeInteger(n) ? n : null;
}

/**
 * Teto diário de IA em centavos. Falha FECHADA: teto global ausente/inválido = 0 (IA desligada).
 * Na demo (conta compartilhada e pública) vale o menor entre o global e o da demo, então ela nunca
 * gasta mais que o teto global. Quem aplica o teto é o servidor, antes da chamada à IA.
 */
export function tetoDiarioIaCentavos(
  demo: boolean,
  env: { AI_DAILY_BUDGET_CENTS?: string; DEMO_AI_DAILY_BUDGET_CENTS?: string },
): number {
  const global = centavos(env.AI_DAILY_BUDGET_CENTS) ?? 0;
  if (!demo) return global;
  return Math.min(global, centavos(env.DEMO_AI_DAILY_BUDGET_CENTS) ?? TETO_IA_DEMO_PADRAO_CENTAVOS);
}

/**
 * Trocar e-mail, trocar senha e excluir conta NÃO valem para a demo (conta compartilhada).
 * Toda action dessas começa com: `const b = bloqueioDaContaDemo(acesso.demo); if (b) return b;`
 */
export function bloqueioDaContaDemo(demo: boolean): Resultado<never> | null {
  if (!demo) return null;
  return {
    ok: false,
    erro: { codigo: "proibido", mensagem: "Esta é a conta de demonstração e não pode ser alterada." },
  };
}

/**
 * Decisão do seed: nunca apaga um usuário que não seja a própria demo. Se já existe alguém com o
 * e-mail da demo SEM a marca app_metadata.demo === true, é conta real: aborta.
 */
export function decidirSeed(existente: unknown): "criar" | "recriar" | "abortar" {
  if (existente === undefined) return "criar";
  return ehContaDemo(existente) ? "recriar" : "abortar";
}
