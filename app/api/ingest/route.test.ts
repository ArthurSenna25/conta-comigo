import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIO_MAX_BYTES, IMAGEM_MAX_BYTES, IngestResponse } from "@/lib/contracts";
import { ErroIa } from "@/lib/ai/erro";
import { POST } from "@/app/api/ingest/route";
import { criarProcessarIngestao } from "@/app/api/ingest/processar";
import { MENSAGEM_IA_DEMO_SO_TEXTO, MENSAGEM_IA_DEMO_TEXTO_LONGO, TEXTO_IA_DEMO_MAX } from "@/lib/security/demo";
import { MENSAGEM_IA_SOMENTE_DEMO, respostaErro } from "@/lib/security/portao-api";

const { autorizar, provider, reservarUsoIa } = vi.hoisted(() => ({
  autorizar: vi.fn(), provider: vi.fn(), reservarUsoIa: vi.fn(),
}));
vi.mock("server-only", () => ({}));
// O portão (Origin, sessão, consentimento, perfil, envio_ia, teto) é testado em actions/portao-api.test.ts.
vi.mock("@/actions/portao-api", () => ({ exigirAcessoApi: autorizar }));
vi.mock("@/lib/db/uso-ia", async (original) => ({
  ...(await original<typeof import("@/lib/db/uso-ia")>()), reservarUsoIa,
}));
vi.mock("@/lib/ai/gemini", async () => ({
  ErroIa: (await import("@/lib/ai/erro")).ErroIa, criarGeminiProvider: provider,
}));

function formulario(kind: string, arquivo?: File, texto = "Vendi hoje por R$ 50 no Pix.") {
  const form = new FormData();
  form.set("kind", kind);
  if (arquivo) form.set("arquivo", arquivo);
  else form.set("texto", texto);
  return form;
}

const origem = "http://localhost:3000";
function pedido(body: FormData | string, origin = origem) {
  return new Request(origem + "/api/ingest", { method: "POST", body, headers: { origin } });
}

beforeEach(() => {
  vi.resetAllMocks();
  autorizar.mockResolvedValue({ mock: true });
});

describe("/api/ingest", () => {
  it("entrega os rascunhos do modo mock sem chamar a API externa", async () => {
    const resposta = await POST(pedido(formulario("texto")));
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("cache-control")).toBe("private, no-store");
    expect(IngestResponse.safeParse(await resposta.json()).success).toBe(true);
    expect(provider).not.toHaveBeenCalled();
  });

  it("chama o portão com { ia: true } e o repassa a resposta de recusa sem ler o corpo", async () => {
    autorizar.mockResolvedValue(respostaErro("proibido"));
    const req = pedido(formulario("texto"), "https://externo.example");
    expect((await POST(req)).status).toBe(403);
    expect(autorizar).toHaveBeenCalledWith(req, { ia: true });
    expect(req.bodyUsed).toBe(false);
  });

  it.each([[401, "nao_autenticado"], [403, "proibido"], [429, "limite_ia"], [500, "interno"]] as const)(
    "preserva a recusa do portão %s", async (status, codigo) => {
      autorizar.mockResolvedValue(respostaErro(codigo));
      const resposta = await POST(pedido(formulario("texto")));
      expect(resposta.status).toBe(status);
      expect(await resposta.json()).toMatchObject({ erro: { codigo } });
      expect(provider).not.toHaveBeenCalled();
      expect(reservarUsoIa).not.toHaveBeenCalled();
    },
  );

  it("recusa JSON e campos repetidos", async () => {
    expect((await POST(pedido("{}"))).status).toBe(415);
    const form = formulario("texto");
    form.append("texto", "Segundo campo");
    expect((await POST(pedido(form))).status).toBe(400);
  });

  it.each([
    ["imagem", "image/jpeg", 0, 400],
    ["imagem", "image/jpeg", 20, 400],
    ["imagem", "image/png", IMAGEM_MAX_BYTES + 32 * 1024, 413],
    ["audio", "audio/wav", AUDIO_MAX_BYTES + 1, 413],
    ["audio", "audio/aac", 20, 400],
  ] as const)("rejeita mídia %s %s de %i bytes", async (kind, mime, tamanho, status) => {
    const file = new File([new Uint8Array(tamanho)], "teste", { type: mime });
    const form = new Response(formulario(kind, file));
    const bytes = await form.arrayBuffer();
    const req = new Request(origem + "/api/ingest", {
      method: "POST", body: bytes, headers: { origin: origem, "content-type": form.headers.get("content-type")! },
    });
    expect((await POST(req)).status).toBe(status);
  });

  it("fecha a ingestão autenticada quando a reserva compartilhada está ausente", async () => {
    const req = pedido(formulario("texto"));
    const resposta = await criarProcessarIngestao()(req, { mock: false, userId: "id", demo: true });
    expect(resposta.status).toBe(503);
    expect((await resposta.json()).erro.codigo).toBe("ia_indisponivel");
    expect(req.bodyUsed).toBe(false);
    expect(provider).not.toHaveBeenCalled();
  });

  it("aguarda a decisão do controle antes de obter rascunhos", async () => {
    const acesso = { mock: false, userId: "id", demo: true };
    const tentativa = { modelo: "teste", operacao: "extracao", tentativa: 1 };
    provider.mockImplementation(({ antesDaChamada }) => ({
      extrair: async () => {
        await antesDaChamada(tentativa);
        return { resultado: { rascunhos: [], perguntasPendentes: ["Qual foi a movimentação?"] } };
      },
    }));
    const reservar = vi.fn().mockRejectedValue(new ErroIa("cota"));
    const resposta = await criarProcessarIngestao(reservar)(pedido(formulario("texto")), acesso);
    expect(reservar).toHaveBeenCalledWith(acesso, tentativa);
    expect(resposta.status).toBe(429);
  });
});

describe("/api/ingest com a reserva atômica de chamadas (reservar_uso_ia)", () => {
  const tentativa = { modelo: "teste", operacao: "extracao", tentativa: 1 };
  const extrairViaReserva = () =>
    provider.mockImplementation(({ antesDaChamada }) => ({
      extrair: async () => {
        await antesDaChamada(tentativa);
        return { resultado: { rascunhos: [], perguntasPendentes: ["Qual foi a movimentação?"] } };
      },
    }));
  const acessoReal = (demo: boolean) => ({ mock: false, userId: "usuario", demo });

  beforeEach(() => {
    vi.stubEnv("AI_DAILY_CALLS_GLOBAL", "200");
    vi.stubEnv("AI_DAILY_CALLS_USER", "");
    vi.stubEnv("DEMO_AI_DAILY_CALLS", "");
    extrairViaReserva();
  });

  it("conta real é recusada com 403 antes de ler o corpo, do provedor e da reserva", async () => {
    autorizar.mockResolvedValue(acessoReal(false));
    const req = pedido(formulario("texto"));
    const resposta = await POST(req);
    expect(resposta.status).toBe(403);
    expect(await resposta.json()).toEqual({ erro: { codigo: "proibido", mensagem: MENSAGEM_IA_SOMENTE_DEMO } });
    expect(req.bodyUsed).toBe(false);
    expect(provider).not.toHaveBeenCalled();
    expect(reservarUsoIa).not.toHaveBeenCalled();
  });

  it("reserva concedida: responde 200 e pede 1 chamada com os limites do usuário", async () => {
    vi.stubEnv("DEMO_AI_DAILY_CALLS", "30");
    autorizar.mockResolvedValue(acessoReal(true));
    reservarUsoIa.mockResolvedValue(true);
    const resposta = await POST(pedido(formulario("texto")));
    expect(resposta.status).toBe(200);
    expect(reservarUsoIa).toHaveBeenCalledTimes(1);
    expect(reservarUsoIa).toHaveBeenCalledWith("usuario", { maxUsuario: 30, maxGlobal: 200 });
  });

  it("o teto da demo vale na rota (15 por dia por padrão, o menor dos dois)", async () => {
    autorizar.mockResolvedValue(acessoReal(true));
    reservarUsoIa.mockResolvedValue(true);
    expect((await POST(pedido(formulario("texto")))).status).toBe(200);
    expect(reservarUsoIa).toHaveBeenCalledWith("usuario", { maxUsuario: 15, maxGlobal: 200 });
  });

  it("reserva negada: 429 limite_ia, sem rascunho", async () => {
    autorizar.mockResolvedValue(acessoReal(true));
    reservarUsoIa.mockResolvedValue(false);
    const resposta = await POST(pedido(formulario("texto")));
    expect(resposta.status).toBe(429);
    expect(await resposta.json()).toMatchObject({ erro: { codigo: "limite_ia" } });
  });

  it("falha do controle: 503 ia_indisponivel, sem rascunho (falha fechada)", async () => {
    autorizar.mockResolvedValue(acessoReal(true));
    reservarUsoIa.mockRejectedValue(new Error("banco fora"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const resposta = await POST(pedido(formulario("texto")));
    expect(resposta.status).toBe(503);
    expect(await resposta.json()).toMatchObject({ erro: { codigo: "ia_indisponivel" } });
  });

  it("sem AI_DAILY_CALLS_GLOBAL o limite global enviado é 0 (nega)", async () => {
    vi.stubEnv("AI_DAILY_CALLS_GLOBAL", "");
    vi.stubEnv("DEMO_AI_DAILY_CALLS", "30");
    autorizar.mockResolvedValue(acessoReal(true));
    reservarUsoIa.mockResolvedValue(false);
    expect((await POST(pedido(formulario("texto")))).status).toBe(429);
    expect(reservarUsoIa).toHaveBeenCalledWith("usuario", { maxUsuario: 30, maxGlobal: 0 });
  });

  it.each([["imagem", "image/jpeg"], ["audio", "audio/wav"]] as const)(
    "demo com %s: 400 só texto, sem provedor nem reserva", async (kind, mime) => {
      autorizar.mockResolvedValue(acessoReal(true));
      const arquivo = new File([new Uint8Array(64)], "x", { type: mime });
      const resposta = await POST(pedido(formulario(kind, arquivo)));
      expect(resposta.status).toBe(400);
      expect(await resposta.json()).toEqual({ erro: { codigo: "invalido", mensagem: MENSAGEM_IA_DEMO_SO_TEXTO } });
      expect(provider).not.toHaveBeenCalled();
      expect(reservarUsoIa).not.toHaveBeenCalled();
    },
  );

  it("demo com texto acima do teto: 400, sem provedor nem reserva", async () => {
    autorizar.mockResolvedValue(acessoReal(true));
    const resposta = await POST(pedido(formulario("texto", undefined, "a".repeat(TEXTO_IA_DEMO_MAX + 1))));
    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toEqual({ erro: { codigo: "invalido", mensagem: MENSAGEM_IA_DEMO_TEXTO_LONGO } });
    expect(provider).not.toHaveBeenCalled();
    expect(reservarUsoIa).not.toHaveBeenCalled();
  });

  it("demo com texto no teto segue para a reserva e o provedor", async () => {
    autorizar.mockResolvedValue(acessoReal(true));
    reservarUsoIa.mockResolvedValue(true);
    expect((await POST(pedido(formulario("texto", undefined, "a".repeat(TEXTO_IA_DEMO_MAX)))))).toHaveProperty("status", 200);
    expect(reservarUsoIa).toHaveBeenCalledTimes(1);
  });

  it("modo mock não reserva nada", async () => {
    autorizar.mockResolvedValue({ mock: true });
    expect((await POST(pedido(formulario("texto")))).status).toBe(200);
    expect(reservarUsoIa).not.toHaveBeenCalled();
  });
});
