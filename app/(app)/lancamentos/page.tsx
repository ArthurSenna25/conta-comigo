import type { Metadata } from "next";
import Link from "next/link";
import { listar } from "@/actions/lancamentos";
import { exigirAcesso } from "@/actions/sessao";
import { BOTAO } from "@/components/botao";
import { FaixaDemo } from "@/components/demo/faixa-demo";
import { hojeBrasil } from "@/lib/contracts/comum";
import { mesSelecionado, periodoDoMes } from "@/app/(app)/lancamentos/dados";
import { ListaLancamentos } from "@/app/(app)/lancamentos/lista-lancamentos";

export const metadata: Metadata = { title: "Lançamentos · Conta Comigo" };

export default async function PaginaLancamentos({ searchParams }: PageProps<"/lancamentos">) {
  const { demo } = await exigirAcesso();
  const hoje = hojeBrasil();
  const mes = mesSelecionado((await searchParams).mes, hoje);
  const resultado = await listar(periodoDoMes(mes));

  return (
    <div className="min-h-dvh bg-bg">
      <FaixaDemo demo={demo} />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-5 py-8 sm:py-12">
        <header>
          <Link href="/painel" className={`${BOTAO.fantasma} -ml-3 mb-2 px-3`}>
            <span aria-hidden="true">←</span> Painel
          </Link>
          <h1 className="num text-[28px] font-extrabold tracking-tight">Lançamentos</h1>
          {demo && <p className="mt-1 text-sm font-semibold text-t3">Dados de exemplo</p>}
        </header>
        {resultado.ok ? (
          <ListaLancamentos mes={mes} hoje={hoje} lancamentos={resultado.dados} />
        ) : (
          <section role="alert" className="grid gap-3 rounded-2xl border border-err/50 bg-s1 p-4">
            <h2 className="font-bold text-err">Não foi possível carregar os lançamentos</h2>
            <p className="text-sm text-t2">{resultado.erro.mensagem}</p>
            <a href={`/lancamentos?mes=${mes}`} className={`${BOTAO.secundario} justify-self-start`}>
              Tentar de novo
            </a>
          </section>
        )}
      </main>
    </div>
  );
}
