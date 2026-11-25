import type { gsap as GsapT } from "gsap";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";

/** Cenas de scroll da landing (06-MOVIMENTO.md). Só transform, opacity, clip-path e stroke-dashoffset. */
type Gsap = typeof GsapT;

const todos = (seletor: string, raiz: ParentNode = document) =>
  Array.from(raiz.querySelectorAll<HTMLElement>(seletor));

/** Já na tela ao montar: fica como está (nada some depois de pintado). */
const jaNaTela = (el: Element) => el.getBoundingClientRect().top < window.innerHeight;

/** Reveals (y + opacity) e títulos por linha (clip-path), 1× quando entram na tela. */
export function revelar(gsap: Gsap, y: number): void {
  for (const el of todos('[data-movimento~="reveal"]')) {
    if (jaNaTela(el)) continue;
    gsap.from(el, {
      y,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  }
  for (const el of todos('[data-movimento~="linhas"]')) {
    if (jaNaTela(el)) continue;
    gsap.fromTo(
      el,
      { yPercent: 18, clipPath: "inset(-10% -5% 100% -5%)" },
      {
        yPercent: 0,
        clipPath: "inset(-10% -5% -10% -5%)",
        duration: 1,
        ease: "power4.out",
        clearProps: "clipPath",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      },
    );
  }
}

/** Passo do Siga o Fio pelo progresso da seção presa (0..1). */
export function passoAtual(progresso: number, total: number): number {
  return Math.max(0, Math.min(total - 1, Math.floor(progresso * total)));
}

/** Siga o Fio preso ao scroll (≥900×720): os passos se sobrepõem e o CSS troca pelo data-estado. */
export function prenderSigaOFio(ScrollTrigger: typeof ST): () => void {
  const secao = document.querySelector<HTMLElement>('[data-movimento="siga-o-fio"]');
  if (!secao) return () => {};
  const passos = todos('[data-movimento="siga-passo"]', secao);
  let atual = -1;
  const marcar = (i: number) => {
    if (i === atual) return;
    atual = i;
    passos.forEach((p, j) => {
      p.dataset.estado = j < i ? "antes" : j === i ? "ativo" : "depois";
      p.toggleAttribute("aria-hidden", j !== i);
    });
  };

  secao.classList.add("lp-siga-preso");
  marcar(0);
  const gatilho = ScrollTrigger.create({
    trigger: secao,
    start: "top top",
    end: `+=${(passos.length - 1) * 100}%`,
    pin: true,
    anticipatePin: 1,
    onUpdate: (s) => marcar(passoAtual(s.progress, passos.length)),
  });

  return () => {
    gatilho.kill();
    secao.classList.remove("lp-siga-preso");
    for (const p of passos) {
      delete p.dataset.estado;
      p.removeAttribute("aria-hidden");
    }
  };
}

/** Parallax suave dos feixes e cartões do herói: yPercent = speed × −40, scrub. */
export function parallax(gsap: Gsap): void {
  for (const el of todos('[data-movimento~="parallax"]')) {
    gsap.to(el, {
      yPercent: Number(el.dataset.speed ?? 0) * -40,
      ease: "none",
      scrollTrigger: { trigger: el.closest("section") ?? el, start: "top top", end: "bottom top", scrub: true },
    });
  }
}

/** Linha vertical do CTA final se desenha com o scroll. */
export function linhaDoCta(gsap: Gsap): void {
  const linha = document.querySelector<SVGPathElement>('[data-movimento="cta-linha"]');
  if (!linha) return;
  gsap.fromTo(
    linha,
    { strokeDashoffset: 100 },
    {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: { trigger: linha.ownerSVGElement ?? linha, start: "top 85%", end: "bottom 55%", scrub: true },
    },
  );
}
