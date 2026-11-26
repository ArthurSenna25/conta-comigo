import type { Metadata } from "next";
import Link from "next/link";
import { exigirAcesso } from "@/actions/sessao";
import { BotaoSair } from "@/components/auth/botao-sair";
import { BOTAO } from "@/components/botao";
import { FaixaDemo } from "@/components/demo/faixa-demo";
import { hojeBrasil } from "@/lib/contracts/comum";
import { FormOnboarding } from "@/app/onboarding/form-onboarding";

export const metadata: Metadata = { title: "Seu negócio · Conta Comigo" };

export default async function PaginaOnboarding() {
  // O perfil é criado aqui. Exigir um perfil neste portão impediria o primeiro acesso.
  const { demo } = await exigirAcesso("consentimento");
  const hoje = hojeBrasil();

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-t1">
      <FaixaDemo demo={demo} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-5 py-8 sm:py-12">
        <header className="space-y-2">
          <h1 className="text-3xl leading-tight font-bold">Conte sobre o seu negócio</h1>
          <p className="text-t2">Com esses dados, o app acompanha seu faturamento e mostra o limite e o DAS do seu MEI.</p>
        </header>
        {demo ? (
          <div className="grid gap-4 rounded-2xl border border-line bg-s1 p-4 text-t2">
            <p>O perfil da conta de demonstração já está configurado.</p>
            <Link href="/painel" className={BOTAO.primario}>Ir para o painel</Link>
          </div>
        ) : (
          <FormOnboarding hoje={hoje} />
        )}
        <BotaoSair />
      </main>
    </div>
  );
}
