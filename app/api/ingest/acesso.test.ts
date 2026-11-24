import { beforeEach, describe, expect, it, vi } from "vitest";
import { VERSAO_CONSENTIMENTO } from "@/lib/contracts";
import { autorizarIngestao } from "@/app/api/ingest/acesso";

const { getClaims, listarAceites, existePerfil } = vi.hoisted(() => ({
  getClaims: vi.fn(), listarAceites: vi.fn(), existePerfil: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/cliente-servidor", () => ({
  criarClienteServidor: async () => ({ auth: { getClaims } }),
}));
vi.mock("@/lib/db/consentimento", () => ({ listarAceites }));
vi.mock("@/lib/db/perfil", () => ({ existePerfil }));

const aceitesAtuais = ["termos_uso", "privacidade", "envio_ia"].map((finalidade) => ({
  finalidade, versao: VERSAO_CONSENTIMENTO, revogadoEm: null,
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
  vi.stubEnv("AI_DAILY_BUDGET_CENTS", "100");
  vi.stubEnv("DEMO_AI_DAILY_BUDGET_CENTS", "10");
  getClaims.mockResolvedValue({ data: { claims: { sub: "usuario", app_metadata: { demo: true } } } });
  listarAceites.mockResolvedValue(aceitesAtuais);
  existePerfil.mockResolvedValue(true);
});

describe("acesso à ingestão", () => {
  it("usa a identidade verificada e o teto menor da demonstração", async () => {
    await expect(autorizarIngestao()).resolves.toEqual({
      mock: false, userId: "usuario", demo: true, tetoCentavos: 10,
    });
  });

  it("recusa sessão ausente antes de consultar aceites", async () => {
    getClaims.mockResolvedValue({ data: null });
    await expect(autorizarIngestao()).rejects.toMatchObject({ status: 401 });
    expect(listarAceites).not.toHaveBeenCalled();
  });

  it.each([
    { versao: "2024-01-01" },
    { revogadoEm: "2026-11-24T12:00:00Z" },
  ])("recusa aceite de IA não vigente (%j)", async (modificacao) => {
    listarAceites.mockResolvedValue(aceitesAtuais.map((aceite) =>
      aceite.finalidade === "envio_ia" ? { ...aceite, ...modificacao } : aceite,
    ));
    await expect(autorizarIngestao()).rejects.toMatchObject({ status: 403 });
    expect(existePerfil).not.toHaveBeenCalled();
  });

  it("recusa usuário sem perfil", async () => {
    existePerfil.mockResolvedValue(false);
    await expect(autorizarIngestao()).rejects.toMatchObject({ status: 403 });
  });

  it("recusa configuração inválida de orçamento", async () => {
    vi.stubEnv("AI_DAILY_BUDGET_CENTS", "expirado");
    await expect(autorizarIngestao()).rejects.toMatchObject({ status: 429, codigo: "limite_ia" });
  });
});
