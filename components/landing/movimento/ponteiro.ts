import type { gsap as GsapT } from "gsap";

/** Efeitos de ponteiro: só mouse (toque e caneta ficam de fora). */
const GRAUS = 8;

/** Tilt leve nos cartões e no celular do herói (rotationX/Y, 250ms). */
export function inclinar(gsap: typeof GsapT): () => void {
  const alvos = document.querySelectorAll<HTMLElement>('[data-movimento~="tilt"], [data-movimento~="flutuar"]');
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
