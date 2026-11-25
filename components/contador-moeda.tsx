"use client";

import { useEffect, useRef, useState } from "react";
import { formatarCentavos } from "./moeda";

const DURACAO_MS = 1100;
const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;
const semCifrao = (texto: string) => texto.replace(/^R\$\s/, "");

/**
 * Conta do valor anterior (0 na primeira vez) até o novo. O HTML do servidor já traz o valor final,
 * então sem JS ou com reduced motion o número aparece pronto.
 */
export function ContadorMoeda({
  centavos,
  className,
  semSimbolo = false,
}: {
  centavos: number;
  className: string;
  /** Sem o "R$ " (quem chama desenha o símbolo à parte, como o odômetro da landing). */
  semSimbolo?: boolean;
}) {
  const [exibido, setExibido] = useState(centavos);
  const anterior = useRef(0);

  useEffect(() => {
    const inicio = anterior.current;
    anterior.current = centavos;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setExibido(centavos));
      return () => cancelAnimationFrame(id);
    }
    const t0 = performance.now();
    let id = 0;
    const passo = (agora: number) => {
      const t = Math.min((agora - t0) / DURACAO_MS, 1);
      setExibido(Math.round(inicio + (centavos - inicio) * easeOutQuart(t)));
      if (t < 1) id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [centavos]);

  return (
    <span className={className}>
      {/* leitor de tela ouve só o valor final, não cada quadro */}
      <span aria-hidden="true">{semSimbolo ? semCifrao(formatarCentavos(exibido)) : formatarCentavos(exibido)}</span>
      <span className="sr-only">{formatarCentavos(centavos)}</span>
    </span>
  );
}
