"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const carregar = () => import("./dialogo-experimente");
const DialogoExperimente = dynamic(() => carregar().then((m) => m.DialogoExperimente), { ssr: false });

/**
 * Único ponto de entrada da simulação na landing. O diálogo (e o CSS dele) só é baixado na intenção de uso
 * (hover, foco ou clique), então a landing fechada não carrega nada a mais. Ao fechar, o foco volta aqui.
 */
export function BotaoExperimente() {
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const jaAbriu = useRef(false);

  useEffect(() => {
    if (aberto) jaAbriu.current = true;
    else if (jaAbriu.current) botao.current?.focus(); // depois do cleanup do diálogo tirar o `inert`
  }, [aberto]);

  return (
    <>
      <button
        ref={botao}
        type="button"
        data-so-js=""
        aria-haspopup="dialog"
        onPointerEnter={() => void carregar()}
        onFocus={() => void carregar()}
        onClick={() => setAberto(true)}
        className="lp-btn lp-btn-vidro"
      >
        Experimente sem cadastro
      </button>
      {aberto && <DialogoExperimente aoFechar={() => setAberto(false)} />}
    </>
  );
}
