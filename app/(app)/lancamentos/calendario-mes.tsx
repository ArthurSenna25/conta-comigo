import Link from "next/link";
import { useState } from "react";
import { BOTAO } from "@/components/botao";
import { dataLonga, dataUtc, deslocarMes, tituloMes } from "@/app/(app)/lancamentos/dados";

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Props = {
  mes: string;
  hoje: string;
  dia: string | null;
  diasComLancamento: Set<string>;
  selecionarDia: (dia: string | null) => void;
};

export function CalendarioMes({ mes, hoje, dia, diasComLancamento, selecionarDia }: Props) {
  const [expandido, expandir] = useState(false);
  const primeiro = dataUtc(`${mes}-01`).getUTCDay();
  const ultimo = dataUtc(`${deslocarMes(mes, 1)}-01`);
  ultimo.setUTCDate(0);
  const quantidade = primeiro + ultimo.getUTCDate();
  const diaDeReferencia = dia ?? (hoje.startsWith(mes) ? hoje : `${mes}-01`);
  const semanaSelecionada = Math.floor((primeiro + Number(diaDeReferencia.slice(-2)) - 1) / 7);
  const inicio = expandido ? 0 : semanaSelecionada * 7;
  const fim = expandido ? Math.ceil(quantidade / 7) * 7 : inicio + 7;

  return (
    <section aria-label="Filtrar por data" className="grid gap-2 rounded-2xl border border-line bg-s1 p-3">
      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
        {mes > "0001-01" ? (
          <Link href={`/lancamentos?mes=${deslocarMes(mes, -1)}`} prefetch={false} aria-label="Mês anterior"
            className={`${BOTAO.fantasma} px-0`} onClick={() => selecionarDia(null)}>
            <span aria-hidden="true">‹</span>
          </Link>
        ) : <span />}
        <h2 className="text-center text-base font-bold first-letter:uppercase">{tituloMes(mes)}</h2>
        {mes < hoje.slice(0, 7) && (
          <Link href={`/lancamentos?mes=${deslocarMes(mes, 1)}`} prefetch={false} aria-label="Próximo mês"
            className={`${BOTAO.fantasma} px-0`} onClick={() => selecionarDia(null)}>
            <span aria-hidden="true">›</span>
          </Link>
        )}
      </div>
      <div id="dias-do-mes" className="grid grid-cols-7 text-center">
        {SEMANA.map((rotulo) => <span key={rotulo} className="py-1 text-xs font-semibold text-t3">{rotulo}</span>)}
        {Array.from({ length: fim - inicio }, (_, i) => {
          const numero = inicio + i - primeiro + 1;
          const data = `${mes}-${String(numero).padStart(2, "0")}`;
          if (numero < 1 || numero > ultimo.getUTCDate()) return <span key={i} aria-hidden="true" />;
          const temLancamento = diasComLancamento.has(data);
          return (
            <button key={i} type="button" disabled={data > hoje} aria-pressed={dia === data}
              aria-current={data === hoje ? "date" : undefined}
              aria-label={`${dataLonga(data)}${temLancamento ? ", com lançamentos" : ""}`}
              className="relative mx-auto h-11 w-full max-w-11 rounded-xl font-semibold hover:bg-s3 disabled:text-t3 disabled:hover:bg-transparent aria-[current=date]:ring-1 aria-[current=date]:ring-line-strong aria-pressed:bg-acc aria-pressed:text-on-acc"
              onClick={() => selecionarDia(dia === data ? null : data)}>
              {numero}
              {temLancamento && <span aria-hidden="true" className={`absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full ${dia === data ? "bg-on-acc" : "bg-acc"}`} />}
            </button>
          );
        })}
      </div>
      <button type="button" aria-expanded={expandido} aria-controls="dias-do-mes"
        onClick={() => expandir(!expandido)} className={`${BOTAO.fantasma} justify-self-center`}>
        {expandido ? "Recolher" : "Ver mês"}
      </button>
    </section>
  );
}
