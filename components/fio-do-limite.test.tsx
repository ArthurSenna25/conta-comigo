import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FioDoLimite, posicaoNoFio, textoDistancia } from "./fio-do-limite";
import { formatarCentavos, formatarCompacto } from "./moeda";

const LIMITE = 8_100_000;
const NBSP = " ";

describe("formatarCentavos", () => {
  it("formata centavos inteiros em BRL", () => {
    expect(formatarCentavos(3_402_000)).toBe(`R$${NBSP}34.020,00`);
    expect(formatarCentavos(123_456)).toBe(`R$${NBSP}1.234,56`);
    expect(formatarCentavos(5)).toBe(`R$${NBSP}0,05`);
    expect(formatarCentavos(0)).toBe(`R$${NBSP}0,00`);
  });

  it("formata a legenda compacta", () => {
    expect(formatarCompacto(LIMITE)).toBe(`81${NBSP}mil`);
  });
});

describe("posicaoNoFio (escala de 110%)", () => {
  it("põe o teto a 90,9% e 80% a 72,7% do desenho", () => {
    expect(posicaoNoFio(LIMITE, LIMITE)).toBeCloseTo(90.909, 2);
    expect(posicaoNoFio(6_480_000, LIMITE)).toBeCloseTo(72.727, 2);
    expect(posicaoNoFio(0, LIMITE)).toBe(0);
  });

  it("para no fim a partir de 110% do teto", () => {
    expect(posicaoNoFio(8_910_000, LIMITE)).toBe(100);
    expect(posicaoNoFio(20_000_000, LIMITE)).toBe(100);
  });

  it("não quebra com limite zero", () => {
    expect(posicaoNoFio(100, 0)).toBe(0);
  });
});

describe("textoDistancia", () => {
  it("diz quanto falta ou quanto passou, pelos centavos", () => {
    expect(textoDistancia(3_402_000, LIMITE)).toBe(`Faltam R$${NBSP}46.980,00`);
    expect(textoDistancia(LIMITE, LIMITE)).toBe(`Faltam R$${NBSP}0,00`);
    expect(textoDistancia(8_424_000, LIMITE)).toBe(`Passou R$${NBSP}3.240,00`);
  });
});

describe("<FioDoLimite>", () => {
  const html = (props: Partial<Parameters<typeof FioDoLimite>[0]> = {}) =>
    renderToStaticMarkup(
      <FioDoLimite nivel="folga" faturadoCentavos={3_402_000} limiteCentavos={LIMITE} {...props} />,
    );

  it.each([
    ["folga", "Com folga", "var(--ok)"],
    ["atencao", "Atenção", "var(--warn)"],
    ["estourou", "Estourou", "var(--err)"],
  ] as const)("nível %s: cor e rótulo vêm da prop", (nivel, rotulo, cor) => {
    const saida = html({ nivel });
    expect(saida).toContain(rotulo);
    expect(saida).toContain(cor);
  });

  it("não decide limiar: 99% com nível folga continua folga", () => {
    const saida = html({ nivel: "folga", faturadoCentavos: 8_019_000 });
    expect(saida).toContain("Com folga");
    expect(saida).not.toContain("Atenção");
  });

  it("sempre mostra o texto junto da cor", () => {
    expect(html()).toContain(`Faltam R$${NBSP}46.980,00`);
    expect(html({ nivel: "estourou", faturadoCentavos: 8_424_000 })).toContain(`Passou R$${NBSP}3.240,00`);
    expect(html({ variante: "mini" })).toContain(`Faltam R$${NBSP}46.980,00`);
  });

  it("expõe meter acessível com texto completo e esconde o SVG", () => {
    const saida = html();
    expect(saida).toContain('role="meter"');
    expect(saida).toContain(`aria-valuetext="R$${NBSP}34.020,00 de R$${NBSP}81.000,00, 42%, com folga"`);
    expect(saida).toContain(`aria-valuemax="${LIMITE}"`);
    expect(saida).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it("mantém aria-valuenow dentro do máximo quando estoura", () => {
    const saida = html({ nivel: "estourou", faturadoCentavos: 8_424_000 });
    expect(saida).toContain(`aria-valuenow="${LIMITE}"`);
    expect(saida).toContain("104%, estourou");
  });

  it("estado vazio: Começando e trilho tracejado", () => {
    const saida = html({ vazio: true, faturadoCentavos: 0 });
    expect(saida).toContain("Começando");
    expect(saida).toContain("stroke-dasharray:2 6");
  });
});
