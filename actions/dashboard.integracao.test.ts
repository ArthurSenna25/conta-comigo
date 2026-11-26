import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardResponse, type Atividade, type Lancamento } from "@/lib/contracts";
import { mockPerfil } from "@/lib/contracts/mocks";
import { obterDashboard } from "./dashboard";

// Engine REAL: só sessão, banco e relógio (hojeBrasil) são simulados.
const m = vi.hoisted(() => ({ exigirAcesso: vi.fn(), lerPerfil: vi.fn(), listarLancamentos: vi.fn(), hoje: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./sessao", () => ({ exigirAcesso: m.exigirAcesso }));
vi.mock("@/lib/db/cliente-servidor", () => ({ criarClienteServidor: async () => ({}) }));
vi.mock("@/lib/db/perfil", () => ({ lerPerfil: m.lerPerfil }));
vi.mock("@/lib/db/lancamento", () => ({
  listarLancamentosDashboard: async (
    _db: unknown,
    _userId: string,
    { de, ate }: { de: string; ate: string },
    tipo?: Lancamento["tipo"],
  ) => {
    const lancamentos: Lancamento[] = await m.listarLancamentos();
    return lancamentos.filter((l) => l.data >= de && l.data < ate && (!tipo || l.tipo === tipo));
  },
}));
vi.mock("@/lib/security/datas", () => ({ hojeBrasil: m.hoje }));

const lancamento = (numero: number, tipo: Lancamento["tipo"], data: string, valorCentavos: number): Lancamento => ({
  id: `00000000-0000-4000-8000-${String(numero).padStart(12, "0")}`,
  tipo,
  valorCentavos,
  data,
  categoria: tipo === "receita" ? "vendas" : "outras",
  descricao: "sintético",
  origem: "manual",
  documentoId: null,
  contraparte: null,
  formaPgto: null,
  criadoEm: "2026-11-01T12:00:00.000Z",
  atualizadoEm: "2026-11-01T12:00:00.000Z",
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
    m.listarLancamentos.mockResolvedValue([lancamento(1, "receita", "2026-11-03", 500_000), lancamento(2, "despesa", "2026-11-10", 120_000)]);
    const r = await obterDashboard("2026-11");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(DashboardResponse.safeParse(r.dados).success).toBe(true);
    expect(r.dados.resumoMes).toMatchObject({ mes: "2026-11", receitaCentavos: 500_000, despesaCentavos: 120_000, saldoCentavos: 380_000 });
    expect(r.dados.proximoDas).toEqual({ vencimento: "2026-12-21", valorCentavos: 8_205 });
    expect(r.dados.alertas).toEqual([]);
  });

  it("usa a receita de janeiro para o alerta e preserva o resumo do mês selecionado de outro ano", async () => {
    m.listarLancamentos.mockResolvedValue([
      lancamento(1, "receita", "2026-01-10", 1_670_000),
      lancamento(2, "receita", "2025-08-10", 50_000),
      lancamento(3, "despesa", "2025-08-11", 20_000),
    ]);
    expect(await obterDashboard("2025-08")).toMatchObject({
      ok: true,
      dados: {
        resumoMes: { mes: "2025-08", receitaCentavos: 50_000, despesaCentavos: 20_000, saldoCentavos: 30_000 },
        limiteMei: { usadoCentavos: 5_670_000, faixa: "70" },
        alertas: [{ chave: "limite_mei:2026:70" }],
      },
    });
  });

  it.each([
    ["2027-01-01T02:59:59Z", 5_670_000, [{ chave: "limite_mei:2026:70" }]],
    ["2027-01-01T03:00:00Z", 1_670_000, []],
  ])("em 31/12 em São Paulo, considera o cadastro em %s no ano civil correspondente", async (criadoEm, usadoCentavos, alertas) => {
    m.hoje.mockReturnValue("2026-12-31");
    m.lerPerfil.mockResolvedValue({ ...mockPerfil, criadoEm });
    m.listarLancamentos.mockResolvedValue([lancamento(1, "receita", "2026-01-10", 1_670_000)]);
    expect(await obterDashboard()).toMatchObject({
      ok: true,
      dados: { resumoMes: { mes: "2026-12" }, limiteMei: { usadoCentavos, projecaoAnualCentavos: usadoCentavos }, alertas },
    });
  });

  it("apura lembretes do mês atual e dos dois anteriores até hoje inclusive", async () => {
    // Em 05/01 a janela começa em 01/11, mesmo quando o painel exibe outro mês.
    m.hoje.mockReturnValue("2027-01-05");
    const despesa = (numero: number, data: string): Lancamento => ({
      ...lancamento(numero, "despesa", data, 100),
      categoria: "estoque",
    });
    const inicio = despesa(2, "2026-11-01");
    const hoje = despesa(3, "2027-01-05");
    m.listarLancamentos.mockResolvedValue([
      despesa(1, "2026-10-31"),
      inicio,
      hoje,
      despesa(4, "2027-01-06"),
      { ...despesa(5, "2026-12-01"), documentoId: inicio.id },
    ]);
    expect(await obterDashboard("2026-10")).toMatchObject({
      ok: true,
      dados: {
        resumoMes: { mes: "2026-10", despesaCentavos: 100 },
        alertas: [{ chave: `nota_faltando:${inicio.id}` }, { chave: `nota_faltando:${hoje.id}` }],
      },
    });
  });

  it("exclui do acumulado receitas anteriores à abertura, futuras e duplicadas", async () => {
    m.lerPerfil.mockResolvedValue({ ...mockPerfil, dataAbertura: "2026-02-01", receitaInicialCentavos: 0 });
    const receitaValida = lancamento(2, "receita", "2026-11-25", 100_000);
    m.listarLancamentos.mockResolvedValue([
      lancamento(1, "receita", "2026-01-31", 6_000_000),
      receitaValida,
      receitaValida,
      lancamento(3, "receita", "2026-11-26", 6_000_000),
    ]);
    expect(await obterDashboard("2026-10")).toMatchObject({
      ok: true,
      dados: { limiteMei: { usadoCentavos: 100_000, faixa: "ok" }, alertas: [] },
    });
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
