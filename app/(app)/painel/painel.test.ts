import { describe, expect, it } from "vitest";
import { mockDashboard } from "@/lib/contracts/mocks";
import { diasAte, escolherProximoPasso, painelSemTabelaDoDas } from "./painel";

const base = { vazio: false, faixa: "ok", vencimentoDas: "2026-12-21", hoje: "2026-11-25", adicionarAtivo: true } as const;

describe("painelSemTabelaDoDas (marcador de 2027)", () => {
  it("reconhece o marcador valorCentavos: 1", () => {
    const vazio = { ...mockDashboard, proximoDas: { vencimento: "2027-02-22", valorCentavos: 1 } };
    expect(painelSemTabelaDoDas(vazio)).toBe(true);
  });

  it("não confunde DAS real com o marcador", () => {
    expect(painelSemTabelaDoDas(mockDashboard)).toBe(false);
  });
});

describe("diasAte", () => {
  it("conta dias de calendário, sem efeito de fuso", () => {
    expect(diasAte("2026-11-25", "2026-12-21")).toBe(26);
    expect(diasAte("2026-12-20", "2026-12-20")).toBe(0);
    expect(diasAte("2026-12-31", "2027-01-20")).toBe(20);
  });
});

describe("escolherProximoPasso (regras do 03, primeira verdadeira)", () => {
  it("regra 1: sem receita no ano manda para /adicionar quando a tela existe", () => {
    expect(escolherProximoPasso({ ...base, vazio: true })).toMatchObject({ tom: "acento", selo: "+", href: "/adicionar" });
  });

  it("regra 1 é pulada enquanto /adicionar está desligado (sem link morto)", () => {
    expect(escolherProximoPasso({ ...base, vazio: true, adicionarAtivo: false })).toMatchObject({ tom: "ok" });
  });

  it("regra 2: estourou → tom estourou, para o chat", () => {
    expect(escolherProximoPasso({ ...base, faixa: "100" })).toMatchObject({ tom: "estourou", selo: "!", href: "/chat" });
  });

  it.each(["70", "90"] as const)("regra 3: faixa %s → tom atencao, para o chat", (faixa) => {
    const passo = escolherProximoPasso({ ...base, faixa });
    expect(passo).toMatchObject({ tom: "atencao", selo: "!", href: "/chat" });
    // o limiar é do engine (70/90); o texto não promete "80%"
    expect(passo.titulo).not.toMatch(/80/);
  });

  it("regra 5: com folga mostra o DAS, com o dia do vencimento no selo", () => {
    expect(escolherProximoPasso(base)).toMatchObject({ tom: "ok", selo: "21", titulo: "Seu DAS vence em 26 dias", href: "/chat" });
  });

  it("regra 5: singular e vencimento hoje", () => {
    expect(escolherProximoPasso({ ...base, hoje: "2026-12-20" }).titulo).toBe("Seu DAS vence em 1 dia");
    expect(escolherProximoPasso({ ...base, hoje: "2026-12-21" }).titulo).toBe("Seu DAS vence hoje");
  });
});
