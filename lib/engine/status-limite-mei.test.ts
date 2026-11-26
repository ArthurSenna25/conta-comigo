import { describe, expect, it } from "vitest";
import { statusLimiteMei } from "./index";

const entrada = { receitasAnoCentavos: 0, dataAbertura: "2024-07-10", hoje: "2026-11-24" };

describe("statusLimiteMei", () => {
  it("usa o limite integral para empresa aberta em ano anterior, mesmo sem receita", () => {
    expect(statusLimiteMei(entrada)).toEqual({
      usadoCentavos: 0,
      limiteCentavos: 8_100_000,
      pct: 0,
      faixa: "ok",
    });
  });

  it.each([
    ["2026-01-31", "2026-11-24", 8_100_000],
    ["2026-07-31", "2026-11-24", 4_050_000],
    ["2026-12-31", "2026-12-31", 675_000],
  ])("inclui o mês de abertura no limite de %s em %s", (dataAbertura, hoje, limiteCentavos) => {
    expect(statusLimiteMei({ ...entrada, dataAbertura, hoje }).limiteCentavos).toBe(limiteCentavos);
  });

  it.each([
    [5_669_999, "ok"],
    [5_670_000, "70"],
    [5_670_001, "70"],
    [7_289_999, "70"],
    [7_290_000, "90"],
    [7_290_001, "90"],
    [8_099_999, "90"],
    [8_100_000, "100"],
    [8_100_001, "100"],
  ])("classifica %i centavos na faixa %s sem arredondar o percentual", (receitasAnoCentavos, faixa) => {
    expect(statusLimiteMei({ ...entrada, receitasAnoCentavos }).faixa).toBe(faixa);
  });

  it("preserva o percentual fracionário e usa o limite proporcional na classificação", () => {
    expect(statusLimiteMei({ ...entrada, dataAbertura: "2026-07-31", receitasAnoCentavos: 2_855_250 })).toEqual({
      usadoCentavos: 2_855_250,
      limiteCentavos: 4_050_000,
      pct: 70.5,
      faixa: "70",
    });
  });

  it("preserva o percentual acima de 100%", () => {
    expect(statusLimiteMei({ ...entrada, receitasAnoCentavos: 8_505_000 })).toMatchObject({ pct: 105, faixa: "100" });
  });

  it.each(["2026-11-25", "2027-01-01"])("rejeita a abertura futura em %s", (dataAbertura) => {
    expect(() => statusLimiteMei({ ...entrada, dataAbertura })).toThrow(RangeError);
  });
});
