import { describe, expect, it } from "vitest";
import { ABAS, ADICIONAR, abaAtual, mostrarAbas } from "./navegacao";

describe("lista de navegação do app", () => {
  it("tem as 4 abas do handoff, na ordem", () => {
    expect(ABAS.map((a) => a.href)).toEqual(["/painel", "/lancamentos", "/chat", "/perfil"]);
  });

  it("liga só as telas que já existem: painel, lançamentos e chat", () => {
    expect(ABAS.filter((a) => a.ativo).map((a) => a.href)).toEqual(["/painel", "/lancamentos", "/chat"]);
    expect(ADICIONAR).toMatchObject({ href: "/adicionar", ativo: false });
  });

  it("acha a aba da rota atual, inclusive em subrotas", () => {
    expect(abaAtual("/painel")).toBe("/painel");
    expect(abaAtual("/chat/algo")).toBe("/chat");
  });

  it("não confunde prefixo de texto com subrota nem mostra abas fora delas", () => {
    expect(abaAtual("/painelx")).toBeNull();
    expect(abaAtual("/adicionar")).toBeNull();
    expect(abaAtual("/")).toBeNull();
  });

  it("mostra a barra nas abas, mas não no chat (tela cheia, desvio registrado)", () => {
    expect(mostrarAbas("/painel")).toBe(true);
    expect(mostrarAbas("/lancamentos")).toBe(true);
    expect(mostrarAbas("/chat")).toBe(false);
    expect(mostrarAbas("/adicionar")).toBe(false);
  });
});
