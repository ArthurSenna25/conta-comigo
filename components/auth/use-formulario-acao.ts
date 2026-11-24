"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * Formulário ligado a uma Server Action, com DUAS portas de envio:
 *  - `action={despachar}`: antes da hidratação (3G lento) o navegador faz um POST de verdade, via
 *    progressive enhancement do React. Sem isto o formulário seria um GET e e-mail e senha iriam
 *    na URL (histórico, logs, Referer).
 *  - `onSubmit={aoEnviar}`: depois da hidratação intercepta o envio e despacha dentro de uma transição,
 *    o que evita o reset automático do formulário do React 19 (o usuário não perde o e-mail no erro).
 */
export function useFormularioAcao<E>(acao: (anterior: E | null, dados: FormData) => Promise<E | null>) {
  const [estado, despachar, pendente] = useActionState(acao, null);
  const aoEnviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (pendente) return; // o botão usa aria-disabled (mantém o foco), então o clique ainda chega aqui
    const dados = new FormData(evento.currentTarget);
    startTransition(() => despachar(dados));
  };
  return { estado, despachar, aoEnviar, pendente };
}
