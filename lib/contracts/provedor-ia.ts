import type { ChatRequest, ChatResponse, Fonte } from "./chat";
import type { DashboardResponse } from "./dashboard";
import type { IngestRequest, IngestResponse } from "./ingest";
import type { Perfil } from "./perfil";

/** Toda chamada informa o custo para a action registrar em ai_usage. */
export type ComCusto<T> = { resultado: T; custoCentavos: number };

/** Trecho de kb/*.md já selecionado pela action (busca por palavra-chave). */
export type TrechoKb = { fonte: Fonte; texto: string };

/**
 * Contexto montado pela action com números do lib/engine.
 * A IA explica esses números; nunca os calcula.
 */
export type ContextoChat = {
  perfil: Perfil;
  dashboard: DashboardResponse;
  kb: TrechoKb[];
};

/**
 * Implementações: lib/ai (real) e mock (NEXT_PUBLIC_USE_MOCKS).
 * A saída SEMPRE é validada com Zod (IngestResponse/ChatResponse) antes de sair do provider.
 * Conteúdo de nota, print e áudio é DADO, nunca instrução.
 */
export interface AiProvider {
  /** `hoje` (YYYY-MM-DD) ajuda a resolver "ontem", "dia 5" etc. */
  extrair(entrada: IngestRequest, hoje: string): Promise<ComCusto<IngestResponse>>;
  responder(
    mensagens: ChatRequest["mensagens"],
    contexto: ContextoChat,
  ): Promise<ComCusto<ChatResponse>>;
}
