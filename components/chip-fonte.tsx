"use client";

import { useId, useRef } from "react";
import { BOTAO } from "./botao";

export interface ChipFonteProps {
  rotulo: string;
  resumo: string;
  /** Link oficial, https. */
  url: string;
  /** Data de consulta "YYYY-MM-DD" (ISO). Obrigatória. */
  consultadoEm: string;
}

/** Sem url https e data de consulta válidas o chip não aparece: texto legal só com fonte e data. */
export function fonteValida(url: string, consultadoEm: string): boolean {
  const data = /^(\d{4})-(\d{2})-(\d{2})/.exec(consultadoEm);
  if (!data || Number.isNaN(Date.parse(data[0]))) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function ChipFonte({ rotulo, resumo, url, consultadoEm }: ChipFonteProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  if (!fonteValida(url, consultadoEm)) return null;

  const [ano, mes, dia] = consultadoEm.slice(0, 10).split("-");
  const fechar = () => dialogo.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        className="inline-flex h-11 items-center gap-2 rounded-md border border-line-strong bg-s2 px-3 text-sm font-semibold text-t1 transition-transform duration-150 active:scale-97 hover:bg-s3"
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-acc" />
        {rotulo}
        <span aria-hidden="true" className="text-t3">
          ↗
        </span>
      </button>

      {/* <dialog> nativo: Esc fecha, foco preso, ::backdrop é o scrim. */}
      <dialog
        ref={dialogo}
        aria-labelledby={tituloId}
        onClick={(e) => e.target === e.currentTarget && fechar()}
        className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto w-full max-w-[560px] rounded-t-sheet border-t border-line-strong bg-s1 p-0 text-t1 backdrop:bg-[var(--scrim)]"
      >
        <div className="flex flex-col gap-3 px-5 pt-3 pb-8">
          <span aria-hidden="true" className="mx-auto mb-2 h-[5px] w-10 rounded-full bg-line-strong" />
          <span className="text-sm font-semibold tracking-[0.06em] text-t3">FONTE LEGAL</span>
          <h2 id={tituloId} className="num text-[22px] leading-tight font-extrabold tracking-[-0.01em]">
            {rotulo}
          </h2>
          <p className="text-base text-t2 text-pretty">{resumo}</p>
          <p className="text-sm text-t3">Resumo em linguagem simples. O texto oficial é o que vale.</p>
          <p className="num text-sm text-t3">
            Consultado em {dia}/{mes}/{ano}
          </p>
          <a href={url} target="_blank" rel="noopener noreferrer" className={BOTAO.primario}>
            Abrir texto oficial <span aria-hidden="true">↗</span>
          </a>
          <button type="button" onClick={fechar} className={BOTAO.secundario}>
            Fechar
          </button>
        </div>
      </dialog>
    </>
  );
}
