"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * useActionState sem o reset automático de formulário do React 19: se a action devolve erro,
 * o usuário não perde o e-mail (nem as caixas) que acabou de digitar. A action continua no servidor.
 */
export function useFormularioAcao<E>(acao: (anterior: E | null, dados: FormData) => Promise<E | null>) {
  const [estado, despachar, pendente] = useActionState(acao, null);
  const aoEnviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    startTransition(() => despachar(dados));
  };
  return { estado, aoEnviar, pendente };
}
