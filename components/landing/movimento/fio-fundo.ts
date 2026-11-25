import type { gsap as GsapT } from "gsap";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";
import {
  barrasExemplo,
  LIMITE_FIM_PCT,
  LIMITE_INICIO_PCT,
  TETO_EXEMPLO_CENTAVOS,
  totalNoProgresso,
} from "@/components/landing/limite-exemplo";

/**
 * Fio de fundo em SVG (05-LANDING.md "Fallback SVG" e "Cor do Fio"; 06-MOVIMENTO.md).
 * Só stroke-dashoffset e opacity animam; a cor muda direto (06 L64: "Fio: cor instantânea").
 */
type Gsap = typeof GsapT;
type Rgb = readonly [number, number, number];
export interface Faixa {
  topo: number;
  base: number;
}
export type PosicaoFio =
  | { fase: "antes" | "entre" | "depois" }
  | { fase: "siga"; progresso: number }
  | { fase: "limite"; pct: number };

const GELO: Rgb = [172, 214, 250];
const VERDE: Rgb = [112, 226, 172];
const AMBAR: Rgb = [242, 192, 92];
const VERMELHO: Rgb = [240, 108, 92];
const OPACIDADE_MS = 0.6; // 06: token `canvas` (fade do canvas WebGL / SVG)

const limitar = (v: number) => Math.min(1, Math.max(0, v));

function misturar(a: Rgb, b: Rgb, t: number): Rgb {
  const k = limitar(t);
  const canal = (i: 0 | 1 | 2) => Math.round(a[i] + (b[i] - a[i]) * k);
  return [canal(0), canal(1), canal(2)];
}

const css = ([r, g, b]: Rgb, alfa?: number) => `rgb(${r} ${g} ${b}${alfa === undefined ? "" : ` / ${alfa}`})`;

/** Dentro de O limite (05 L23): <70 verde; 70–80 verde→âmbar; 80–100 âmbar; >100 âmbar→vermelho em 3 pontos. */
export function corDoLimite(pct: number, alfa?: number): string {
  if (pct < 70) return css(VERDE, alfa);
  if (pct < 80) return css(misturar(VERDE, AMBAR, (pct - 70) / 10), alfa);
  if (pct <= 100) return css(AMBAR, alfa);
  return css(misturar(AMBAR, VERMELHO, (pct - 100) / 3), alfa);
}

/** Cor pela posição (05 L22-24): gelo → verde pelo progresso do Siga o Fio; limite por pct; depois, gelo. */
export function corDoFio(pos: PosicaoFio, alfa?: number): string {
  switch (pos.fase) {
    case "siga":
      return css(misturar(GELO, VERDE, pos.progresso), alfa);
    case "entre":
      return css(VERDE, alfa);
    case "limite":
      return corDoLimite(pos.pct, alfa);
    default:
      return css(GELO, alfa);
  }
}

/** Fase pela linha do meio da tela (05 L19: "seção que cruza o meio da tela"). */
export function faseDoFio(meio: number, siga: Faixa, limite: Faixa, pct: number): PosicaoFio {
  if (meio < siga.topo) return { fase: "antes" };
  if (meio < siga.base) return { fase: "siga", progresso: (meio - siga.topo) / (siga.base - siga.topo) };
  if (meio < limite.topo) return { fase: "entre" };
  if (meio < limite.base) return { fase: "limite", pct };
  return { fase: "depois" };
}

/** Opacidade por seção (05 L19): o SVG usa min(1, data-fio + 0.2). */
export function opacidadeDoFio(dataFio: string | undefined): number {
  const v = Number(dataFio);
  return dataFio === undefined || Number.isNaN(v) ? 1 : Math.min(1, v + 0.2);
}

/** Mesma janela do ScrollTrigger de LimiteVivo ("top 85%" → "bottom 70%"). */
export function progressoNaJanela(topo: number, altura: number, alturaTela: number): number {
  const inicio = (LIMITE_INICIO_PCT / 100) * alturaTela;
  const fim = (LIMITE_FIM_PCT / 100) * alturaTela;
  return limitar((inicio - topo) / (inicio - (fim - altura)));
}

/** Seção presa vira o pin-spacer: o rect do spacer segue a página, o da seção fixa não. */
function faixa(el: HTMLElement): Faixa {
  const pai = el.parentElement;
  const r = (pai?.classList.contains("pin-spacer") ? pai : el).getBoundingClientRect();
  return { topo: r.top, base: r.bottom };
}

interface Fio {
  /** Cor e opacidade (leituras de layout + escritas de estilo). */
  pintar(): void;
  limpar(): void;
}

function prepararFio(escreverOpacidade: (svg: SVGSVGElement, alvo: number) => void): { svg: SVGSVGElement; nucleos: SVGPathElement[]; fio: Fio } | null {
  const svg = document.querySelector<SVGSVGElement>('[data-movimento="fio-fundo"]');
  const siga = document.querySelector<HTMLElement>('[data-movimento="siga-o-fio"]');
  const limite = document.querySelector<HTMLElement>('[data-movimento="limite"]');
  const vivo = document.querySelector<HTMLElement>('[data-movimento="limite-vivo"]');
  const [halo, nucleo] = svg ? Array.from(svg.querySelectorAll<SVGPathElement>("path")) : [];
  if (!svg || !siga || !limite || !vivo || !halo || !nucleo) return null;

  const secoes = Array.from(document.querySelectorAll<HTMLElement>("main [data-fio]"));
  const barras = barrasExemplo();
  const originais = [halo.style.stroke, nucleo.style.stroke];
  let corAtual = "";
  let alvoAtual = -1;

  const fio: Fio = {
    pintar() {
      const altura = window.innerHeight;
      const meio = altura / 2;
      const r = vivo.getBoundingClientRect();
      const total = totalNoProgresso(barras, progressoNaJanela(r.top, r.height, altura));
      const pos = faseDoFio(meio, faixa(siga), faixa(limite), (total / TETO_EXEMPLO_CENTAVOS) * 100);
      const cor = corDoFio(pos);
      if (cor !== corAtual) {
        corAtual = cor;
        halo.style.stroke = corDoFio(pos, 0.16);
        nucleo.style.stroke = cor;
      }
      const ativa = secoes.find((s) => {
        const f = faixa(s);
        return f.topo <= meio && meio < f.base;
      });
      const alvo = opacidadeDoFio(ativa?.dataset.fio);
      if (ativa && alvo !== alvoAtual) {
        alvoAtual = alvo;
        escreverOpacidade(svg, alvo);
      }
    },
    limpar() {
      halo.style.stroke = originais[0];
      nucleo.style.stroke = originais[1];
      halo.style.removeProperty("stroke-dashoffset");
      nucleo.style.removeProperty("stroke-dashoffset");
      svg.style.removeProperty("opacity");
    },
  };
  return { svg, nucleos: [halo, nucleo], fio };
}

const progressoDaPagina = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? limitar(window.scrollY / max) : 0;
};

/** Normal: ScrollTrigger scrub (progresso da página inteira → stroke-dashoffset); opacidade em 600ms. */
export function ligarFioScrub(gsap: Gsap, ScrollTrigger: typeof ST): () => void {
  void ScrollTrigger; // plugin já registrado pelo motor (matchMedia)
  const base = prepararFio((svg, alvo) => {
    gsap.to(svg, { opacity: alvo, duration: OPACIDADE_MS, ease: "power3.out", overwrite: true });
  });
  if (!base) return () => {};
  const { svg, nucleos, fio } = base;
  const tween = gsap.fromTo(
    nucleos,
    { strokeDashoffset: 100 },
    {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: 0,
        end: "max",
        scrub: true,
        onUpdate: fio.pintar,
        onRefresh: fio.pintar,
      },
    },
  );
  fio.pintar();
  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.killTweensOf(svg);
    fio.limpar();
  };
}

/** Modo leve e reduced motion (05 L160/L166): sem GSAP e sem transição; o valor ainda segue o scroll. */
export function ligarFioEstatico(): () => void {
  const base = prepararFio((svg, alvo) => svg.style.setProperty("opacity", String(alvo)));
  if (!base) return () => {};
  const { nucleos, fio } = base;
  let quadro = 0;
  const atualizar = () => {
    quadro = 0;
    const deslocamento = String(100 - progressoDaPagina() * 100);
    for (const n of nucleos) n.style.setProperty("stroke-dashoffset", deslocamento);
    fio.pintar();
  };
  const agendar = () => {
    if (!quadro) quadro = requestAnimationFrame(atualizar);
  };
  atualizar();
  window.addEventListener("scroll", agendar, { passive: true });
  window.addEventListener("resize", agendar);
  return () => {
    cancelAnimationFrame(quadro);
    window.removeEventListener("scroll", agendar);
    window.removeEventListener("resize", agendar);
    fio.limpar();
  };
}
