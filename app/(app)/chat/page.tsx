import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { exigirAcesso } from "@/actions/sessao";
import { FaixaDemo } from "@/components/demo/faixa-demo";
import { Conversa } from "./conversa";

export const metadata: Metadata = { title: "Chat · Conta Comigo" };

export default async function PaginaChat() {
  const { demo } = await exigirAcesso();

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-t1">
      <FaixaDemo demo={demo} />
      <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-1 flex-col gap-6 px-4 py-5 sm:px-8 sm:py-9">
        <header className="space-y-4 border-b border-line pb-5">
          <Link href="/painel" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-acc-ink no-underline">
            <ArrowLeft size={16} aria-hidden="true" /> Voltar ao painel
          </Link>
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-s2 text-acc-ink">
              <MessageCircle size={22} aria-hidden="true" />
            </span>
            <h1 className="num text-3xl leading-tight font-extrabold tracking-tight">Pergunte</h1>
          </div>
          <p className="text-sm text-t2">Orientação sobre seu MEI e seu painel. Para decisões fiscais, consulte um contador.</p>
        </header>
        <Conversa />
      </main>
    </div>
  );
}
