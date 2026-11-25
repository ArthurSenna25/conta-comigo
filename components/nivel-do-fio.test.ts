import { describe, expect, it } from "vitest";
import { FaixaLimite } from "@/lib/contracts";
import { nivelDoFio } from "./nivel-do-fio";

describe("nivelDoFio (mapeamento provisório)", () => {
  it.each([
    ["ok", "folga"],
    ["70", "atencao"],
    ["90", "atencao"],
    ["100", "estourou"],
  ] as const)("faixa %s → %s", (faixa, nivel) => {
    expect(nivelDoFio(faixa)).toBe(nivel);
  });

  it("cobre todas as faixas do contrato", () => {
    for (const faixa of FaixaLimite.options) {
      expect(["folga", "atencao", "estourou"]).toContain(nivelDoFio(faixa));
    }
  });
});
