import { describe, expect, it } from "vitest";
import { dataFutura, hojeBrasil } from "./datas";

describe("hojeBrasil (America/Sao_Paulo)", () => {
  it("23h30 em Brasília ainda é o mesmo dia, mesmo já sendo o dia seguinte em UTC", () => {
    expect(hojeBrasil(new Date("2026-11-25T02:30:00Z"))).toBe("2026-11-24"); // 23:30 -03
  });

  it("virou o dia em Brasília", () => {
    expect(hojeBrasil(new Date("2026-11-25T03:00:00Z"))).toBe("2026-11-25"); // 00:00 -03
  });
});

describe("dataFutura", () => {
  it("hoje não é futuro; amanhã é", () => {
    expect(dataFutura("2026-11-24", "2026-11-24")).toBe(false);
    expect(dataFutura("2026-11-23", "2026-11-24")).toBe(false);
    expect(dataFutura("2026-11-25", "2026-11-24")).toBe(true);
    expect(dataFutura("2027-01-01", "2026-12-31")).toBe(true);
  });
});
