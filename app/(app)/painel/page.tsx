import type { Metadata } from "next";
import { exigirAcesso } from "@/actions/sessao";
import { BotaoSair } from "@/components/auth/botao-sair";

export const metadata: Metadata = { title: "Painel · Conta Comigo" };

/** STUB do painel: só prova o portão (sessão + consentimento + perfil). O dashboard real vem depois. */
export default async function PaginaPainel() {
  await exigirAcesso(); // toda página protegida chama o portão: layout não re-renderiza a cada navegação

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <h1 className="text-2xl font-semibold">Painel</h1>
      <p className="text-sm text-muted-foreground">Em construção.</p>
      <BotaoSair />
    </main>
  );
}
