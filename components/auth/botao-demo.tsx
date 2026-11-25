"use client";

import { entrarComoDemo } from "@/actions/auth";
import { Aviso } from "./campos";
import { useFormularioAcao } from "./use-formulario-acao";

const CLASSE_PADRAO =
  "h-12 w-full rounded-lg border border-input text-base font-medium outline-hidden focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-60";

interface BotaoDemoProps {
  /** Texto do botão; padrão "Ver demonstração". */
  rotulo?: string;
  /** Classes do botão (a landing usa o estilo de vidro). */
  className?: string;
}

/** "Ver demonstração": entra na conta de demo sem pedir e-mail nem senha (credenciais ficam no servidor). */
export function BotaoDemo({ rotulo = "Ver demonstração", className = CLASSE_PADRAO }: BotaoDemoProps) {
  const { estado, despachar, aoEnviar, pendente } = useFormularioAcao(entrarComoDemo);
  const erro = !pendente && estado && !estado.ok ? estado.erro : null;

  return (
    <form action={despachar} onSubmit={aoEnviar} aria-busy={pendente} className="flex flex-col gap-3">
      <button type="submit" aria-disabled={pendente} className={className}>
        {pendente ? "Abrindo demonstração…" : rotulo}
      </button>
      {erro && <Aviso alerta>{erro.mensagem}</Aviso>}
    </form>
  );
}
