import { describe, expect, it } from "vitest";
import { prepararChat, SAUDACAO_CHAT, SEM_FONTE_CONFIAVEL } from "@/lib/ai/saidas";
import { mockDashboard, mockPerfil } from "@/lib/contracts/mocks";

const contexto = { perfil: mockPerfil, dashboard: mockDashboard, kb: [] };
const orientacao = (conteudo: string) => prepararChat([{ role: "user", conteudo }], contexto).orientacao;

describe("saudação do chat", () => {
  it.each(["Olá", "oi", "Oi!", "bom dia", "Boa tarde!", "boa noite", "Olá, bom dia", "oi tudo bem?"])(
    "responde %s com a saudação fixa e as 3 perguntas de exemplo",
    (conteudo) => {
      expect(orientacao(conteudo)).toBe(SAUDACAO_CHAT);
      expect(SAUDACAO_CHAT).toContain("Quando vence o DAS?");
      expect(SAUDACAO_CHAT).toContain("Qual o limite do MEI em 2027?");
      expect(SAUDACAO_CHAT).toContain("Posso contratar empregado?");
    },
  );

  it("pergunta fora do escopo continua sem fonte confiável", () => {
    expect(orientacao("Qual a receita de bolo de cenoura?")).toBe(SEM_FONTE_CONFIAVEL);
    expect(orientacao("Qual o melhor time de futebol?")).toBe(SEM_FONTE_CONFIAVEL);
  });

  it("saudação seguida de pergunta não vira saudação fixa", () => {
    expect(orientacao("Olá, quando vence o DAS?")).toBeNull();
  });
});
