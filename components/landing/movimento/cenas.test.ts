import { describe, expect, it } from "vitest";
import { passoAtual, preenchimentoDoTrilho, saidaDoPalco } from "./cenas";

describe("passo do Siga o Fio", () => {
  it("divide o progresso em 4 passos e não passa do último", () => {
    expect([0, 0.24, 0.25, 0.5, 0.74, 0.75, 0.99, 1].map((p) => passoAtual(p, 4))).toEqual([0, 0, 1, 2, 2, 3, 3, 3]);
  });

  it("aguenta progresso fora de 0..1", () => {
    expect(passoAtual(-0.2, 4)).toBe(0);
    expect(passoAtual(1.4, 4)).toBe(3);
  });
});

describe("preenchimento do trilho do Siga o Fio", () => {
  it("chega a cada ponto quando o passo começa e trava no último", () => {
    expect([0, 0.25, 0.5, 0.75, 1].map((p) => preenchimentoDoTrilho(p, 4))).toEqual([0, 1 / 3, 2 / 3, 1, 1]);
  });

  it("aguenta progresso fora de 0..1", () => {
    expect(preenchimentoDoTrilho(-1, 4)).toBe(0);
    expect(preenchimentoDoTrilho(2, 4)).toBe(1);
  });
});

describe("saída do palco do herói", () => {
  it("começa parado, termina em y −90 e scale .92, e some antes do fim", () => {
    expect(saidaDoPalco(0)).toMatchObject({ scale: 1, opacity: 1 });
    const fim = saidaDoPalco(1);
    expect(fim.y).toBe(-90);
    expect(fim.scale).toBeCloseTo(0.92);
    expect(fim.opacity).toBe(0);
    expect(saidaDoPalco(0.4).opacity).toBeCloseTo(0.5);
  });

  it("aguenta progresso fora de 0..1", () => {
    expect(saidaDoPalco(-1).scale).toBe(1);
    expect(saidaDoPalco(3).y).toBe(-90);
  });
});
