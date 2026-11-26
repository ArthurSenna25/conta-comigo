import { ChatRequest, ChatResponse, ErroResposta } from "@/lib/contracts";

type Envio =
  | { ok: true; dados: ChatResponse }
  | { ok: false; mensagem: string; status?: number };

export async function enviarPergunta(pergunta: string, anteriores: readonly string[], signal?: AbortSignal): Promise<Envio> {
  const entrada = ChatRequest.safeParse({
    mensagens: [...anteriores.slice(-9), pergunta].map((conteudo) => ({ role: "user", conteudo })),
  });
  if (!entrada.success) return { ok: false, mensagem: "Escreva uma pergunta com até 1.000 caracteres." };

  const controle = new AbortController();
  const cancelar = () => controle.abort();
  if (signal?.aborted) cancelar();
  signal?.addEventListener("abort", cancelar, { once: true });
  const limite = setTimeout(() => controle.abort(new DOMException("Tempo de espera excedido", "TimeoutError")), 35_000);
  try {
    // POST da origem do navegador, conforme app/api/chat/README.md. O
    // portão da rota continua responsável pela sessão e pela autorização.
    const resposta = await fetch("/api/chat", {
      method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin",
      signal: controle.signal,
      body: JSON.stringify(entrada.data),
    });
    const corpo: unknown = await resposta.json().catch(() => null);
    if (controle.signal.aborted) throw controle.signal.reason;
    if (resposta.ok) {
      const validado = ChatResponse.safeParse(corpo);
      if (validado.success) return { ok: true, dados: validado.data };
    }
    const falha = ErroResposta.safeParse(corpo);
    const mensagem = !resposta.ok && falha.success ? falha.data.erro.mensagem :
      "O chat está temporariamente indisponível. Tente novamente em alguns instantes.";
    return { ok: false, status: resposta.status, mensagem };
  } catch (erro) {
    return { ok: false, mensagem: erro instanceof Error && erro.name === "TimeoutError"
      ? "A resposta demorou mais que o esperado. Tente novamente."
      : "Não foi possível conectar ao chat. Confira sua conexão e tente novamente." };
  } finally {
    clearTimeout(limite);
    signal?.removeEventListener("abort", cancelar);
  }
}
