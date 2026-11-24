import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardResponse } from "@/lib/contracts";
import { mockDashboard, mockPerfil } from "@/lib/contracts/mocks";
import { obterDashboard } from "./dashboard";

const m = vi.hoisted(() => ({
  exigirAcesso: vi.fn(),
  lerPerfil: vi.fn(),
  listarLancamentos: vi.fn(),
  resumoMes: vi.fn(),
  statusLimiteMei: vi.fn(),
  projecaoAnual: vi.fn(),
  proximoVencimentoDas: vi.fn(),
  valorDas: vi.fn(),
  gerarAlertas: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("./sessao", () => ({ exigirAcesso: m.exigirAcesso }));
vi.mock("@/lib/db/cliente-servidor", () => ({ criarClienteServidor: async () => ({}) }));
vi.mock("@/lib/db/perfil", () => ({ lerPerfil: m.lerPerfil }));
vi.mock("@/lib/db/lancamento", () => ({ listarLancamentos: m.listarLancamentos }));
vi.mock("@/lib/engine", () => ({
  resumoMes: m.resumoMes,
  statusLimiteMei: m.statusLimiteMei,
  projecaoAnual: m.projecaoAnual,
  proximoVencimentoDas: m.proximoVencimentoDas,
  valorDas: m.valorDas,
  gerarAlertas: m.gerarAlertas,
}));

const naoImplementado = () => {
  throw new Error("not implemented");
};
const funcoesDoEngine = [m.resumoMes, m.statusLimiteMei, m.projecaoAnual, m.proximoVencimentoDas, m.valorDas, m.gerarAlertas];

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.exigirAcesso.mockResolvedValue({ userId: "u1", demo: false, consentimentoVigente: true });
  m.lerPerfil.mockResolvedValue(mockPerfil);
  m.listarLancamentos.mockResolvedValue([]);
});

describe("obterDashboard", () => {
  it("enquanto o engine não está pronto: devolve um painel vazio e válido, sem quebrar", async () => {
    for (const f of funcoesDoEngine) f.mockImplementation(naoImplementado);
    const r = await obterDashboard("2026-11");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(DashboardResponse.safeParse(r.dados).success).toBe(true);
      expect(r.dados).toMatchObject({ resumoMes: { mes: "2026-11", receitaCentavos: 0 }, alertas: [] });
    }
  });

  it("monta a resposta com os números do engine (a action não calcula nada)", async () => {
    m.resumoMes.mockReturnValue(mockDashboard.resumoMes);
    m.statusLimiteMei.mockReturnValue({ usadoCentavos: 1, limiteCentavos: 8_100_000, pct: 0, faixa: "ok" });
    m.projecaoAnual.mockReturnValue(123);
    m.proximoVencimentoDas.mockReturnValue("2026-12-20");
    m.valorDas.mockReturnValue(7_190);
    m.gerarAlertas.mockReturnValue([]);
    const r = await obterDashboard("2026-11");
    expect(r).toMatchObject({
      ok: true,
      dados: { limiteMei: { projecaoAnualCentavos: 123 }, proximoDas: { vencimento: "2026-12-20", valorCentavos: 7_190 } },
    });
  });

  it("erro do engine que não é 'not implemented' vira erro genérico (não é escondido)", async () => {
    m.resumoMes.mockImplementation(() => {
      throw new Error("bug-interno");
    });
    const r = await obterDashboard("2026-11");
    expect(r).toMatchObject({ ok: false, erro: { codigo: "interno" } });
    expect(JSON.stringify(r)).not.toContain("bug-interno");
  });

  it("mês inválido: erro de validação", async () => {
    expect(await obterDashboard("novembro")).toMatchObject({ ok: false, erro: { codigo: "invalido" } });
  });

  it("modo mock: devolve o dashboard de mock", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    expect(await obterDashboard()).toEqual({ ok: true, dados: mockDashboard });
  });
});
