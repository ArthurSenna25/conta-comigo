"use client";

import { useEffect, useRef } from "react";
import { BOTAO } from "@/components/botao";
import { useEstatico } from "./preferencias";

const CAMPO_MS = 560;
const LENDO = "Lendo a foto… procurando valor, data e tipo";

/** Sequência do cartão "Rascunho": esvazia, varre a imagem e preenche um campo a cada 560ms. */
function criarLeitura(cartao: HTMLElement) {
  const campos = Array.from(cartao.querySelectorAll<HTMLElement>('[data-movimento~="ia-campo"]'));
  const status = cartao.querySelector<HTMLElement>('[data-movimento~="ia-status"]');
  const varredura = cartao.querySelector<HTMLElement>('[data-movimento~="ia-varredura"]');
  const pronto = status?.textContent ?? "";
  let timers: number[] = [];

  const parar = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const esvaziar = () => {
    parar();
    for (const c of campos) c.setAttribute("data-vazio", "");
    varredura?.setAttribute("data-lendo", "");
    if (status) status.textContent = LENDO;
  };
  const encher = () => {
    parar();
    for (const c of campos) c.removeAttribute("data-vazio");
    varredura?.removeAttribute("data-lendo");
    if (status) status.textContent = pronto;
  };
  const rodar = () => {
    esvaziar();
    campos.forEach((c, i) => timers.push(window.setTimeout(() => c.removeAttribute("data-vazio"), (i + 1) * CAMPO_MS)));
    timers.push(window.setTimeout(encher, (campos.length + 1) * CAMPO_MS));
  };
  return { esvaziar, encher, rodar };
}

/**
 * Botão "Ler de novo" e a leitura do cartão IA (1× quando 40% visível). Sem JS ou no modo estático
 * o cartão já aparece preenchido e o botão fica escondido pelo CSS (sem mudar o layout).
 */
export function LerDeNovo() {
  const botao = useRef<HTMLButtonElement>(null);
  const leitura = useRef<ReturnType<typeof criarLeitura> | null>(null);
  const estatico = useEstatico();

  useEffect(() => {
    const cartao = botao.current?.closest("figure");
    if (estatico || !cartao) return;
    const atual = criarLeitura(cartao);
    leitura.current = atual;
    const r = cartao.getBoundingClientRect();
    const naTela = r.top < window.innerHeight && r.bottom > 0;
    // Na tela ao montar: fica preenchido (nada some depois de pintado). Fora: espera entrar.
    const observador = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        observador.disconnect();
        atual.rodar();
      },
      { threshold: 0.4 },
    );
    if (!naTela) {
      atual.esvaziar();
      observador.observe(cartao);
    }
    return () => {
      observador.disconnect();
      atual.encher();
      leitura.current = null;
    };
  }, [estatico]);

  return (
    <button
      ref={botao}
      type="button"
      data-movimento="ler-de-novo"
      data-so-js=""
      onClick={() => leitura.current?.rodar()}
      className={`${BOTAO.secundario} h-11 self-start px-4 text-[15px]`}
    >
      Ler de novo
    </button>
  );
}
