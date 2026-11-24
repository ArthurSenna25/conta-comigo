"use client";

import { entrar } from "@/actions/auth";
import { Aviso, BotaoEnviar, Campo } from "./campos";
import { useFormularioAcao } from "./use-formulario-acao";

export function FormEntrar({ next }: { next: string }) {
  const { estado, aoEnviar, pendente } = useFormularioAcao(entrar);
  const erro = estado && !estado.ok ? estado.erro : null;

  return (
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Campo
        id="email"
        name="email"
        rotulo="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
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
      {erro && <Aviso>{erro.mensagem}</Aviso>}
      <BotaoEnviar pendente={pendente}>Entrar</BotaoEnviar>
    </form>
  );
}
