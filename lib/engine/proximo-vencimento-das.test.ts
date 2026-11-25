import { describe, expect, it } from "vitest";
import { proximoVencimentoDas } from "./index";

// Regra de vencimento e dias não úteis consultados em 25/11/2026.
// https://www8.receita.fazenda.gov.br/SimplesNacional/ConteudoApoio/Agenda/Agenda.aspx
// https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=4880&tipo=RESOLU%C3%87%C3%83O+CMN
// PENDENTE: confirmar calendários bancários adicionais, fechamentos locais
// e prorrogações excepcionais antes de incluir novos casos.
// Pontos facultativos da administração pública exigem confirmação de ausência de expediente bancário.
describe("proximoVencimentoDas", () => {
  it.each([
    ["2026-05-19", "2026-05-20"],
    ["2026-05-20", "2026-05-20"],
    ["2026-05-21", "2026-06-22"],
    ["2026-06-20", "2026-06-22"],
    ["2026-11-20", "2026-11-23"],
    ["2026-11-21", "2026-11-23"],
    ["2026-11-22", "2026-11-23"],
    ["2026-11-23", "2026-11-23"],
    ["2026-11-24", "2026-12-21"],
    ["2026-12-20", "2026-12-21"],
    ["2026-12-22", "2027-01-20"],
    ["2028-02-29", "2028-03-20"],
  ])("para %s retorna %s", (hoje, esperado) => {
    expect(proximoVencimentoDas(hoje)).toBe(esperado);
  });

  it.each(["2026-02-30", "2026-02-29", "2026-13-01", "25/11/2026", ""])(
    "rejeita a data civil inválida %j",
    (hoje) => {
      expect(() => proximoVencimentoDas(hoje)).toThrow(RangeError);
    },
  );
});
