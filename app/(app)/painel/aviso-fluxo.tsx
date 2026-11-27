"use client";

import { useEffect } from "react";
import { useFluxo } from "@/app/(app)/fluxo-lancamento";

const DURACAO_MS = 5000;

/** Aviso simples ao voltar do /conferir (03 § Toast, sem "Desfazer" nesta etapa). Acima do FAB, some em 5 s. */
export function AvisoFluxo() {
  const [{ aviso }, despachar] = useFluxo();

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => despachar({ tipo: "avisoVisto" }), DURACAO_MS);
    return () => clearTimeout(t);
  }, [aviso, despachar]);

  return (
    <div aria-live="polite" className="fixed inset-x-4 bottom-[calc(var(--abas-h)+94px)] z-[var(--z-toast)] mx-auto max-w-[448px]">
      {aviso && (
        <div className="flex items-center gap-3 rounded-[18px] border border-line-strong bg-s3 px-4 py-3 shadow-[var(--shadow-toast)]">
          <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full text-sm font-bold ${aviso.sub ? "bg-t3 text-s3" : "bg-ok text-on-ok"}`}>
            {aviso.sub ? "·" : "✓"}
          </span>
          <p className="flex flex-col">
            <span className="text-[15px] font-bold text-t1">{aviso.titulo}</span>
            {aviso.sub && <span className="text-sm text-t2">{aviso.sub}</span>}
          </p>
        </div>
      )}
    </div>
  );
}
