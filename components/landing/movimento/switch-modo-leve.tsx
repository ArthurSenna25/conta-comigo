"use client";

import { definirModoLeve, useModoLeve } from "./preferencias";

/** Switch do rodapé. Liga o modo leve (sem movimento pesado) e lembra a escolha (localStorage). */
export function SwitchModoLeve() {
  const ligado = useModoLeve();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      data-so-js=""
      onClick={() => definirModoLeve(!ligado)}
      className="lp-switch lp-nav-link gap-3 rounded-full px-3"
    >
      <span aria-hidden="true" className="lp-switch-trilho">
        <span className="lp-switch-bola" />
      </span>
      Modo leve
    </button>
  );
}
