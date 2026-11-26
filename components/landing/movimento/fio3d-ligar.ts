import { OCIOSO_MAX_MS } from "./fio3d-limites";

/**
 * Porta de entrada do Fio 3D (05-LANDING.md L10, L13, L176). Fica no bundle inicial, mas SEM three: o
 * `import("./fio3d")` só roda em ociosidade, depois do load, e só se o motor ainda quiser o canvas.
 * Quem chama garante os gates (podeMontarFio3d); aqui só se garante que nada pesa no LCP e que nada
 * quebra a página: qualquer falha vira console.warn e a landing segue só com o Fio SVG.
 */
function aoFicarOcioso(tarefa: () => void): () => void {
  let cancelar = () => {};
  const agendar = () => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(tarefa, { timeout: OCIOSO_MAX_MS });
      cancelar = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(tarefa, 200); // Safari não tem requestIdleCallback
      cancelar = () => clearTimeout(id);
    }
  };
  if (document.readyState === "complete") {
    agendar();
    return () => cancelar();
  }
  window.addEventListener("load", agendar, { once: true });
  return () => {
    window.removeEventListener("load", agendar);
    cancelar();
  };
}

/** Devolve o cleanup: cancela o agendamento e, se já montou, chama destroy (libera renderer e listeners). */
export function ligarFio3d(): () => void {
  let ativo = true;
  let desmontar: (() => void) | null = null;
  const parar = () => {
    ativo = false;
    desmontar?.();
    desmontar = null;
  };
  const cancelarEspera = aoFicarOcioso(() => {
    import("./fio3d")
      .then(({ montarFio3d }) => {
        if (ativo) desmontar = montarFio3d(parar);
      })
      .catch((erro: unknown) => console.warn("[fio3d] indisponível; a landing segue só com o Fio SVG.", erro));
  });
  return () => {
    cancelarEspera();
    parar();
  };
}
