"use client";

import { registrarConsentimento } from "@/actions/auth";
import { CaixasConsentimento } from "./caixas-consentimento";
import { Aviso, BotaoEnviar } from "./campos";
import { useFormularioAcao } from "./use-formulario-acao";

export function FormConsentimento() {
  const { estado, despachar, aoEnviar, pendente } = useFormularioAcao(registrarConsentimento);
  const erro = !pendente && estado && !estado.ok ? estado.erro : null;

  return (
    <form action={despachar} onSubmit={aoEnviar} noValidate aria-busy={pendente} className="flex flex-col gap-4">
      <CaixasConsentimento erros={erro?.campos} />
      {erro && <Aviso alerta={!erro.campos}>{erro.mensagem}</Aviso>}
      <BotaoEnviar pendente={pendente}>Continuar</BotaoEnviar>
    </form>
  );
}
