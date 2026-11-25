import { describe, expect, it } from "vitest";
import {
  barrasExemplo,
  mesesCheios,
  nivelExemplo,
  preenchimento,
  TOTAL_EXEMPLO_CENTAVOS,
  totalNoProgresso,
} from "./limite-exemplo";

describe("dados de exemplo do limite", () => {
  it("somam R$ 84.240,00, o valor citado no texto da landing", () => {
    expect(TOTAL_EXEMPLO_CENTAVOS).toBe(8_424_000);
  });

  it("pintam cada barra pelo acumulado, com a faixa do engine: folga até jul, atenção de ago a out, estourou em nov", () => {
    const niveis = barrasExemplo().map((b) => b.nivel);
    expect(niveis).toEqual([...Array(7).fill("folga"), "atencao", "atencao", "atencao", "estourou"]);
  });

  it("delega o limiar ao lib/engine (70% atenção, 100% estourou) via nivelDoFio", () => {
    expect(nivelExemplo(5_669_999)).toBe("folga");
    expect(nivelExemplo(5_670_000)).toBe("atencao");
    expect(nivelExemplo(8_099_999)).toBe("atencao");
    expect(nivelExemplo(8_100_000)).toBe("estourou");
  });
});

describe("limite ligado ao scroll", () => {
  const barras = barrasExemplo();
  const n = barras.length;

  it("enche as barras uma a uma pelo progresso", () => {
    expect(preenchimento(0, 0, n)).toBe(0);
    expect(preenchimento(0.5 / n, 0, n)).toBeCloseTo(0.5);
    expect(preenchimento(0.5 / n, 1, n)).toBe(0);
    expect(preenchimento(1, n - 1, n)).toBe(1);
  });

  it("vai de R$ 0 ao total do exemplo, sem passar dele", () => {
    expect(totalNoProgresso(barras, 0)).toBe(0);
    expect(totalNoProgresso(barras, 1)).toBe(TOTAL_EXEMPLO_CENTAVOS);
    expect(totalNoProgresso(barras, 1.2)).toBe(TOTAL_EXEMPLO_CENTAVOS);
    expect(totalNoProgresso(barras, 1 / n)).toBe(barras[0].centavos);
  });

  it("conta meses cheios de 0 a 11", () => {
    expect(mesesCheios(0, n)).toBe(0);
    expect(mesesCheios(0.999 / n, n)).toBe(0);
    expect(mesesCheios(1 / n, n)).toBe(1);
    expect(mesesCheios(1, n)).toBe(n);
    expect(mesesCheios(-0.1, n)).toBe(0);
  });
});
