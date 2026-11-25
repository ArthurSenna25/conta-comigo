import { describe, expect, it } from "vitest";
import { puxarIma } from "./ponteiro";

describe("ímã", () => {
  it("não move com o cursor no centro e segue uma fração do desvio", () => {
    expect(puxarIma(100, 50, 100, 50)).toEqual({ x: 0, y: 0 });
    const d = puxarIma(120, 40, 100, 50);
    expect(d.x).toBeCloseTo(6);
    expect(d.y).toBeCloseTo(-3);
  });
});
