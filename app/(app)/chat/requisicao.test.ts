import { afterEach, describe, expect, it, vi } from "vitest";
import { enviarPergunta } from "./requisicao";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const dados = {
  resposta: "Consulte a Receita Federal.",
  fontes: [{ titulo: "Receita Federal", arquivo: "kb/das-mei.md", url: "https://www.gov.br/receitafederal", verificadoEm: "2026-11-25" }],
};

describe("envio do chat da interface", () => {
  it("envia até dez mensagens de usuário e valida a resposta com fontes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(dados));
    vi.stubGlobal("fetch", fetchMock);
    await expect(enviarPergunta("  Quando vence o DAS?  ", Array.from({ length: 12 }, (_, i) => `Pergunta ${i}`)))
      .resolves.toEqual({ ok: true, dados });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(options.credentials).toBe("same-origin");
    const { mensagens } = JSON.parse(options.body);
    expect(mensagens).toHaveLength(10);
    expect(mensagens[0]).toEqual({ role: "user", conteudo: "Pergunta 3" });
    expect(mensagens.at(-1)).toEqual({ role: "user", conteudo: "Quando vence o DAS?" });
    expect(mensagens.every(({ role }: { role: string }) => role === "user")).toBe(true);
  });

  it.each([
    [401, "nao_autenticado", "Entre para continuar."],
    [403, "proibido", "Revise o consentimento."],
    [429, "limite_ia", "Seu limite diário foi atingido."],
    [429, "limite_ia", "Tente novamente mais tarde."],
    [503, "ia_indisponivel", "A IA demorou mais que o esperado."],
  ])("mostra mensagem do HTTP %i sem retry", async (status, codigo, mensagem) => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ erro: { codigo, mensagem } }, { status }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(enviarPergunta("Minha pergunta", [])).resolves.toEqual({ ok: false, status, mensagem });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("recusa JSON incompatível e protege contra HTML devolvido pela plataforma", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ resposta: "Sem fontes" }))
      .mockResolvedValueOnce(new Response("<h1>Template da plataforma</h1>", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(enviarPergunta("Pergunta", [])).resolves.toMatchObject({ ok: false });
    const resultado = await enviarPergunta("Pergunta", []);
    expect(resultado).toMatchObject({ ok: false, mensagem: expect.stringContaining("indisponível") });
    expect(JSON.stringify(resultado)).not.toContain("Template");
  });

  it("diferencia falha de conexão do timeout local", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("Rede indisponível"))
      .mockImplementation((_url, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true })));
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();
    await expect(enviarPergunta("Pergunta", [])).resolves.toMatchObject({ ok: false, mensagem: expect.stringContaining("conexão") });
    const pendente = enviarPergunta("Pergunta", []);
    await vi.advanceTimersByTimeAsync(35_000);
    await expect(pendente).resolves.toMatchObject({ ok: false, mensagem: expect.stringContaining("demorou") });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
