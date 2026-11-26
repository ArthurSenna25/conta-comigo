"use client";

import { useRef, useState } from "react";
import { BOTAO } from "@/components/botao";
import { EstadoVazio } from "@/components/estado-vazio";
import { ValorMoeda } from "@/components/valor-moeda";
import type { Lancamento } from "@/lib/contracts/lancamento";
import { CalendarioMes } from "@/app/(app)/lancamentos/calendario-mes";
import { CATEGORIAS, dataLonga, mesCurto, tituloMes } from "@/app/(app)/lancamentos/dados";
import { GerenciarLancamento } from "@/app/(app)/lancamentos/gerenciar-lancamento";

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "receita", rotulo: "Entradas" },
  { valor: "despesa", rotulo: "Saídas" },
] as const;

type Props = { mes: string; hoje: string; lancamentos: Lancamento[] };
type Selecao = { item: Lancamento; modo: "editar" | "excluir" };

export function ListaLancamentos({ mes, hoje, lancamentos }: Props) {
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["valor"]>("todos");
  const [dia, setDia] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [selecao, setSelecao] = useState<Selecao | null>(null);
  const [alteracoes, setAlteracoes] = useState<Record<string, Lancamento | null>>({});
  const [mensagem, setMensagem] = useState("");
  const titulo = useRef<HTMLHeadingElement>(null);

  const diaAtivo = dia?.startsWith(mes) ? dia : null;
  // As actions de mock não persistem. A lista reflete o retorno confirmado também durante a sessão de teste.
  const noMes = [
    ...lancamentos.filter((item) => !Object.hasOwn(alteracoes, item.id)),
    ...Object.values(alteracoes).filter((item) => item?.data.startsWith(mes)),
  ].filter((item) => item !== null).sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm));
  const totalEntradas = noMes.reduce((total, item) => total + (item.tipo === "receita" ? item.valorCentavos : 0), 0);
  const visiveis = noMes.filter((item) =>
    (filtro === "todos" || item.tipo === filtro) && (!diaAtivo || item.data === diaAtivo));

  function concluir(original: Lancamento, alterado: Lancamento | null) {
    setAlteracoes((atuais) => ({ ...atuais, [original.id]: alterado }));
    setSelecao(null);
    setMensagem(alterado
      ? `Lançamento atualizado. Data: ${dataLonga(alterado.data)}.`
      : "Lançamento excluído.");
    requestAnimationFrame(() => titulo.current?.focus({ preventScroll: true }));
  }

  return (
    <>
      <div role="group" aria-label="Tipo de lançamento" className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-s1 p-1">
        {FILTROS.map(({ valor, rotulo }) => (
          <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}
            className="min-h-11 rounded-lg px-1 text-sm font-bold text-t3 hover:bg-s2 aria-pressed:bg-s3 aria-pressed:text-t1">
            {rotulo}
          </button>
        ))}
      </div>
      <CalendarioMes key={mes} mes={mes} hoje={hoje} dia={diaAtivo} selecionarDia={setDia}
        diasComLancamento={new Set(noMes.map((item) => item.data))} />
      {diaAtivo && (
        <button type="button" onClick={() => setDia(null)}
          className={`${BOTAO.fantasma} w-fit max-w-full border border-line-strong text-left text-sm`}>
          <span>{dataLonga(diaAtivo)} · Limpar filtro</span><span aria-hidden="true">×</span>
        </button>
      )}
      <section aria-labelledby="titulo-lista" className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 ref={titulo} id="titulo-lista" tabIndex={-1} className="text-lg font-bold first-letter:uppercase">
            {tituloMes(mes)}
          </h2>
          <p className="flex items-baseline gap-2 text-sm text-t3">Entrou <ValorMoeda centavos={totalEntradas} tamanho="sm" /></p>
        </div>
        {visiveis.length > 0 ? (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-s1">
            {visiveis.map((item) => (
              <li key={item.id}>
                <button type="button" aria-expanded={aberto === item.id} aria-controls={`acoes-${item.id}`}
                  onClick={() => setAberto(aberto === item.id ? null : item.id)}
                  className="grid min-h-16 w-full grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-left hover:bg-s2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:gap-3 sm:px-4">
                  <time dateTime={item.data} className="num grid text-center text-xs font-semibold text-t3">
                    <span className="text-base leading-none font-extrabold text-t1">{item.data.slice(-2)}</span>
                    {mesCurto(item.data)}
                  </time>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{item.descricao}</span>
                    <span className="block truncate text-xs text-t3">{CATEGORIAS[item.categoria]}</span>
                  </span>
                  <ValorMoeda centavos={item.valorCentavos} sinal={item.tipo === "receita" ? "entrada" : "saida"} tamanho="sm" className="text-sm sm:text-base" />
                </button>
                <div id={`acoes-${item.id}`} hidden={aberto !== item.id}>
                  <div className="flex flex-wrap gap-2 border-t border-line bg-s2 px-3 py-2 sm:px-4">
                    <button type="button" aria-haspopup="dialog" className={BOTAO.secundario}
                      onClick={() => setSelecao({ item, modo: "editar" })}>Editar</button>
                    <button type="button" aria-haspopup="dialog" className={`${BOTAO.secundario} border-err/45 text-err`}
                      onClick={() => setSelecao({ item, modo: "excluir" })}>Excluir</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : filtro !== "todos" || diaAtivo ? (
          <EstadoVazio tipo="filtro" />
        ) : (
          <p className="rounded-2xl border border-dashed border-line-strong px-5 py-8 text-center text-[15px] text-t2">
            Nenhum lançamento neste mês.
          </p>
        )}
      </section>
      <div role="status" className={mensagem ? "rounded-xl border border-ok/40 bg-s1 px-4 py-3 text-sm text-ok" : "sr-only"}>
        {mensagem}
      </div>
      {selecao && (
        <GerenciarLancamento item={selecao.item} modo={selecao.modo} hoje={hoje}
          fechar={() => setSelecao(null)} concluir={(item) => concluir(selecao.item, item)} />
      )}
    </>
  );
}
