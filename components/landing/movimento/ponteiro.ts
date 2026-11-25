import type { gsap as GsapT } from "gsap";

/** Efeitos de ponteiro: só mouse (toque e caneta ficam de fora). */
const GRAUS = 8;

/** Tilt leve nos cartões e no celular do herói (rotationX/Y, 250ms). */
export function inclinar(gsap: typeof GsapT): () => void {
  const alvos = document.querySelectorAll<HTMLElement>('[data-movimento~="tilt"]');
  const desligar = Array.from(alvos, (el) => {
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.25, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.25, ease: "power3.out" });
    gsap.set(el, { transformPerspective: 900 });
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      rx(((e.clientY - r.top) / r.height - 0.5) * -GRAUS);
      ry(((e.clientX - r.left) / r.width - 0.5) * GRAUS);
    };
    const sair = () => {
      rx(0);
      ry(0);
    };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", sair);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", sair);
    };
  });
  return () => desligar.forEach((f) => f());
}

/** Fração do desvio do cursor (a partir do centro) que o botão acompanha. Não está no handoff: ajuste fino visual. */
const FORCA_IMA = 0.3;

/** Deslocamento do ímã: cursor em (px,py), centro em (cx,cy). */
export function puxarIma(px: number, py: number, cx: number, cy: number): { x: number; y: number } {
  return { x: (px - cx) * FORCA_IMA, y: (py - cy) * FORCA_IMA };
}

/**
 * Ímã nos botões "Comece agora" (05 L147: 200ms, só transform). Usa a propriedade `translate` para compor
 * com o `scale` do :active do .lp-btn, que também é transform.
 */
export function ima(gsap: typeof GsapT): () => void {
  const alvos = Array.from(document.querySelectorAll<HTMLElement>('[data-movimento~="ima"]'));
  const desligar = alvos.map((el) => {
    const o = { x: 0, y: 0 };
    const aplicar = () => {
      el.style.translate = `${o.x}px ${o.y}px`;
    };
    const opcoes = { duration: 0.2, ease: "power3.out", onUpdate: aplicar };
    const x = gsap.quickTo(o, "x", opcoes);
    const y = gsap.quickTo(o, "y", opcoes);
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      const d = puxarIma(e.clientX, e.clientY, r.left + r.width / 2 - o.x, r.top + r.height / 2 - o.y);
      x(d.x);
      y(d.y);
    };
    const sair = () => {
      x(0);
      y(0);
    };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", sair);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", sair);
      gsap.killTweensOf(o);
      el.style.removeProperty("translate");
    };
  });
  return () => desligar.forEach((f) => f());
}

/** Spotlight: o brilho do vidro (--x/--y em .lp-vidro) segue o cursor. */
export function holofote(): () => void {
  const mover = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !(e.target instanceof Element)) return;
    const cartao = e.target.closest<HTMLElement>(".lp-vidro");
    if (!cartao) return;
    const r = cartao.getBoundingClientRect();
    cartao.style.setProperty("--x", `${e.clientX - r.left}px`);
    cartao.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  document.addEventListener("pointermove", mover, { passive: true });
  return () => {
    document.removeEventListener("pointermove", mover);
    for (const c of document.querySelectorAll<HTMLElement>(".lp-vidro")) {
      c.style.removeProperty("--x");
      c.style.removeProperty("--y");
    }
  };
}
