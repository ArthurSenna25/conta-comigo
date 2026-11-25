"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BOTAO } from "./botao";

export type EstadoErroProps =
  | {
      tipo: "503";
      /** Rota do preenchimento manual (ex.: /conferir?modo=manual). */
      hrefManual: string;
      onTentarDeNovo: () => void;
      /** Garantia mostrada na caixa ✓. Depende do que o usuário mandou. */
      garantia?: string;
    }
  | { tipo: "429"; hrefManual: string; hrefPainel?: string };

const TEXTO = {
  "503": {
    codigo: "IA fora do ar · 503",
    titulo: "A IA não respondeu agora",
    corpo:
      "Pode ser instabilidade do serviço. Você não perde nada: preencha na mão ou tente de novo em alguns minutos.",
  },
  "429": {
    codigo: "Limite diário da IA · 429",
    titulo: "Você usou todas as leituras de hoje",
    // "volta à meia-noite" está PENDENTE (07, #11): sem horário até a regra real ser confirmada.
    corpo: "O limite de leituras é diário. Enquanto isso, o app segue funcionando com preenchimento manual.",
  },
} as const;

/** Tela cheia de falha da IA em /adicionar. O foco vai para o título ao montar. */
export function EstadoErro(props: EstadoErroProps) {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => titulo.current?.focus({ preventScroll: true }), []);

  const { codigo, titulo: textoTitulo, corpo } = TEXTO[props.tipo];
  const garantia =
    props.tipo === "503"
      ? (props.garantia ?? "Sua foto ficou guardada neste aparelho")
      : "Limite e DAS continuam sendo calculados normalmente";

  return (
    <section role="alert" className="flex flex-col gap-5">
      <FioFalhou />
      <p className="num text-sm font-semibold text-warn">{codigo}</p>
      <h2
        ref={titulo}
        tabIndex={-1}
        className="num text-[30px] leading-[1.1] font-extrabold tracking-[-0.02em] text-balance focus:outline-none"
      >
        {textoTitulo}
      </h2>
      <p className="text-base text-t2 text-pretty">{corpo}</p>
      <p className="flex items-center gap-3 rounded-xl border border-line bg-s1 px-4 py-3 text-[15px] text-t1">
        <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-ok text-sm font-bold text-on-ok">
          ✓
        </span>
        {garantia}
      </p>
      <div className="flex flex-col gap-3">
        <Link href={props.hrefManual} className={BOTAO.primario}>
          Preencher manualmente
        </Link>
        {props.tipo === "503" ? (
          <button type="button" onClick={props.onTentarDeNovo} className={BOTAO.secundario}>
            Tentar de novo
          </button>
        ) : (
          <Link href={props.hrefPainel ?? "/painel"} className={BOTAO.secundario}>
            Voltar ao painel
          </Link>
        )}
      </div>
    </section>
  );
}

/** Fio âmbar interrompido (svg/fio-ia-falhou.svg). */
function FioFalhou() {
  return (
    <svg aria-hidden="true" viewBox="0 0 320 28" className="block h-auto w-full max-w-80">
      <line x1={0} y1={14} x2={320} y2={14} strokeWidth={2} strokeLinecap="round" style={{ stroke: "var(--track)", strokeDasharray: "3 7" }} />
      <line x1={0} y1={14} x2={120} y2={14} strokeWidth={3} strokeLinecap="round" style={{ stroke: "var(--warn)" }} />
      <circle cx={120} cy={14} r={6} style={{ fill: "var(--warn)" }} />
    </svg>
  );
}
