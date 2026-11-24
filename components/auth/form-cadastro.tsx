"use client";

import { cadastrar } from "@/actions/auth";
import { CaixasConsentimento } from "./caixas-consentimento";
import { Aviso, BotaoEnviar, Campo } from "./campos";
import { useFormularioAcao } from "./use-formulario-acao";

export function FormCadastro() {
  const { estado, despachar, aoEnviar, pendente } = useFormularioAcao(cadastrar);
  const erro = !pendente && estado && !estado.ok ? estado.erro : null;

  // Só aparece com "Confirm email" LIGADO no Supabase (então a resposta é igual para e-mail novo ou existente).
  // O foco vai para a mensagem: o formulário some e o foco cairia no <body>.
  if (estado?.ok && estado.dados.confirmarEmail) {
    return (
      <p
        role="status"
        tabIndex={-1}
        ref={(el) => el?.focus()}
        className="rounded-lg border border-border bg-muted px-3 py-3 text-sm outline-hidden"
      >
        Se o e-mail puder ser cadastrado, você receberá um link de confirmação. Depois de confirmar, entre com
        seu e-mail e senha.
      </p>
    );
  }

  return (
    <form action={despachar} onSubmit={aoEnviar} noValidate aria-busy={pendente} className="flex flex-col gap-4">
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
        autoComplete="new-password"
        minLength={8}
        required
        dica="Mínimo de 8 caracteres."
        erro={erro?.campos?.senha}
      />
      <CaixasConsentimento erroTermos={erro?.campos?.aceiteTermos} />
      {erro && <Aviso alerta={!erro.campos}>{erro.mensagem}</Aviso>}
      <BotaoEnviar pendente={pendente}>Criar conta</BotaoEnviar>
    </form>
  );
}
