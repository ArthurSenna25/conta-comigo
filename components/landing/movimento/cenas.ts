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

/**
 * Fração do trilho preenchida (0..1). O ponto i é alcançado quando o passo i começa (progresso i/total),
 * então o último ponto chega em (total−1)/total.
 */
export function preenchimentoDoTrilho(progresso: number, total: number): number {
  return Math.min(1, Math.max(0, progresso / ((total - 1) / total)));
}

/** Siga o Fio preso ao scroll (≥900×720): os passos se sobrepõem e o CSS troca pelo data-estado. */
export function prenderSigaOFio(ScrollTrigger: typeof ST): () => void {
  const secao = document.querySelector<HTMLElement>('[data-movimento="siga-o-fio"]');
  if (!secao) return () => {};
  const passos = todos('[data-movimento="siga-passo"]', secao);
  const fios = Array.from(secao.querySelectorAll<SVGElement>('[data-movimento="siga-preenchimento"]'));
  const transformsOriginais = fios.map((f) => f.style.transform);
  const preencher = (progresso: number) => {
    const escala = `scaleX(${preenchimentoDoTrilho(progresso, passos.length)})`;
    for (const f of fios) f.style.transform = escala;
  };
  let atual = -1;
  const marcar = (i: number) => {
    if (i === atual) return;
    atual = i;
    passos.forEach((p, j) => {
      p.dataset.estado = j < i ? "antes" : j === i ? "ativo" : "depois";
      if (j === i) p.removeAttribute("aria-hidden");
      else p.setAttribute("aria-hidden", "true"); // "" não esconde nada (ARIA)
    });
  };

  secao.classList.add("lp-siga-preso");
  marcar(0);
  preencher(0);
  const gatilho = ScrollTrigger.create({
    trigger: secao,
    start: "top top",
    end: `+=${(passos.length - 1) * 100}%`,
    pin: true,
    anticipatePin: 1,
    onUpdate: (s) => {
      marcar(passoAtual(s.progress, passos.length));
      preencher(s.progress);
    },
  });

  return () => {
    gatilho.kill();
    fios.forEach((f, i) => (f.style.transform = transformsOriginais[i]));
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

/** Fração do scroll do herói em que o palco termina de sair (05 L136: "até 75%"). */
const FIM_SAIDA = 0.75;

/** Saída do palco (05 L136): y 0→−90px, scale 1→.92, opacity 1→0 (×1.25). `p` = progresso 0..1 até FIM_SAIDA do herói. */
export function saidaDoPalco(p: number): { y: number; scale: number; opacity: number } {
  const t = Math.max(0, Math.min(1, p));
  return { y: -90 * t, scale: 1 - 0.08 * t, opacity: Math.max(0, 1 - t * 1.25) };
}

/** Palco do herói sai com o scroll (scrub). Nada muda no carregamento: só aplica quando o scroll anda. */
export function sairDoPalco(ScrollTrigger: typeof ST): () => void {
  const hero = document.querySelector<HTMLElement>('[data-movimento="hero"]');
  const palco = document.querySelector<HTMLElement>('[data-movimento="hero-palco"]');
  if (!hero || !palco) return () => {};
  const gatilho = ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: () => `+=${hero.offsetHeight * FIM_SAIDA}`,
    scrub: true,
    onUpdate: (s) => {
      const { y, scale, opacity } = saidaDoPalco(s.progress);
      palco.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
      palco.style.opacity = String(opacity);
    },
  });
  return () => {
    gatilho.kill();
    palco.style.removeProperty("transform");
    palco.style.removeProperty("opacity");
  };
}

/** Flutuação contínua do celular do herói (05 L138, 06 L47): y 0↔−12, 3.4s sine.inOut yoyo. */
export function flutuar(gsap: Gsap): () => void {
  const alvos = todos('[data-movimento~="flutuar"]');
  const tweens = alvos.map((el) => gsap.to(el, { y: -12, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 }));
  return () => {
    tweens.forEach((t) => t.kill());
    gsap.set(alvos, { clearProps: "transform" });
  };
}
