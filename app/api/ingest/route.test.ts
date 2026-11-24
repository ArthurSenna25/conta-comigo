import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIO_MAX_BYTES, IMAGEM_MAX_BYTES, IngestResponse } from "@/lib/contracts";
import { ErroIa } from "@/lib/ai/erro";
import { POST } from "@/app/api/ingest/route";
import { criarPostIngestao } from "@/app/api/ingest/processar";
import { ErroIngestao } from "@/app/api/ingest/entrada";

const { autorizar, provider } = vi.hoisted(() => ({ autorizar: vi.fn(), provider: vi.fn() }));
vi.mock("@/app/api/ingest/acesso", () => ({ autorizarIngestao: autorizar }));
vi.mock("@/lib/ai/gemini", async () => ({
  ErroIa: (await import("@/lib/ai/erro")).ErroIa, criarGeminiProvider: provider,
}));

function formulario(kind: string, arquivo?: File) {
  const form = new FormData();
  form.set("kind", kind);
  if (arquivo) form.set("arquivo", arquivo);
  else form.set("texto", "Vendi hoje por R$ 50 no Pix.");
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

  it.each([["origem externa", "https://externo.example"], ["origem nula", "null"]])(
    "rejeita %s antes da autorização", async (_, origin) => {
      expect((await POST(pedido(formulario("texto"), origin))).status).toBe(403);
      expect(autorizar).not.toHaveBeenCalled();
    },
  );

  it("aceita o host original quando a URL interna do Next usa localhost", async () => {
    const resposta = await POST(new Request(origem + "/api/ingest", {
      method: "POST", body: formulario("texto"),
      headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
    }));
    expect(resposta.status).toBe(200);
  });

  it.each([[401, "nao_autenticado"], [403, "proibido"]] as const)("preserva o erro de acesso %s", async (status, codigo) => {
    autorizar.mockRejectedValue(new ErroIngestao(status, codigo, "Acesso restrito."));
    const resposta = await POST(pedido(formulario("texto")));
    expect(resposta.status).toBe(status);
    expect(await resposta.json()).toMatchObject({ erro: { codigo } });
    expect(provider).not.toHaveBeenCalled();
  });

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
    autorizar.mockResolvedValue({ mock: false, userId: "id", demo: true, tetoCentavos: 100 });
    const resposta = await POST(pedido(formulario("texto")));
    expect(resposta.status).toBe(503);
    expect((await resposta.json()).erro.codigo).toBe("ia_indisponivel");
    expect(provider).not.toHaveBeenCalled();
  });

  it("aguarda a decisão do controle antes de obter rascunhos", async () => {
    const acesso = { mock: false, userId: "id", demo: true, tetoCentavos: 100 };
    autorizar.mockResolvedValue(acesso);
    const tentativa = { modelo: "teste", operacao: "extracao", tentativa: 1 };
    provider.mockImplementation(({ antesDaChamada }) => ({
      extrair: async () => {
        await antesDaChamada(tentativa);
        return { resultado: { rascunhos: [], perguntasPendentes: ["Qual foi a movimentação?"] } };
      },
    }));
    const reservar = vi.fn().mockRejectedValue(new ErroIa("cota"));
    const resposta = await criarPostIngestao(reservar)(pedido(formulario("texto")));
    expect(reservar).toHaveBeenCalledWith(acesso, tentativa);
    expect(resposta.status).toBe(429);
  });
});
