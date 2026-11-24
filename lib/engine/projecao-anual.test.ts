import { describe, expect, it } from "vitest";
import { projecaoAnual } from "./index";

const entrada = { receitasAnoCentavos: 3_000_000, dataAbertura: "2024-07-10", hoje: "2026-06-01" };

describe("projecaoAnual", () => {
  it("retorna zero quando não há receita", () => {
    expect(projecaoAnual({ ...entrada, receitasAnoCentavos: 0 })).toBe(0);
  });

  it("usa a média de janeiro até o mês atual para empresa aberta em ano anterior", () => {
    expect(projecaoAnual(entrada)).toBe(6_000_000);
  });

  it("inclui o mês de abertura e o mês atual na média para empresa aberta neste ano", () => {
    expect(projecaoAnual({ ...entrada, dataAbertura: "2026-04-30" })).toBe(9_000_000);
  });

  it("em dezembro, a projeção coincide com a receita acumulada mesmo no mês de abertura", () => {
    expect(projecaoAnual({ ...entrada, dataAbertura: "2026-12-31", hoje: "2026-12-31" })).toBe(3_000_000);
  });

  it("preserva a receita acumulada próxima ao maior inteiro seguro em dezembro", () => {
    const receitasAnoCentavos = Number.MAX_SAFE_INTEGER - 1;
    expect(projecaoAnual({ ...entrada, receitasAnoCentavos, hoje: "2026-12-01" })).toBe(receitasAnoCentavos);
  });

  it("rejeita uma projeção que ultrapassa o maior inteiro seguro após o arredondamento", () => {
    expect(() => projecaoAnual({ ...entrada, receitasAnoCentavos: Number.MAX_SAFE_INTEGER }))
      .toThrow("A projeção ultrapassa o limite de inteiros seguros em centavos");
  });

  it.each([
    [100, 133],
    [101, 135],
  ])("arredonda a projeção de %i centavos para %i centavos", (receitasAnoCentavos, esperado) => {
    expect(projecaoAnual({ ...entrada, receitasAnoCentavos, hoje: "2026-09-01" })).toBe(esperado);
  });

  it("arredonda meio centavo para cima", () => {
    expect(projecaoAnual({ ...entrada, receitasAnoCentavos: 1, hoje: "2026-08-01" })).toBe(2);
  });

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejeita a receita inválida %s", (receitasAnoCentavos) => {
    expect(() => projecaoAnual({ ...entrada, receitasAnoCentavos }))
      .toThrow("A receita deve ser um inteiro seguro não negativo em centavos");
  });

  it.each(["2026-06-02", "2027-01-01"])("rejeita a abertura futura em %s", (dataAbertura) => {
    expect(() => projecaoAnual({ ...entrada, dataAbertura })).toThrow(RangeError);
  });
});
