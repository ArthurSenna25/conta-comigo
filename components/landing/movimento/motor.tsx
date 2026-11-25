"use client";

import { useEffect } from "react";
import { linhaDoCta, parallax, prenderSigaOFio, revelar } from "./cenas";
import { holofote, inclinar } from "./ponteiro";
import { aplicarClasse, useEstatico } from "./preferencias";
import { ligarLenis } from "./rolagem";
import { CONSULTA_REDUZIDO } from "./script-inicial";

const CLASSES_HTML = ["mv", "mv-pronto", "mv-abertura", "mv-abrindo", "mv-estatico"];
const ABERTURA_MS = 1400;
const NAV_VIDRO_Y = 40;

const CONDICOES = {
  reduzido: CONSULTA_REDUZIDO,
  md: "(min-width: 768px)",
  preso: "(min-width: 900px) and (min-height: 720px)",
  desktop: "(min-width: 1280px)",
  mouse: "(hover: hover) and (pointer: fine)",
};

/**
 * Ilha que liga o movimento da landing sobre o HTML estático (ganchos data-movimento). Não renderiza nada.
 * Nav, barra de progresso e abertura (CSS) valem sempre; GSAP e Lenis só fora do modo estático
 * (modo leve ou reduced motion) e chegam por import() para não pesar no JS inicial.
 */
export function MotorMovimento() {
  const estatico = useEstatico();

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("mv", "mv-pronto");
    aplicarClasse();
    const pararAbertura = html.classList.contains("mv-abertura") ? abrir(html) : () => {};
    const pararRolagem = acompanharRolagem();
    return () => {
      pararAbertura();
      pararRolagem();
      html.classList.remove(...CLASSES_HTML);
    };
  }, []);

  useEffect(() => {
    if (estatico) return;
    let desmontar: (() => void) | null = null;
    let ativo = true;
    montar().then(
      (d) => (ativo ? (desmontar = d) : d()),
      (erro: unknown) => console.warn("[movimento] não montou; a landing segue estática.", erro),
    );
    return () => {
      ativo = false;
      desmontar?.();
    };
  }, [estatico]);

  return null;
}

/** Abertura curta: só decoração do herói volta do estado de `mv-abertura` por transição CSS. */
function abrir(html: HTMLElement): () => void {
  html.classList.add("mv-abrindo");
  const quadro = requestAnimationFrame(() => html.classList.remove("mv-abertura"));
  const fim = window.setTimeout(() => html.classList.remove("mv-abrindo"), ABERTURA_MS);
  return () => {
    cancelAnimationFrame(quadro);
    clearTimeout(fim);
    html.classList.remove("mv-abertura", "mv-abrindo");
  };
}

/** Nav transparente no topo que vira vidro ao rolar + barra de progresso de leitura. */
function acompanharRolagem(): () => void {
  const nav = document.querySelector<HTMLElement>('[data-movimento="nav"]');
  const barra = document.querySelector<HTMLElement>('[data-movimento="progresso"]');
  let quadro = 0;
  const atualizar = () => {
    quadro = 0;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav?.toggleAttribute("data-rolada", y > NAV_VIDRO_Y);
    barra?.style.setProperty("transform", `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`);
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
    nav?.removeAttribute("data-rolada");
    barra?.style.removeProperty("transform");
  };
}

async function montar(): Promise<() => void> {
  const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("lenis"),
  ]);
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  mm.add(CONDICOES, (ctx) => {
    const c = ctx.conditions ?? {};
    if (c.reduzido) return; // sem scrub, parallax, tilt nem abertura: tudo estático e visível
    const paradas: (() => void)[] = [];
    if (c.desktop && c.mouse) paradas.push(ligarLenis(Lenis, gsap, ScrollTrigger));
    if (c.preso) paradas.push(prenderSigaOFio(ScrollTrigger));
    revelar(gsap, c.md ? 40 : 18);
    linhaDoCta(gsap);
    if (c.desktop) parallax(gsap);
    if (c.mouse) paradas.push(inclinar(gsap), holofote());
    return () => paradas.forEach((p) => p());
  });
  try {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  } catch (erro) {
    mm.revert(); // não deixa triggers órfãos: a landing volta ao estático
    throw erro;
  }
  void document.fonts.ready.then(() => ScrollTrigger.refresh());
  return () => mm.revert();
}
