"use client";

import { registrarConsentimento } from "@/actions/auth";
import { CaixasConsentimento } from "./caixas-consentimento";
import { Aviso, BotaoEnviar } from "./campos";
import { useFormularioAcao } from "./use-formulario-acao";

export function FormConsentimento() {
  const { estado, aoEnviar, pendente } = useFormularioAcao(registrarConsentimento);
  const erro = estado && !estado.ok ? estado.erro : null;

  return (
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
      <CaixasConsentimento erroTermos={erro?.campos?.aceiteTermos} />
      {erro && <Aviso>{erro.mensagem}</Aviso>}
      <BotaoEnviar pendente={pendente}>Continuar</BotaoEnviar>
    </form>
  );
}
