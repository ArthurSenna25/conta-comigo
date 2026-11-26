import { describe, expect, it, vi } from "vitest";
import { selecionarTrechos } from "@/app/api/chat/conhecimento";
import { lerChat } from "@/lib/ai/saidas";
import { mockDashboard, mockPerfil } from "@/lib/contracts/mocks";

vi.mock("server-only", () => ({}));

describe("fontes verificadas no chat", () => {
  it.each([
    ["Qual é o meu limite?", "limite", "limite-mei", "81.000,00"],
    ["Quanto ainda posso faturar este ano?", "limite", "limite-mei", "81.000,00"],
    ["Qual é o limite anual do MEI?", null, "limite-mei", "81.000,00"],
    ["Quando vence o DAS?", "vencimento", "vencimento-das", "20/12/2026"],
    ["Quanto é meu DAS?", "das", "das-mei", "82,05"],
  ] as const)("responde %s citando somente a regra aplicável", async (pergunta, indicador, arquivo, valor) => {
    const kb = await selecionarTrechos(pergunta);
    const referencias = indicador ? [] : [kb.findIndex((t) => t.fonte.arquivo === `kb/${arquivo}.md`)];
    const resposta = lerChat({ indicador, referencias }, { perfil: mockPerfil, dashboard: mockDashboard, kb });
    expect(resposta.resposta).toContain(valor);
    expect(resposta.fontes).toEqual([expect.objectContaining({
      arquivo: `kb/${arquivo}.md`, url: expect.stringMatching(/^https:\/\//), verificadoEm: "2026-11-25",
    })]);
  });

  it("cita a base proporcional para o primeiro ano mesmo se o modelo indicar a regra anual", async () => {
    const kb = await selecionarTrechos("Qual é meu limite?");
    const perfil = { ...mockPerfil, dataAbertura: "2026-10-01" };
    const dashboard = { ...mockDashboard, limiteMei: { ...mockDashboard.limiteMei, limiteCentavos: 2_025_000 } };
    const outraRegra = kb.findIndex((trecho) => trecho.fonte.arquivo === "kb/limite-mei.md");
    const resposta = lerChat({ indicador: "limite", referencias: [outraRegra] }, { perfil, dashboard, kb });
    expect(resposta.resposta).toContain("20.250,00");
    expect(resposta.fontes.map((fonte) => fonte.arquivo)).toEqual(["kb/limite-proporcional.md"]);
  });

  it("saldo próprio dispensa fonte, e limite de crédito não puxa a regra fiscal", async () => {
    const kb = await selecionarTrechos("Qual é o meu saldo?");
    expect(kb).toEqual([]);
    expect(await selecionarTrechos("Qual é meu limite de crédito?")).toEqual([]);
    const resposta = lerChat({ indicador: "resumo", referencias: [] }, { perfil: mockPerfil, dashboard: mockDashboard, kb });
    expect(resposta.resposta).toContain("saldo");
    expect(resposta.fontes).toEqual([]);
  });

  it("omite o indicador fiscal se a fonte correspondente não foi selecionada no servidor", () => {
    const resposta = lerChat({ indicador: "limite", referencias: [] }, { perfil: mockPerfil, dashboard: mockDashboard, kb: [] });
    expect(resposta.resposta).not.toContain("81.000");
    expect(resposta.fontes).toEqual([]);
  });
});
