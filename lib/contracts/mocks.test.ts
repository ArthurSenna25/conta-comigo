import { describe, expect, it } from "vitest";
import { ChatResponse, DashboardResponse, IngestResponse, Lancamento, Perfil } from "@/lib/contracts";
import { mockChat, mockDashboard, mockIngest, mockLancamentos, mockPerfil } from "@/lib/contracts/mocks";

describe("mocks respeitam os contratos", () => {
  it.each([
    ["Perfil", Perfil, mockPerfil],
    ["DashboardResponse", DashboardResponse, mockDashboard],
    ["IngestResponse", IngestResponse, mockIngest],
    ["ChatResponse", ChatResponse, mockChat],
  ] as const)("%s", (_nome, schema, mock) => {
    expect(schema.safeParse(mock).error).toBeUndefined();
  });

  it("Lancamento: 3 meses, ids únicos, todos válidos", () => {
    for (const l of mockLancamentos) {
      expect(Lancamento.safeParse(l).error).toBeUndefined();
    }
    expect(new Set(mockLancamentos.map((l) => l.id)).size).toBe(mockLancamentos.length);
    expect(new Set(mockLancamentos.map((l) => l.data.slice(0, 7)))).toEqual(
      new Set(["2026-09", "2026-10", "2026-11"]),
    );
  });

  it("alertas apontam para lançamentos que existem", () => {
    const ids = new Set(mockLancamentos.map((l) => l.id));
    for (const a of mockDashboard.alertas) {
      if (a.lancamentoId) expect(ids.has(a.lancamentoId)).toBe(true);
    }
  });
});
