import { ErroIa } from "@/lib/ai/erro";
import { reservarUsoIa } from "@/lib/db/uso-ia";
import { limitesChamadasIa } from "@/lib/security/demo";

/**
 * Reserva UMA chamada de IA por tentativa (`antesDaChamada` do provider), inclusive o retry e inclusive
 * quando o custo é zero. Negou → `ErroIa("cota")` (429 `limite_ia`); falha do controle → `ErroIa("controle")`
 * (503). Falha fechada: sem `AI_DAILY_CALLS_GLOBAL` válido a reserva nega. O mapeamento para `ErroIa` fica
 * aqui porque `lib/db` não pode importar `lib/ai`.
 */
export async function reservarTentativa(acesso: { userId: string; demo: boolean }): Promise<void> {
  const limites = limitesChamadasIa(acesso.demo, {
    AI_DAILY_CALLS_USER: process.env.AI_DAILY_CALLS_USER,
    DEMO_AI_DAILY_CALLS: process.env.DEMO_AI_DAILY_CALLS,
    AI_DAILY_CALLS_GLOBAL: process.env.AI_DAILY_CALLS_GLOBAL,
  });
  let reservou: boolean;
  try {
    reservou = await reservarUsoIa(acesso.userId, limites);
  } catch (e) {
    // só o tipo do erro: a mensagem pode carregar dado ou nome de variável
    console.error("[reserva-ia] falha", e instanceof Error ? e.name : "desconhecido");
    throw new ErroIa("controle");
  }
  if (!reservou) throw new ErroIa("cota");
}
