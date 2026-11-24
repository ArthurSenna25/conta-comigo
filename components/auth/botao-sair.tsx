import { sair } from "@/actions/auth";

/** Server Component: o formulário chama a action direto, sem JavaScript no cliente. */
export function BotaoSair() {
  return (
    <form action={sair}>
      <button
        type="submit"
        className="h-12 w-full rounded-lg border border-input text-base font-medium outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        Sair
      </button>
    </form>
  );
}
