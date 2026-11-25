import { describe, expect, it } from "vitest";
import { anoDaCompetenciaDas } from "./competencia-das";

describe("anoDaCompetenciaDas", () => {
  it("vencimento em dezembro: competência é do mesmo ano", () => {
    expect(anoDaCompetenciaDas("2026-12-21")).toBe(2026);
  });
  it("vencimento em janeiro: competência é de dezembro do ano anterior", () => {
    expect(anoDaCompetenciaDas("2027-01-20")).toBe(2026);
  });
  it("vencimento em fevereiro: competência é do mesmo ano", () => {
    expect(anoDaCompetenciaDas("2027-02-20")).toBe(2027);
  });
  it.each(["", "2026-13-01", "20/12/2026", "2026-02-30"])("entrada inválida %j: RangeError", (v) => {
    expect(() => anoDaCompetenciaDas(v)).toThrow(RangeError);
  });
});
