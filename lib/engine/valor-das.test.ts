import { describe, expect, it } from "vitest";
import { valorDas } from "./index";

describe("valorDas", () => {
  it.each([
    ["comercio", 8_205],
    ["servicos", 8_605],
    ["ambos", 8_705],
  ] as const)("retorna o DAS mensal de %s em 2026 em centavos", (atividade, esperado) => {
    expect(valorDas(atividade, 2026)).toBe(esperado);
  });

  it.each([2025, 2027, 2026.5, NaN, Infinity])("rejeita o ano de competência %s", (ano) => {
    expect(() => valorDas("comercio", ano)).toThrow(RangeError);
  });

  it("rejeita uma atividade inválida em runtime", () => {
    const atividade = "industria" as Parameters<typeof valorDas>[0];
    expect(() => valorDas(atividade, 2026)).toThrow(RangeError);
  });
});
