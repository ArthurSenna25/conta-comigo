import { describe, expect, it } from "vitest";
import {
  CONSULTA_FIO3D,
  faixaDoTubo,
  limitarDpr,
  LIMITES_FIO3D,
  podeMontarFio3d,
  posicaoDaCamera,
  suavizar,
  trechoDesenhado,
} from "./fio3d-limites";

const TUDO = { desktop: true, alto: true, fino: true };

describe("gates de montagem do Fio 3D (05 L10: ≥1280, altura ≥600, pointer: fine, sem reduced)", () => {
  it("monta só com todas as condições juntas", () => {
    expect(podeMontarFio3d(TUDO)).toBe(true);
    expect(podeMontarFio3d({ ...TUDO, desktop: false })).toBe(false);
    expect(podeMontarFio3d({ ...TUDO, alto: false })).toBe(false);
    expect(podeMontarFio3d({ ...TUDO, fino: false })).toBe(false);
    expect(podeMontarFio3d({})).toBe(false);
  });

  it("reduced motion nunca monta, mesmo em desktop", () => {
    expect(podeMontarFio3d({ ...TUDO, reduzido: true })).toBe(false);
  });

  it("as consultas são as do handoff", () => {
    expect(CONSULTA_FIO3D).toEqual({
      desktop: "(min-width: 1280px)",
      alto: "(min-height: 600px)",
      fino: "(pointer: fine)",
    });
  });
});

describe("limites de desempenho (05 L179)", () => {
  it("1 canvas, 1400 partículas, tubo de 900 segmentos", () => {
    expect(LIMITES_FIO3D).toMatchObject({ canvas: 1, particulas: 1400, segmentosTubo: 900 });
  });

  it("DPR máximo 1.5; valor inválido vira 1", () => {
    expect(limitarDpr(3)).toBe(1.5);
    expect(limitarDpr(2)).toBe(1.5);
    expect(limitarDpr(1.25)).toBe(1.25);
    expect(limitarDpr(1)).toBe(1);
    expect(limitarDpr(0)).toBe(1);
    expect(limitarDpr(Number.NaN)).toBe(1);
  });
});

describe("matemática do tubo (fio3d.js)", () => {
  it("a câmera para em 0,86 da curva", () => {
    expect(posicaoDaCamera(0)).toBe(0);
    expect(posicaoDaCamera(1)).toBeCloseTo(0.86);
    expect(posicaoDaCamera(5)).toBe(0.86);
  });

  it("o trecho desenhado começa em 0,3 e fecha em 1", () => {
    expect(trechoDesenhado(0)).toBeCloseTo(0.3);
    expect(trechoDesenhado(1)).toBe(1);
  });

  it("suavizar anda uma fração do caminho", () => {
    expect(suavizar(0, 10, 0.08)).toBeCloseTo(0.8);
    expect(suavizar(10, 10, 0.5)).toBe(10);
  });

  it("a faixa do tubo anda de 6 em 6 índices, da câmera até a ponta", () => {
    const f = faixaDoTubo(1000, 0.5, 0.1);
    expect(f.inicio % 6).toBe(0);
    expect(f.quantidade % 6).toBe(0);
    expect(f.inicio).toBe(Math.floor((1000 * 0.13) / 6) * 6);
    expect(f.inicio + f.quantidade).toBe(Math.floor((1000 * 0.5) / 6) * 6);
  });

  it("se a ponta ainda não passou da câmera, não desenha nada (nunca negativo)", () => {
    expect(faixaDoTubo(1000, 0.05, 0.5)).toEqual({ inicio: Math.floor((1000 * 0.05) / 6) * 6, quantidade: 0 });
    expect(faixaDoTubo(1000, -1, 0).quantidade).toBeGreaterThanOrEqual(0);
  });
});
