import { expect, it, vi } from "vitest";
import { obterDashboard } from "@/actions/dashboard";
import { carregarContexto } from "@/app/api/chat/contexto";
import type { Lancamento } from "@/lib/contracts";
import { mockPerfil } from "@/lib/contracts/mocks";

const db = vi.hoisted(() => ({ perfil: vi.fn(), listar: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/actions/sessao", () => ({ exigirAcesso: async () => ({ userId: "demo" }) }));
vi.mock("@/lib/security/modo-mock", () => ({ modoMock: () => false }));
vi.mock("@/lib/security/datas", () => ({ hojeBrasil: () => "2026-11-28" }));
vi.mock("@/lib/db/cliente-servidor", () => ({ criarClienteServidor: async () => ({}) }));
vi.mock("@/lib/db/perfil", () => ({ lerPerfil: db.perfil }));
vi.mock("@/lib/db/lancamento", () => ({ listarLancamentosDashboard: db.listar }));

function lancamento(id: string, data: string, valorCentavos: number, tipo: Lancamento["tipo"] = "receita"): Lancamento {
  return {
    id, data, valorCentavos, tipo, categoria: "outras", descricao: "sintético", origem: "manual",
    documentoId: null, contraparte: null, formaPgto: null,
    criadoEm: "2026-11-01T12:00:00.000Z", atualizadoEm: "2026-11-01T12:00:00.000Z",
  };
}

it.each([
  ["2026-01-01T02:59:59Z", 12345],
  ["2026-01-01T03:00:00Z", 13345],
])("chat e painel consideram a receita inicial do cadastro em %s pelo mesmo ano civil", async (criadoEm, total) => {
  db.perfil.mockResolvedValue({ ...mockPerfil, criadoEm, dataAbertura: "2026-03-01", receitaInicialCentavos: 1000 });
  const dentro = lancamento("dentro", "2026-11-28", 12345);
  const linhas = [
    dentro, dentro,
    lancamento("antigo", "2025-11-28", 90000),
    lancamento("antes-abertura", "2026-02-01", 50000),
    lancamento("futuro", "2026-11-29", 20000),
    lancamento("despesa", "2026-11-20", 500, "despesa"),
  ];
  db.listar.mockImplementation(async (_db, _user, { de, ate }, tipo) =>
    linhas.filter((l) => l.data >= de && l.data < ate && (!tipo || l.tipo === tipo)));
  const painel = await obterDashboard();
  const chat = await carregarContexto("demo", []);
  expect(painel).toMatchObject({ ok: true, dados: { limiteMei: { usadoCentavos: total } } });
  expect(chat?.dashboard.limiteMei).toMatchObject({ usadoCentavos: total });
  if (painel.ok) expect(chat?.dashboard.limiteMei).toEqual(painel.dados.limiteMei);
});
