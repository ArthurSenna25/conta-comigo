import type { InputHTMLAttributes } from "react";

type CampoProps = InputHTMLAttributes<HTMLInputElement> & { id: string; rotulo: string; erro?: string; dica?: string };

/** Campo de texto: rótulo visível, 16px (sem zoom no iOS), alvo de 48px, erro anunciado ao leitor de tela. */
export function Campo({ id, rotulo, erro, dica, ...entrada }: CampoProps) {
  const descricoes = [dica ? `${id}-dica` : null, erro ? `${id}-erro` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricoes}
        className="h-12 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive"
        {...entrada}
      />
      {dica && (
        <p id={`${id}-dica`} className="text-sm text-muted-foreground">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Mensagem geral do formulário (erro que não é de um campo). */
export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {children}
    </p>
  );
}

export function BotaoEnviar({ pendente, children }: { pendente: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pendente}
      className="h-12 rounded-lg bg-primary text-base font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
    >
      {pendente ? "Aguarde…" : children}
    </button>
  );
}
