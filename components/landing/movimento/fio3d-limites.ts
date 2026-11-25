/**
 * Regras puras do Fio 3D (05-LANDING.md L10, L14, L157, L176-179; 06-MOVIMENTO.md token `canvas`).
 * Sem three e sem DOM: o motor importa isto de forma estática; o three só chega por import() dinâmico.
 */

/** 05 L10: só ≥1280, altura ≥600, `pointer: fine`. Mesmas chaves das condições do gsap.matchMedia do motor. */
export const CONSULTA_FIO3D = {
  desktop: "(min-width: 1280px)",
  alto: "(min-height: 600px)",
  fino: "(pointer: fine)",
} as const;

/** 05 L179: 1 canvas, DPR máx. 1.5, 1400 partículas, tubo de 900 segmentos. */
export const LIMITES_FIO3D = { dprMax: 1.5, particulas: 1400, segmentosTubo: 900, canvas: 1 } as const;

/** 06: token `canvas` (fade do canvas WebGL / SVG), em ms. */
export const FADE_CANVAS_MS = 600;

/** Espera máxima por ociosidade antes de importar o three (nunca no bundle inicial). */
export const OCIOSO_MAX_MS = 2000;

export interface CondicoesFio3d {
  reduzido?: boolean | string;
  desktop?: boolean | string;
  alto?: boolean | string;
  fino?: boolean | string;
}

/** 05 L10: todas as condições juntas; reduced motion (e modo leve, que nem chega aqui) nunca monta. */
export function podeMontarFio3d(c: CondicoesFio3d): boolean {
  return !c.reduzido && Boolean(c.desktop) && Boolean(c.alto) && Boolean(c.fino);
}

export const limitarDpr = (dpr: number): number => Math.min(dpr > 0 ? dpr : 1, LIMITES_FIO3D.dprMax);

export const suavizar = (atual: number, alvo: number, k: number): number => atual + (alvo - atual) * k;

/** Onde a câmera está na curva (fio3d.js: `min(p * 0.86, 0.86)`). */
export const posicaoDaCamera = (p: number): number => Math.min(p * 0.86, 0.86);

/** Quanto do tubo já foi desenhado (protótipo da landing: `min(1, p * 0.86 + 0.3)`). */
export const trechoDesenhado = (p: number): number => Math.min(1, p * 0.86 + 0.3);

const INDICES_POR_PASSO = 6; // fio3d.js: o drawRange anda de 6 em 6 índices

/** Faixa de índices do tubo a desenhar: do ponto logo à frente da câmera até a ponta (fio3d.js L58-61). */
export function faixaDoTubo(total: number, desenhado: number, camera: number): { inicio: number; quantidade: number } {
  const d = Math.min(1, Math.max(0.001, desenhado));
  const arredondar = (v: number) => Math.floor((total * v) / INDICES_POR_PASSO) * INDICES_POR_PASSO;
  const fim = arredondar(d);
  const inicio = arredondar(Math.min(d, camera + 0.03));
  return { inicio, quantidade: Math.max(0, fim - inicio) };
}
