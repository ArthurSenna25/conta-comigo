import { describe, expect, it } from "vitest";
import { corDoFio, corDoLimite, faseDoFio, opacidadeDoFio, progressoNaJanela } from "./fio-fundo";

const SIGA = { topo: 100, base: 500 };
const LIMITE = { topo: 700, base: 1100 };
const fase = (mid: number, pct = 0) => faseDoFio(mid, SIGA, LIMITE, pct);

describe("opacidade do Fio por seção (05: min(1, data-fio + 0.2))", () => {
  it("soma 0,2 e limita em 1", () => {
    expect(opacidadeDoFio("1")).toBe(1);
    expect(opacidadeDoFio("0.3")).toBeCloseTo(0.5);
    expect(opacidadeDoFio("0.25")).toBeCloseTo(0.45);
  });

  it("sem valor válido, fica cheio", () => {
    expect(opacidadeDoFio(undefined)).toBe(1);
    expect(opacidadeDoFio("abc")).toBe(1);
  });
});

describe("fase do Fio pela linha do meio da tela", () => {
  it("antes do Siga o Fio, depois dele, no limite e depois do limite", () => {
    expect(fase(50)).toEqual({ fase: "antes" });
    expect(fase(300)).toEqual({ fase: "siga", progresso: 0.5 });
    expect(fase(600)).toEqual({ fase: "entre" });
    expect(fase(900, 42)).toEqual({ fase: "limite", pct: 42 });
    expect(fase(1100)).toEqual({ fase: "depois" });
  });
});

describe("cor do Fio (05: gelo → verde → âmbar → vermelho)", () => {
  it("gelo antes e depois; verde entre as seções", () => {
    expect(corDoFio({ fase: "antes" })).toBe("rgb(172 214 250)");
    expect(corDoFio({ fase: "depois" })).toBe("rgb(172 214 250)");
    expect(corDoFio({ fase: "entre" })).toBe("rgb(112 226 172)");
  });

  it("mistura gelo → verde pelo progresso do Siga o Fio", () => {
    expect(corDoFio({ fase: "siga", progresso: 0 })).toBe("rgb(172 214 250)");
    expect(corDoFio({ fase: "siga", progresso: 1 })).toBe("rgb(112 226 172)");
    expect(corDoFio({ fase: "siga", progresso: 0.5 })).toBe("rgb(142 220 211)");
  });

  it("no limite: verde < 70, mistura 70–80, âmbar 80–100, mistura em 3 pontos até vermelho", () => {
    expect(corDoLimite(0)).toBe("rgb(112 226 172)");
    expect(corDoLimite(69.9)).toBe("rgb(112 226 172)");
    expect(corDoLimite(75)).toBe("rgb(177 209 132)");
    expect(corDoLimite(80)).toBe("rgb(242 192 92)");
    expect(corDoLimite(100)).toBe("rgb(242 192 92)");
    expect(corDoLimite(101.5)).toBe("rgb(241 150 92)");
    expect(corDoLimite(103)).toBe("rgb(240 108 92)");
    expect(corDoLimite(104)).toBe("rgb(240 108 92)");
  });

  it("alfa opcional para o halo", () => {
    expect(corDoLimite(0, 0.16)).toBe("rgb(112 226 172 / 0.16)");
  });
});

describe("progresso na janela de scroll do limite (top 85% → bottom 70%)", () => {
  it("0 antes, 1 depois, meio no meio", () => {
    const vh = 1000;
    const altura = 500;
    expect(progressoNaJanela(vh, altura, vh)).toBe(0);
    expect(progressoNaJanela(0.85 * vh, altura, vh)).toBe(0);
    expect(progressoNaJanela(0.7 * vh - altura, altura, vh)).toBe(1);
    expect(progressoNaJanela(-5000, altura, vh)).toBe(1);
    expect(progressoNaJanela(0.85 * vh - (0.15 * vh + altura) / 2, altura, vh)).toBeCloseTo(0.5);
  });
});
