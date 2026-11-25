import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardResponse, type Atividade } from "@/lib/contracts";
import { mockPerfil } from "@/lib/contracts/mocks";
import { obterDashboard } from "./dashboard";

// Engine REAL: só sessão, banco e relógio (hojeBrasil) são simulados.
const m = vi.hoisted(() => ({ exigirAcesso: vi.fn(), lerPerfil: vi.fn(), listarLancamentos: vi.fn(), hoje: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./sessao", () => ({ exigirAcesso: m.exigirAcesso }));
vi.mock("@/lib/db/cliente-servidor", () => ({ criarClienteServidor: async () => ({}) }));
vi.mock("@/lib/db/perfil", () => ({ lerPerfil: m.lerPerfil }));
vi.mock("@/lib/db/lancamento", () => ({ listarLancamentos: m.listarLancamentos }));
vi.mock("@/lib/security/datas", () => ({ hojeBrasil: m.hoje }));

const lancamento = (tipo: "receita" | "despesa", data: string, valorCentavos: number) => ({
  id: "00000000-0000-4000-8000-000000000001",
  userId: mockPerfil.userId,
  tipo,
  valorCentavos,
  data,
  categoria: tipo === "receita" ? "venda" : "outros",
  descricao: "sintético",
  origem: "manual",
  documentoPath: null,
  criadoEm: "2026-11-01T12:00:00.000Z",
});

function comPerfil(atividade: Atividade) {
  m.lerPerfil.mockResolvedValue({ ...mockPerfil, atividade });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.exigirAcesso.mockResolvedValue({ userId: "u1", demo: false, consentimentoVigente: true });
  m.listarLancamentos.mockResolvedValue([]);
  m.hoje.mockReturnValue("2026-11-25");
  comPerfil("comercio");
});

describe("obterDashboard com engine real", () => {
  it("dashboard real com dados sintéticos: resumo do mês, DAS e alertas vazios", async () => {
    m.listarLancamentos.mockResolvedValue([lancamento("receita", "2026-11-03", 500_000), lancamento("despesa", "2026-11-10", 120_000)]);
    const r = await obterDashboard("2026-11");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(DashboardResponse.safeParse(r.dados).success).toBe(true);
    expect(r.dados.resumoMes).toMatchObject({ mes: "2026-11", receitaCentavos: 500_000, despesaCentavos: 120_000, saldoCentavos: 380_000 });
    expect(r.dados.proximoDas).toEqual({ vencimento: "2026-12-21", valorCentavos: 8_205 });
    expect(r.dados.alertas).toEqual([]);
  });

  it.each([
    ["comercio", 8_205],
    ["servicos", 8_605],
    ["ambos", 8_705],
  ] as const)("DAS de %s = %i centavos", async (atividade, esperado) => {
    comPerfil(atividade);
    const r = await obterDashboard("2026-11");
    expect(r).toMatchObject({ ok: true, dados: { proximoDas: { valorCentavos: esperado } } });
  });

  it("vencimento em janeiro/2027 ainda é competência 2026: valor oficial, sem fallback", async () => {
    m.hoje.mockReturnValue("2026-12-28");
    const r = await obterDashboard("2026-12");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.dados.proximoDas.valorCentavos).toBe(8_205);
  });

  it("competência 2027 (sem tabela): fallback dashboardVazio, com o marcador valorCentavos 1", async () => {
    m.hoje.mockReturnValue("2027-01-25");
    const r = await obterDashboard("2027-01");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(DashboardResponse.safeParse(r.dados).success).toBe(true);
    expect(r.dados.proximoDas.valorCentavos).toBe(1);
    expect(r.dados.resumoMes.receitaCentavos).toBe(0);
  });
});
