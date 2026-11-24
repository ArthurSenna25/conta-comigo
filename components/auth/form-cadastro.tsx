"use client";

import { cadastrar } from "@/actions/auth";
import { CaixasConsentimento } from "./caixas-consentimento";
import { Aviso, BotaoEnviar, Campo } from "./campos";
import { useFormularioAcao } from "./use-formulario-acao";

export function FormCadastro() {
  const { estado, aoEnviar, pendente } = useFormularioAcao(cadastrar);
  const erro = estado && !estado.ok ? estado.erro : null;

  // Só aparece com "Confirm email" LIGADO no Supabase (então a resposta é igual para e-mail novo ou existente).
  if (estado?.ok && estado.dados.confirmarEmail) {
    return (
      <p role="status" className="rounded-lg border border-border bg-muted px-3 py-3 text-sm">
        Se o e-mail puder ser cadastrado, você receberá um link de confirmação. Depois de confirmar, entre com
        seu e-mail e senha.
      </p>
    );
  }

  return (
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
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
        autoComplete="new-password"
        minLength={8}
        required
        dica="Mínimo de 8 caracteres."
        erro={erro?.campos?.senha}
      />
      <CaixasConsentimento erroTermos={erro?.campos?.aceiteTermos} />
      {erro && <Aviso>{erro.mensagem}</Aviso>}
      <BotaoEnviar pendente={pendente}>Criar conta</BotaoEnviar>
    </form>
  );
}
