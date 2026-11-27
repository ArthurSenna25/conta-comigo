import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { exigirAcesso } from "@/actions/sessao";
import { FaixaDemo } from "@/components/demo/faixa-demo";
import { Conversa, JanelaChat } from "./conversa";

export const metadata: Metadata = { title: "Chat · Conta Comigo" };

export default async function PaginaChat() {
  const { demo } = await exigirAcesso();

  return (
    <JanelaChat>
      <FaixaDemo demo={demo} />
      <main className="mx-auto flex min-h-0 w-full min-w-0 max-w-2xl flex-1 flex-col gap-3 px-4 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-6 group-data-[compacto=true]/chat:gap-2 group-data-[compacto=true]/chat:pt-1">
        <header className="shrink-0 space-y-3 border-b border-line pb-3 group-data-[compacto=true]/chat:space-y-0 group-data-[compacto=true]/chat:pb-2">
          <Link href="/painel" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-acc-ink no-underline">
            <ArrowLeft size={16} aria-hidden="true" /> Voltar ao painel
          </Link>
          {/* Teclado aberto (compacto): o título sai da vista e fica só para leitor de tela; a conversa ganha a altura. */}
          <div className="flex items-center gap-3 group-data-[compacto=true]/chat:sr-only">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-s2 text-acc-ink">
              <MessageCircle size={22} aria-hidden="true" />
            </span>
            <h1 className="num text-3xl leading-tight font-extrabold tracking-tight">Pergunte</h1>
          </div>
          <p className="text-sm text-t2 group-data-[compacto=true]/chat:hidden">Orientação sobre seu MEI e seu painel. Para decisões fiscais, consulte um contador.</p>
        </header>
        <Conversa demo={demo} />
      </main>
    </JanelaChat>
  );
}
