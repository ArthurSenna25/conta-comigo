import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";
import type LenisT from "lenis";

/**
 * Lenis dirigido pelo gsap.ticker (lagSmoothing desligado) e avisando o ScrollTrigger a cada quadro.
 * Âncoras "#id" passam por lenis.scrollTo e o foco vai para o alvo (teclado e leitor de tela).
 */
export function ligarLenis(Lenis: typeof LenisT, gsap: typeof Gsap, ScrollTrigger: typeof ST): () => void {
  const lenis = new Lenis({ lerp: 0.1 });
  const quadro = (tempo: number) => lenis.raf(tempo * 1000);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(quadro);
  gsap.ticker.lagSmoothing(0);

  const clique = (e: MouseEvent) => {
    const alvo = alvoDaAncora(e);
    if (!alvo) return;
    e.preventDefault();
    lenis.scrollTo(alvo); // o Lenis já desconta o scroll-margin-top da seção
    history.pushState(null, "", `#${alvo.id}`);
    if (!alvo.hasAttribute("tabindex")) alvo.setAttribute("tabindex", "-1");
    alvo.focus({ preventScroll: true });
  };
  document.addEventListener("click", clique);

  return () => {
    document.removeEventListener("click", clique);
    gsap.ticker.remove(quadro);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
  };
}

function alvoDaAncora(e: MouseEvent): HTMLElement | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const link = e.target instanceof Element ? e.target.closest("a[href^='#']") : null;
  const hash = link?.getAttribute("href") ?? "";
  return hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
}
