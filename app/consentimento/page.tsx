import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { exigirAcesso } from "@/actions/sessao";
import { BotaoSair } from "@/components/auth/botao-sair";
import { FaixaDemo } from "@/components/demo/faixa-demo";
import { FormConsentimento } from "@/components/auth/form-consentimento";

export const metadata: Metadata = { title: "Consentimento · Conta Comigo" };

/**
 * Etapa de aceite. Quem está logado sem consentimento vigente (cadastro interrompido, texto novo,
 * e-mail confirmado depois) cai aqui e não usa o app até aceitar: o portão exigirAcesso() garante.
 */
export default async function PaginaConsentimento() {
  const { consentimentoVigente, demo } = await exigirAcesso("sessao");
  if (consentimentoVigente) redirect("/painel");

  return (
    <div className="flex min-h-dvh flex-col">
      <FaixaDemo demo={demo} />
      <main className="mx-auto flex w-full flex-1 max-w-sm flex-col justify-center gap-6 px-5 py-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Antes de continuar</h1>
          <p className="text-sm text-muted-foreground">
            Precisamos do seu aceite para guardar seus dados financeiros.
          </p>
        </header>
        <FormConsentimento />
        <BotaoSair />
      </main>
    </div>
  );
}
