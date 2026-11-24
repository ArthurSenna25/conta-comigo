import type { Metadata } from "next";
import { totalDeLancamentos } from "@/actions/painel";
import { exigirAcesso } from "@/actions/sessao";
import { BotaoSair } from "@/components/auth/botao-sair";
import { FaixaDemo } from "@/components/demo/faixa-demo";

export const metadata: Metadata = { title: "Painel · Conta Comigo" };

/** STUB do painel: prova o portão (sessão + consentimento + perfil) e que os dados chegam. TODO: dashboard real. */
export default async function PaginaPainel() {
  const { demo, userId } = await exigirAcesso(); // toda página protegida chama o portão: layout não re-renderiza a cada navegação
  const total = await totalDeLancamentos(userId);

  return (
    <div className="flex min-h-dvh flex-col">
      <FaixaDemo demo={demo} />
      <main className="mx-auto flex w-full flex-1 max-w-sm flex-col justify-center gap-6 px-5 py-10">
        <h1 className="text-2xl font-semibold">Painel</h1>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "lançamento carregado" : "lançamentos carregados"}. Painel em construção.
        </p>
        <BotaoSair />
      </main>
    </div>
  );
}
