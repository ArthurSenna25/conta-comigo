import { describe, expect, it } from "vitest";
import { passoAtual } from "./cenas";

describe("passo do Siga o Fio", () => {
  it("divide o progresso em 4 passos e não passa do último", () => {
    expect([0, 0.24, 0.25, 0.5, 0.74, 0.75, 0.99, 1].map((p) => passoAtual(p, 4))).toEqual([0, 0, 1, 2, 2, 3, 3, 3]);
  });

  it("aguenta progresso fora de 0..1", () => {
    expect(passoAtual(-0.2, 4)).toBe(0);
    expect(passoAtual(1.4, 4)).toBe(3);
  });
});
