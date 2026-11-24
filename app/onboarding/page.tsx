import type { Metadata } from "next";
import { exigirAcesso } from "@/actions/sessao";
import { BotaoSair } from "@/components/auth/botao-sair";
import { FaixaDemo } from "@/components/demo/faixa-demo";

export const metadata: Metadata = { title: "Seu negócio · Conta Comigo" };

/**
 * STUB (conteúdo do Frigeri): formulário de perfil contra `PerfilInput`.
 * Fica FORA de app/(app) de propósito: o portão do app exige perfil e mandaria para cá em laço.
 * Esta página só exige login + consentimento (`exigirAcesso("consentimento")`).
 */
export default async function PaginaOnboarding() {
  const { demo } = await exigirAcesso("consentimento");

  return (
    <div className="flex min-h-dvh flex-col">
      <FaixaDemo demo={demo} />
      <main className="mx-auto flex w-full flex-1 max-w-sm flex-col justify-center gap-6 px-5 py-10">
        <h1 className="text-2xl font-semibold">Conte sobre o seu negócio</h1>
        <p className="text-sm text-muted-foreground">Onboarding em construção.</p>
        <BotaoSair />
      </main>
    </div>
  );
}
