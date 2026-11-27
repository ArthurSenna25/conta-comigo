import { describe, expect, it } from "vitest";
import { mockLancamentos } from "@/lib/contracts/mocks";
import { avisoDoDescarte, criarTrava, desfechoDaConfirmacao } from "./confirmacao";

const falha = (codigo: "invalido" | "interno" | "nao_autenticado", mensagem = "msg") => ({ ok: false as const, erro: { codigo, mensagem } });

describe("desfechoDaConfirmacao", () => {
  it("ok → salvo com a quantidade", () => {
    expect(desfechoDaConfirmacao({ ok: true, dados: { lancamentos: mockLancamentos.slice(0, 2) } })).toEqual({ tipo: "salvo", quantidade: 2 });
  });

  it("exceção (rede/timeout) é ambígua", () => {
    expect(desfechoDaConfirmacao("excecao")).toEqual({ tipo: "ambiguo" });
  });

  it("erro interno (5xx) é ambíguo", () => {
    expect(desfechoDaConfirmacao(falha("interno"))).toEqual({ tipo: "ambiguo" });
  });

  it("validação e 4xx deixam corrigir e reenviar, com a mensagem do servidor", () => {
    expect(desfechoDaConfirmacao(falha("invalido", "Confira os dados"))).toEqual({ tipo: "corrigir", mensagem: "Confira os dados" });
    expect(desfechoDaConfirmacao(falha("nao_autenticado"))).toMatchObject({ tipo: "corrigir" });
  });
});

describe("criarTrava", () => {
  it("só o primeiro envio passa até soltar", () => {
    const t = criarTrava();
    expect(t.pegar()).toBe(true);
    expect(t.pegar()).toBe(false);
    expect(t.pegar()).toBe(false);
    t.soltar();
    expect(t.pegar()).toBe(true);
  });
});

describe("avisoDoDescarte", () => {
  const INCERTO = { titulo: "Rascunho descartado", sub: "Confira em Lançamentos se o lançamento chegou a ser salvo" };

  it("nunca enviado: IA diz que nada foi salvo; manual não avisa", () => {
    expect(avisoDoDescarte(false, false)).toEqual({ titulo: "Rascunho descartado", sub: "Nada foi salvo" });
    expect(avisoDoDescarte(true, false)).toBeNull();
  });

  it("confirmação ambígua nunca diz 'Nada foi salvo', em IA ou manual", () => {
    expect(avisoDoDescarte(false, true)).toEqual(INCERTO);
    expect(avisoDoDescarte(true, true)).toEqual(INCERTO);
  });
});
