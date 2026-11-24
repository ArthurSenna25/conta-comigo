import "server-only";
import { createClient } from "@supabase/supabase-js";
import { configSupabase } from "./config";

export type LimitesReserva = { maxUsuario: number; maxGlobal: number };

/**
 * Reserva UMA chamada de IA para o dia (America/Sao_Paulo) via RPC `reservar_uso_ia`: true = reservou,
 * false = negou (limite do usuário ou global). Falha FECHADA: chave ausente, erro do RPC ou resposta que
 * não seja boolean LANÇAM, e quem chama trata como controle indisponível.
 *
 * A secret key só é lida aqui e só chama esta função (`service_role` não tem GRANT de tabela). Client novo
 * por chamada e sem sessão. Nada de mensagem do banco no erro: pode carregar dado.
 */
export async function reservarUsoIa(userId: string, limites: LimitesReserva): Promise<boolean> {
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!chave) throw new Error("SUPABASE_SECRET_KEY ausente");
  const db = createClient(configSupabase().url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc("reservar_uso_ia", {
    p_user_id: userId,
    p_max_usuario: limites.maxUsuario,
    p_max_global: limites.maxGlobal,
  });
  if (error) throw new Error("reservar_uso_ia falhou");
  if (typeof data !== "boolean") throw new Error("reservar_uso_ia devolveu valor inesperado");
  return data;
}
