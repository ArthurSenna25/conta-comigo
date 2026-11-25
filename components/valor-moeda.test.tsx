import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fonteValida } from "./chip-fonte";
import { textoValor, ValorMoeda } from "./valor-moeda";

const NBSP = " ";

describe("ValorMoeda", () => {
  it("entrada com + e saída com sinal de menos U+2212, sempre em módulo", () => {
    expect(textoValor(18_000, "entrada")).toBe(`+ R$${NBSP}180,00`);
    expect(textoValor(-24_590, "saida")).toBe(`− R$${NBSP}245,90`);
    expect(textoValor(24_590, "saida")).toBe(`− R$${NBSP}245,90`);
  });

  it("usa Manrope tabular (.num) e cor de entrada", () => {
    const html = renderToStaticMarkup(<ValorMoeda centavos={18_000} sinal="entrada" />);
    expect(html).toContain("num");
    expect(html).toContain("text-ok");
  });

  it("contando, o HTML inicial já traz o valor final para leitor de tela", () => {
    const html = renderToStaticMarkup(<ValorMoeda centavos={3_402_000} contar />);
    expect(html).toContain(`<span class="sr-only">R$${NBSP}34.020,00</span>`);
  });
});

describe("ChipFonte: fonte válida", () => {
  it("exige https e data ISO", () => {
    expect(fonteValida("https://example.com/lei", "2026-11-24")).toBe(true);
    expect(fonteValida("http://example.com/lei", "2026-11-24")).toBe(false);
    expect(fonteValida("javascript:alert(1)", "2026-11-24")).toBe(false);
    expect(fonteValida("https://example.com/lei", "")).toBe(false);
    expect(fonteValida("https://example.com/lei", "24/11/2026")).toBe(false);
  });
});
