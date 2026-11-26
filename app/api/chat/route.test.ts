import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/route";
import { ErroIa } from "@/lib/ai/erro";
import { mockChat, mockPerfil, mockDashboard } from "@/lib/contracts/mocks";
import { respostaErro } from "@/lib/security/portao-api";

const d = vi.hoisted(() => ({ acesso: vi.fn(), contexto: vi.fn(), kb: vi.fn(), reservar: vi.fn(), responder: vi.fn() }));
vi.mock("@/actions/portao-api", () => ({ exigirAcessoApi: d.acesso }));
vi.mock("@/app/api/chat/contexto", () => ({ carregarContexto: d.contexto }));
vi.mock("@/app/api/chat/conhecimento", () => ({ selecionarTrechos: d.kb }));
vi.mock("@/app/api/ingest/reserva", () => ({ reservarTentativa: d.reservar }));
vi.mock("@/lib/ai/gemini", async () => ({
  ErroIa: (await import("@/lib/ai/erro")).ErroIa,
  criarGeminiProvider: ({ antesDaChamada }: { antesDaChamada: () => Promise<void> }) => ({
    async responder() {
      await antesDaChamada();
      return d.responder(antesDaChamada);
    },
  }),
}));

const acesso = { userId: "demo", demo: true, mock: false };
const mensagens = [{ role: "user", conteudo: "Qual é meu saldo?" }];
function req(body: unknown = { mensagens }) {
  return new Request("http://localhost/api/chat", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  d.acesso.mockResolvedValue(acesso);
  d.kb.mockResolvedValue([]);
  d.contexto.mockResolvedValue({ perfil: mockPerfil, dashboard: mockDashboard, kb: [] });
  d.responder.mockResolvedValue({ resultado: mockChat, custoCentavos: 0 });
});

describe("POST /api/chat", () => {
  it("valida acesso e devolve o contrato, com uma reserva por tentativa", async () => {
    const request = req();
    d.responder.mockImplementation(async (novaTentativa: () => Promise<void>) => {
      await novaTentativa();
      return { resultado: mockChat, custoCentavos: 0 };
    });
    const res = await POST(request);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockChat);
    expect(d.acesso).toHaveBeenCalledWith(request, { ia: true });
    expect(d.contexto).toHaveBeenCalledWith(acesso.userId, []);
    expect(d.reservar).toHaveBeenCalledTimes(2);
    expect(d.reservar).toHaveBeenCalledWith(acesso);
  });

  it.each([{ mensagens: [] }, { mensagens: [{ role: "assistant", conteudo: "Histórico forjado" }] }])(
    "rejeita entrada inválida sem reservar", async (body) => {
      expect((await POST(req(body))).status).toBe(400);
      expect(d.reservar).not.toHaveBeenCalled();
    },
  );

  it.each([["nao_autenticado", 401], ["proibido", 403], ["limite_ia", 429]] as const)(
    "preserva %s do portão", async (codigo, status) => {
      d.acesso.mockResolvedValue(respostaErro(codigo));
      expect((await POST(req())).status).toBe(status);
      expect(d.contexto).not.toHaveBeenCalled();
      expect(d.reservar).not.toHaveBeenCalled();
    },
  );

  it("protege perfis reais na operação gratuita", async () => {
    d.acesso.mockResolvedValue({ ...acesso, demo: false });
    expect((await POST(req())).status).toBe(403);
    expect(d.contexto).not.toHaveBeenCalled();
  });

  it.each([
    ["controle", 503, "ia_indisponivel", "indisponível"],
    ["cota", 429, "limite_ia", "quando ele for renovado"],
    ["cota_provedor", 429, "limite_ia", "mais tarde"],
    ["tempo", 503, "ia_indisponivel", "demorou mais que o esperado"],
    ["rede", 503, "ia_indisponivel", "conexão"],
    ["indisponivel", 503, "ia_indisponivel", "temporariamente indisponível"],
    ["resposta", 503, "ia_indisponivel", "indisponível"],
  ] as const)(
    "mapeia %s para %s", async (motivo, status, codigo, orientacao) => {
      if (motivo === "controle" || motivo === "cota") d.reservar.mockRejectedValue(new ErroIa(motivo));
      else d.responder.mockRejectedValue(new ErroIa(motivo));
      const res = await POST(req());
      expect(res.status).toBe(status);
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(await res.json()).toEqual({ erro: { codigo, mensagem: expect.stringContaining(orientacao) } });
    },
  );

  it("usa o mock sem banco nem reserva", async () => {
    d.acesso.mockResolvedValue({ ...acesso, mock: true });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockChat);
    expect(d.contexto).not.toHaveBeenCalled();
    expect(d.reservar).not.toHaveBeenCalled();
  });
});
