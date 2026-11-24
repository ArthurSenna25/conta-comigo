"use client";

import { entrar } from "@/actions/auth";
import { Aviso, BotaoEnviar, Campo } from "./campos";
import { useFormularioAcao } from "./use-formulario-acao";

export function FormEntrar({ next }: { next: string }) {
  const { estado, despachar, aoEnviar, pendente } = useFormularioAcao(entrar);
  // Some enquanto envia: o alerta remonta no próximo erro e o leitor de tela o anuncia de novo.
  const erro = !pendente && estado && !estado.ok ? estado.erro : null;

  return (
    <form action={despachar} onSubmit={aoEnviar} noValidate aria-busy={pendente} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Campo
        id="email"
        name="email"
        rotulo="E-mail"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        required
        erro={erro?.campos?.email}
      />
      <Campo
        id="senha"
        name="senha"
        rotulo="Senha"
        type="password"
        autoComplete="current-password"
        required
        erro={erro?.campos?.senha}
      />
      {erro && <Aviso alerta={!erro.campos}>{erro.mensagem}</Aviso>}
      <BotaoEnviar pendente={pendente}>Entrar</BotaoEnviar>
    </form>
  );
}
