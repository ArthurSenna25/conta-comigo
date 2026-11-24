import { beforeEach, describe, expect, it, vi } from "vitest";
import { VERSAO_CONSENTIMENTO } from "@/lib/contracts";
import { exigirAcessoApi } from "./portao-api";

const { getClaims, listarAceites, existePerfil } = vi.hoisted(() => ({
  getClaims: vi.fn(), listarAceites: vi.fn(), existePerfil: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/cliente-servidor", () => ({
  criarClienteServidor: async () => ({ auth: { getClaims } }),
}));
vi.mock("@/lib/db/consentimento", () => ({ listarAceites }));
vi.mock("@/lib/db/perfil", () => ({ existePerfil }));

const origem = "http://localhost:3000";
const aceitesAtuais = ["termos_uso", "privacidade", "envio_ia"].map((finalidade) => ({
  finalidade, versao: VERSAO_CONSENTIMENTO, revogadoEm: null,
}));
const pedido = (headers: Record<string, string> = { origin: origem }, metodo = "POST") =>
  new Request(origem + "/api/ingest", { method: metodo, headers });
const status = (r: unknown) => (r instanceof Response ? r.status : null);
const codigo = async (r: unknown) => (r instanceof Response ? (await r.json()).erro.codigo : null);

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
  vi.stubEnv("AI_DAILY_BUDGET_CENTS", "100");
  vi.stubEnv("DEMO_AI_DAILY_BUDGET_CENTS", "10");
  getClaims.mockResolvedValue({ data: { claims: { sub: "usuario", app_metadata: { demo: true } } } });
  listarAceites.mockResolvedValue(aceitesAtuais);
  existePerfil.mockResolvedValue(true);
});

describe("exigirAcessoApi: Origin (regra única, compara com o Host real)", () => {
  it.each([["origem externa", "https://externo.example"], ["origem nula", "null"]])(
    "rejeita %s antes de qualquer consulta", async (_, origin) => {
      expect(status(await exigirAcessoApi(pedido({ origin })))).toBe(403);
      expect(getClaims).not.toHaveBeenCalled();
    },
  );

  it("rejeita escrita sem Origin", async () => {
    expect(status(await exigirAcessoApi(pedido({})))).toBe(403);
    expect(getClaims).not.toHaveBeenCalled();
  });

  it("aceita o host original quando a URL interna do Next usa localhost", async () => {
    const r = await exigirAcessoApi(pedido({ host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" }));
    expect(r).toEqual({ userId: "usuario", demo: true, mock: false });
  });

  it("x-forwarded-host do pedido não vale: Origin forjado a partir dele é recusado", async () => {
    const r = await exigirAcessoApi(pedido({ origin: "https://evil.example", "x-forwarded-host": "evil.example", "x-forwarded-proto": "https" }));
    expect(status(r)).toBe(403);
  });

  it("leitura (GET) não exige Origin", async () => {
    expect(await exigirAcessoApi(pedido({}, "GET"))).toMatchObject({ userId: "usuario" });
  });
});

describe("exigirAcessoApi: sessão, consentimento, perfil e IA", () => {
  it("usa a identidade verificada e marca a demo", async () => {
    expect(await exigirAcessoApi(pedido(), { ia: true })).toEqual({ userId: "usuario", demo: true, mock: false });
  });

  it("recusa sessão ausente (401) antes de consultar aceites", async () => {
    getClaims.mockResolvedValue({ data: null });
    const r = await exigirAcessoApi(pedido(), { ia: true });
    expect(status(r)).toBe(401);
    expect(await codigo(r)).toBe("nao_autenticado");
    expect(listarAceites).not.toHaveBeenCalled();
  });

  it("recusa quem não tem os termos vigentes e quem não tem perfil (403)", async () => {
    listarAceites.mockResolvedValue([]);
    expect(status(await exigirAcessoApi(pedido(), { ia: true }))).toBe(403);
    listarAceites.mockResolvedValue(aceitesAtuais);
    existePerfil.mockResolvedValue(false);
    expect(status(await exigirAcessoApi(pedido(), { ia: true }))).toBe(403);
  });

  it.each([
    { versao: "2024-01-01" },
    { revogadoEm: "2026-11-24T12:00:00Z" },
  ])("recusa aceite de IA não vigente com ia: true (%j)", async (modificacao) => {
    listarAceites.mockResolvedValue(aceitesAtuais.map((aceite) =>
      aceite.finalidade === "envio_ia" ? { ...aceite, ...modificacao } : aceite,
    ));
    const r = await exigirAcessoApi(pedido(), { ia: true });
    expect(status(r)).toBe(403);
    expect(await codigo(r)).toBe("proibido");
    expect(await exigirAcessoApi(pedido())).toMatchObject({ userId: "usuario" }); // sem ia: não exige envio_ia
  });
});

describe("exigirAcessoApi: teto diário de IA (ia: true)", () => {
  it("demo usa o menor teto; usuário comum usa o global", async () => {
    expect(await exigirAcessoApi(pedido(), { ia: true })).toMatchObject({ demo: true });
    getClaims.mockResolvedValue({ data: { claims: { sub: "usuario", app_metadata: {} } } });
    expect(await exigirAcessoApi(pedido(), { ia: true })).toMatchObject({ demo: false });
  });

  it.each(["expirado", "0", ""])("teto global %j desativa a IA (429 limite_ia)", async (valor) => {
    vi.stubEnv("AI_DAILY_BUDGET_CENTS", valor);
    const r = await exigirAcessoApi(pedido(), { ia: true });
    expect(status(r)).toBe(429);
    expect(await codigo(r)).toBe("limite_ia");
  });

  it("teto da demo em 0 desativa só a demo", async () => {
    vi.stubEnv("DEMO_AI_DAILY_BUDGET_CENTS", "0");
    expect(status(await exigirAcessoApi(pedido(), { ia: true }))).toBe(429);
    getClaims.mockResolvedValue({ data: { claims: { sub: "usuario", app_metadata: {} } } });
    expect(await exigirAcessoApi(pedido(), { ia: true })).toMatchObject({ demo: false });
  });

  it("sem ia: true o teto não é consultado", async () => {
    vi.stubEnv("AI_DAILY_BUDGET_CENTS", "");
    expect(await exigirAcessoApi(pedido())).toMatchObject({ userId: "usuario" });
  });
});

describe("exigirAcessoApi: mock e falha interna", () => {
  it("modo mock não consulta sessão nem banco, mas o Origin continua valendo", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    expect(await exigirAcessoApi(pedido(), { ia: true })).toMatchObject({ demo: false, mock: true });
    expect(getClaims).not.toHaveBeenCalled();
    expect(status(await exigirAcessoApi(pedido({})))).toBe(403);
  });

  it("falha interna vira 500 e só o tipo do erro vai ao log", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getClaims.mockRejectedValue(new Error("detalhe sensível do banco"));
    const r = await exigirAcessoApi(pedido(), { ia: true });
    expect(status(r)).toBe(500);
    expect(JSON.stringify(log.mock.calls)).not.toContain("detalhe sensível");
  });
});
