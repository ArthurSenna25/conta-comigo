import { useSyncExternalStore } from "react";
import { CHAVE_LEVE, CONSULTA_REDUZIDO } from "./script-inicial";

/**
 * Modo leve (localStorage) + prefers-reduced-motion. "Estático" = um dos dois: sem GSAP, sem Lenis,
 * tudo visível. Só módulos client importam este arquivo.
 */
type Armazem = Pick<Storage, "getItem" | "setItem">;

/** localStorage pode lançar (Safari privado, cookies bloqueados): nunca quebra, cai em "desligado". */
export function lerLeve(armazem: () => Armazem): boolean {
  try {
    return armazem().getItem(CHAVE_LEVE) === "1";
  } catch {
    return false;
  }
}

/** Devolve se gravou. Se não gravou, a escolha vale só nesta visita (fica em memória). */
export function gravarLeve(armazem: () => Armazem, ligado: boolean): boolean {
  try {
    armazem().setItem(CHAVE_LEVE, ligado ? "1" : "0");
    return true;
  } catch {
    return false;
  }
}

const EVENTO = "cc:modo-leve";
const local = () => window.localStorage;
let leve: boolean | null = null;

function modoLeve(): boolean {
  if (leve === null) leve = lerLeve(local);
  return leve;
}

function estatico(): boolean {
  return modoLeve() || window.matchMedia(CONSULTA_REDUZIDO).matches;
}

/** `mv-estatico` no <html>: o CSS desliga a borda girando e o "Ler de novo". */
export function aplicarClasse() {
  document.documentElement.classList.toggle("mv-estatico", estatico());
}

export function definirModoLeve(ligado: boolean) {
  leve = ligado;
  gravarLeve(local, ligado);
  aplicarClasse();
  window.dispatchEvent(new Event(EVENTO));
}

function assinar(avisar: () => void) {
  const consulta = window.matchMedia(CONSULTA_REDUZIDO);
  const mudou = () => {
    aplicarClasse();
    avisar();
  };
  consulta.addEventListener("change", mudou);
  window.addEventListener(EVENTO, avisar);
  return () => {
    consulta.removeEventListener("change", mudou);
    window.removeEventListener(EVENTO, avisar);
  };
}

/** Estado do switch (reduced motion não liga o switch, só o comportamento). */
export function useModoLeve(): boolean {
  return useSyncExternalStore(assinar, modoLeve, () => false);
}

/** No servidor e na hidratação vale "estático": nada é montado antes de saber a preferência. */
export function useEstatico(): boolean {
  return useSyncExternalStore(assinar, estatico, () => true);
}
