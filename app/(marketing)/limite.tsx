import { formatarCentavos } from "@/components/moeda";
import { posicaoNoFio } from "@/components/fio-do-limite";
import { barrasExemplo, TETO_EXEMPLO_CENTAVOS, TOTAL_EXEMPLO_CENTAVOS, type NivelExemplo } from "./limite-exemplo";

const COR: Record<NivelExemplo, string> = { folga: "var(--ok)", atencao: "var(--warn)", estourou: "var(--err)" };
const STATUS: Record<NivelExemplo, string> = {
  folga: "Com folga",
  atencao: "Atenção · passou de 80%",
  estourou: "Estourou o teto",
};

/** Mensagem ao lado do status: "Faltam R$ X" ou "Passou R$ X do teto". */
function mensagem(total: number, teto: number): string {
  return total <= teto ? `Faltam ${formatarCentavos(teto - total)}` : `Passou ${formatarCentavos(total - teto)} do teto`;
}

/**
 * Estado final (novembro) já desenhado no HTML. A etapa de movimento liga odômetro, barras e Fio
 * ao scroll pelos ganchos data-movimento; sem JS, isto é o que se vê.
 */
export function Limite() {
  const barras = barrasExemplo();
  const ultima = barras[barras.length - 1];
  const nivel = ultima.nivel;
  const cor = COR[nivel];
  const digitos = formatarCentavos(TOTAL_EXEMPLO_CENTAVOS).replace(/^R\$\s/, "");
  const ponta = posicaoNoFio(TOTAL_EXEMPLO_CENTAVOS, TETO_EXEMPLO_CENTAVOS);
  const excesso = formatarCentavos(TOTAL_EXEMPLO_CENTAVOS - TETO_EXEMPLO_CENTAVOS);

  return (
    <section id="recursos" aria-labelledby="titulo-limite" data-fio="1" data-movimento="limite" className="lp-secao">
      <div className="lp-contido lp-sombra-texto flex flex-col gap-[clamp(12px,2.2vh,24px)]">
        <p className="lp-kicker m-0">O Fio do Limite</p>
        <h2
          id="titulo-limite"
          data-movimento="skew"
          className="num m-0 max-w-[780px] text-[clamp(28px,3.8vw,56px)] leading-[1.04] font-extrabold tracking-[-0.04em] text-balance"
        >
          O teto do MEI, desenhado em uma linha.
        </h2>
        <p className="sr-only">
          Exemplo: {formatarCentavos(TOTAL_EXEMPLO_CENTAVOS)} faturados até novembro, {excesso} acima do teto de{" "}
          {formatarCentavos(TETO_EXEMPLO_CENTAVOS)}.
        </p>

        <div
          aria-hidden="true"
          data-movimento="odometro"
          className="num flex items-baseline gap-[clamp(8px,1vw,16px)] text-[clamp(44px,8vw,124px)] leading-none font-extrabold tracking-[-0.04em]"
        >
          <span className="text-[0.42em] tracking-[-0.02em] text-t3">R$</span>
          <span>{digitos}</span>
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
              fill="none"
              strokeWidth={4}
              strokeLinecap="round"
              style={{ stroke: cor, strokeDashoffset: 100 - ponta }}
            />
            <circle cx={ponta * 10} cy={20} r={9} style={{ fill: cor }} />
          </svg>
          <div className="num relative mt-2 h-[22px] text-sm font-semibold text-t3">
            <span className="absolute left-0">R$ 0</span>
            <span className="absolute left-[72.7%] -translate-x-1/2">80%</span>
            <span className="absolute left-[90.9%] -translate-x-1/2 whitespace-nowrap text-t2">R$ 81 mil</span>
          </div>
        </div>

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
                  <span className="lp-vidro num absolute right-0 bottom-[calc(100%+10px)] rounded-sm px-2.5 py-1 text-sm font-bold whitespace-nowrap">
                    {b.mes} · {formatarCentavos(b.centavos)}
                  </span>
                )}
              </div>
              <span className="text-center text-sm font-semibold text-t3">{b.mes}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-[15px] font-bold"
            style={{ color: cor, background: `color-mix(in oklch, ${cor} 16%, transparent)` }}
          >
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: cor }} />
            {STATUS[nivel]}
          </span>
          <span className="num text-[clamp(18px,1.8vw,24px)] font-bold">
            {mensagem(TOTAL_EXEMPLO_CENTAVOS, TETO_EXEMPLO_CENTAVOS)}
          </span>
          <span className="text-[15px] text-t3">Faturamento mês a mês · exemplo</span>
        </div>
      </div>
    </section>
  );
}
