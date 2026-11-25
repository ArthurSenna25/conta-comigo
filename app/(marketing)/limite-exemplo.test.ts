import { describe, expect, it } from "vitest";
import { barrasExemplo, nivelExemplo, TOTAL_EXEMPLO_CENTAVOS } from "./limite-exemplo";

describe("dados de exemplo do limite", () => {
  it("somam R$ 84.240,00, o valor citado no texto da landing", () => {
    expect(TOTAL_EXEMPLO_CENTAVOS).toBe(8_424_000);
  });

  it("pintam cada barra pelo acumulado: folga até ago, atenção em set/out, estourou em nov", () => {
    const niveis = barrasExemplo().map((b) => b.nivel);
    expect(niveis).toEqual([...Array(8).fill("folga"), "atencao", "atencao", "estourou"]);
  });

  it("usa 80% como início da atenção e só estoura acima de 100%", () => {
    expect(nivelExemplo(6_479_999)).toBe("folga");
    expect(nivelExemplo(6_480_000)).toBe("atencao");
    expect(nivelExemplo(8_100_000)).toBe("atencao");
    expect(nivelExemplo(8_100_001)).toBe("estourou");
  });
});
