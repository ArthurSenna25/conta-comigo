"use client";

import { useEffect, useRef, useState } from "react";
import { ContadorMoeda } from "@/components/contador-moeda";
import { posicaoNoFio, type NivelFio } from "@/components/fio-do-limite";
import {
  mesesCheios,
  nivelExemplo,
  preenchimento,
  TETO_EXEMPLO_CENTAVOS,
  totalNoProgresso,
  type BarraExemplo,
} from "@/components/landing/limite-exemplo";
import { formatarCentavos } from "@/components/moeda";
import { useEstatico } from "./preferencias";

const COR: Record<NivelFio, string> = { folga: "var(--ok)", atencao: "var(--warn)", estourou: "var(--err)" };
const STATUS: Record<NivelFio, string> = { folga: "Com folga", atencao: "Atenção", estourou: "Estourou o teto" };

function mensagem(total: number): string {
  const teto = TETO_EXEMPLO_CENTAVOS;
  return total <= teto ? `Faltam ${formatarCentavos(teto - total)}` : `Passou ${formatarCentavos(total - teto)} do teto`;
}

/**
 * Odômetro, Fio, barras e status de "O limite". O HTML do servidor já é o estado final (novembro);
 * fora do modo estático, o scroll enche as barras e o Fio (direto, sem tween) e o odômetro conta
 * mês a mês com o ContadorMoeda. O nível vem do lib/engine pelo nivelDoFio (limite-exemplo.ts).
 */
export function LimiteVivo({ barras }: { barras: readonly BarraExemplo[] }) {
  const n = barras.length;
  const estatico = useEstatico();
  const [vivo, setVivo] = useState(false);
  const [cheios, setCheios] = useState(n);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = raiz.current;
    if (estatico || !el) return;
    let ativo = true;
    let desligar = () => {};
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (!ativo) return;
      gsap.registerPlugin(ScrollTrigger);
      const desenho = ligarDesenho(el, barras);
      const aplicar = (p: number) => {
        desenho.aplicar(p);
        setCheios(mesesCheios(p, n));
      };
      const gatilho = ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        end: "bottom 70%",
        onUpdate: (s) => aplicar(s.progress),
        onRefresh: (s) => aplicar(s.progress),
      });
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      setVivo(true);
      desligar = () => {
        gatilho.kill();
        desenho.limpar();
      };
    });
    return () => {
      ativo = false;
      desligar();
      setVivo(false);
      setCheios(n);
    };
  }, [estatico, barras, n]);

  const acumulado = barras.slice(0, cheios).reduce((soma, b) => soma + b.centavos, 0);
  const nivel = nivelExemplo(acumulado);
  const cor = COR[nivel];
  const ponta = posicaoNoFio(acumulado, TETO_EXEMPLO_CENTAVOS);
  const classeNumero = "tracking-[-0.04em]";

  return (
    <div ref={raiz} className="flex flex-col gap-[clamp(12px,2.2vh,24px)]">
      <div
        aria-hidden="true"
        data-movimento="odometro"
        className="num flex items-baseline gap-[clamp(8px,1vw,16px)] text-[clamp(44px,8vw,124px)] leading-none font-extrabold tracking-[-0.04em]"
      >
        <span className="text-[0.42em] tracking-[-0.02em] text-t3">R$</span>
        {vivo ? (
          <ContadorMoeda centavos={acumulado} className={classeNumero} semSimbolo />
        ) : (
          <span className={classeNumero}>{formatarCentavos(acumulado).replace(/^R\$\s/, "")}</span>
        )}
      </div>

      <div aria-hidden="true">
        <svg viewBox="0 0 1000 40" className="block h-auto w-full overflow-visible">
          <line x1={0} y1={20} x2={909} y2={20} strokeWidth={2} strokeLinecap="round" style={{ stroke: "var(--track)" }} />
          <line x1={727} y1={8} x2={727} y2={32} strokeWidth={1.5} style={{ stroke: "var(--t3)" }} />
          <line x1={909} y1={2} x2={909} y2={38} strokeWidth={2} style={{ stroke: "var(--t2)" }} />
          <path
            data-movimento="limite-fio"
            d="M0 20 H1000"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - ponta}
            fill="none"
            strokeWidth={4}
            strokeLinecap="round"
            style={{ stroke: cor }}
          />
          <circle data-movimento="limite-bola" cx={0} cy={20} r={9} transform={`translate(${ponta * 10} 0)`} style={{ fill: cor }} />
        </svg>
        <div className="num relative mt-2 h-[22px] text-sm font-semibold text-t3">
          <span className="absolute left-0">R$ 0</span>
          <span className="absolute left-[72.7%] -translate-x-1/2">80%</span>
          <span className="absolute left-[90.9%] -translate-x-1/2 whitespace-nowrap text-t2">R$ 81 mil</span>
        </div>
      </div>

      <Barras barras={barras} />

      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-[15px] font-bold"
          style={{ color: cor, background: `color-mix(in oklch, ${cor} 16%, transparent)` }}
        >
          <span aria-hidden="true" className="size-2 rounded-full" style={{ background: cor }} />
          {STATUS[nivel]}
        </span>
        <span className="num text-[clamp(18px,1.8vw,24px)] font-bold">{mensagem(acumulado)}</span>
        <span className="text-[15px] text-t3">Faturamento mês a mês · exemplo</span>
      </div>
    </div>
  );
}

function Barras({ barras }: { barras: readonly BarraExemplo[] }) {
  const ultima = barras[barras.length - 1];
  return (
    <div
      aria-hidden="true"
      data-movimento="limite-barras"
      className="relative mt-12 grid h-[110px] grid-cols-11 gap-[clamp(4px,0.8vw,12px)] md:h-[130px] xl:h-[180px]"
    >
      {barras.map((b) => (
        <div key={b.mes} className="flex min-w-0 flex-col justify-end gap-1.5">
          <div className="relative" style={{ height: `${b.altura * 100}%` }}>
            <div
              data-movimento="limite-barra"
              className="absolute inset-0 origin-bottom rounded-[8px_8px_3px_3px] [background:linear-gradient(180deg,currentColor,color-mix(in_oklch,currentColor_22%,transparent))]"
              style={{ color: COR[b.nivel] }}
            />
            {b === ultima && (
              <span
                data-movimento="limite-etiqueta"
                className="lp-vidro num absolute right-0 bottom-[calc(100%+10px)] rounded-sm px-2.5 py-1 text-sm font-bold whitespace-nowrap"
              >
                {b.mes} · {formatarCentavos(b.centavos)}
              </span>
            )}
          </div>
          <span className="text-center text-sm font-semibold text-t3">{b.mes}</span>
        </div>
      ))}
    </div>
  );
}

/** Partes contínuas (scrub direto no DOM, só transform/opacity/stroke-dashoffset). React cuida do texto e da cor. */
function ligarDesenho(raiz: HTMLElement, barras: readonly BarraExemplo[]) {
  const colunas = Array.from(raiz.querySelectorAll<HTMLElement>('[data-movimento="limite-barra"]'));
  const fio = raiz.querySelector<SVGPathElement>('[data-movimento="limite-fio"]');
  const bola = raiz.querySelector<SVGCircleElement>('[data-movimento="limite-bola"]');
  const etiqueta = raiz.querySelector<HTMLElement>('[data-movimento="limite-etiqueta"]');
  const n = barras.length;
  return {
    aplicar(p: number) {
      colunas.forEach((c, i) => c.style.setProperty("transform", `scaleY(${preenchimento(p, i, n)})`));
      const pos = posicaoNoFio(totalNoProgresso(barras, p), TETO_EXEMPLO_CENTAVOS);
      fio?.style.setProperty("stroke-dashoffset", String(100 - pos));
      bola?.style.setProperty("transform", `translateX(${pos * 10}px)`);
      etiqueta?.style.setProperty("opacity", String(preenchimento(p, n - 1, n)));
    },
    limpar() {
      for (const c of colunas) c.style.removeProperty("transform");
      fio?.style.removeProperty("stroke-dashoffset");
      bola?.style.removeProperty("transform");
      etiqueta?.style.removeProperty("opacity");
    },
  };
}
