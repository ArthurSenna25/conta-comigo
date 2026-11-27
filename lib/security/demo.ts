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

/** Chamadas de IA por dia: padrão por usuário e padrão da conta de demo (compartilhada). */
const CHAMADAS_IA_USUARIO_PADRAO = 30;
const CHAMADAS_IA_DEMO_PADRAO = 15;
/** Os parâmetros de `reservar_uso_ia` são `int`: valor maior estoura no banco e derrubaria a IA de todos. */
const INT_MAX_POSTGRES = 2_147_483_647;

/**
 * Limites de CHAMADAS de IA por dia para `reservar_uso_ia`. O global não tem padrão: ausente ou inválido
 * vira 0 e a reserva nega (falha fechada). Valor inválido do usuário/demo cai no padrão, que é finito.
 * Na demo vale o menor entre o limite do usuário e o da demo.
 */
export function limitesChamadasIa(
  demo: boolean,
  env: { AI_DAILY_CALLS_USER?: string; DEMO_AI_DAILY_CALLS?: string; AI_DAILY_CALLS_GLOBAL?: string },
): { maxUsuario: number; maxGlobal: number } {
  const limite = (valor: string | undefined, padrao: number) => Math.min(centavos(valor) ?? padrao, INT_MAX_POSTGRES);
  const maxUsuario = limite(env.AI_DAILY_CALLS_USER, CHAMADAS_IA_USUARIO_PADRAO);
  const maxGlobal = limite(env.AI_DAILY_CALLS_GLOBAL, 0);
  if (!demo) return { maxUsuario, maxGlobal };
  return { maxUsuario: Math.min(maxUsuario, limite(env.DEMO_AI_DAILY_CALLS, CHAMADAS_IA_DEMO_PADRAO)), maxGlobal };
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

/**
 * Teto de caracteres do texto enviado à IA pela demo (AMEACAS #22). O contrato aceita 2.000 no ingest e
 * 1.000 por pergunta no chat; na demo pública, que vai ao Gemini Free, 280 bastam para um lançamento
 * ("recebi 120 do corte da Maria hoje") ou uma dúvida, e encurtam o que um visitante consegue colar ali.
 */
export const TEXTO_IA_DEMO_MAX = 280;
export const MENSAGEM_IA_DEMO_SO_TEXTO = "Na demonstração, a IA aceita apenas texto.";
export const MENSAGEM_IA_DEMO_TEXTO_LONGO = `Na demonstração, escreva até ${TEXTO_IA_DEMO_MAX} caracteres.`;

/** Recusa da entrada de IA da demo: só texto e até TEXTO_IA_DEMO_MAX. `null` = pode seguir. */
export function recusaEntradaIaDemo(entrada: { kind: string; texto?: string }): string | null {
  if (entrada.kind !== "texto") return MENSAGEM_IA_DEMO_SO_TEXTO;
  return (entrada.texto ?? "").length > TEXTO_IA_DEMO_MAX ? MENSAGEM_IA_DEMO_TEXTO_LONGO : null;
}
