import type { CSSProperties } from "react";
import { formatarCentavos, formatarCompacto } from "./moeda";

/**
 * Nível do Fio. Quem decide é o lib/engine (limiar único); o componente só desenha.
 * Mapear a FaixaLimite do contrato para este nível é papel da tela.
 */
export type NivelFio = "folga" | "atencao" | "estourou";
export type VarianteFio = "hero" | "compacto" | "onboarding" | "mini";

export interface FioDoLimiteProps {
  nivel: NivelFio;
  faturadoCentavos: number;
  limiteCentavos: number;
  variante?: VarianteFio;
  /** Sem nenhum lançamento: "Começando", trilho tracejado. */
  vazio?: boolean;
  /** Entrada animada (stroke-dashoffset). Reduced motion desliga pelo CSS global. */
  animar?: boolean;
  className?: string;
}

/** O desenho vai até 110% do teto: o teto fica a 90,9% e a marca de 80% a 72,7%. */
const ESCALA = 1.1;

const VISUAL: Record<NivelFio | "vazio", { cor: string; rotulo: string }> = {
  folga: { cor: "var(--ok)", rotulo: "Com folga" },
  atencao: { cor: "var(--warn)", rotulo: "Atenção" },
  estourou: { cor: "var(--err)", rotulo: "Estourou" },
  vazio: { cor: "var(--ok)", rotulo: "Começando" },
};

const GEOMETRIA: Record<VarianteFio, { w: number; h: number; traco: number; bola: number }> = {
  hero: { w: 320, h: 28, traco: 3, bola: 5.5 },
  compacto: { w: 320, h: 28, traco: 5, bola: 7 },
  onboarding: { w: 320, h: 28, traco: 4, bola: 6 },
  mini: { w: 44, h: 12, traco: 2, bola: 3 },
};

/** Posição da ponta no desenho, de 0 a 100. */
export function posicaoNoFio(faturadoCentavos: number, limiteCentavos: number): number {
  if (limiteCentavos <= 0) return 0;
  const fracao = Math.max(0, faturadoCentavos / limiteCentavos);
  return (Math.min(fracao, ESCALA) / ESCALA) * 100;
}

/** "Faltam R$ X" ou "Passou R$ X", só pelos centavos. */
export function textoDistancia(faturadoCentavos: number, limiteCentavos: number): string {
  const diferenca = limiteCentavos - faturadoCentavos;
  return diferenca >= 0 ? `Faltam ${formatarCentavos(diferenca)}` : `Passou ${formatarCentavos(-diferenca)}`;
}

function percentual(faturadoCentavos: number, limiteCentavos: number): number {
  return limiteCentavos > 0 ? Math.floor((faturadoCentavos / limiteCentavos) * 100) : 0;
}

export function FioDoLimite({
  nivel,
  faturadoCentavos,
  limiteCentavos,
  variante = "hero",
  vazio = false,
  animar = true,
  className = "",
}: FioDoLimiteProps) {
  const { cor, rotulo } = VISUAL[vazio ? "vazio" : nivel];
  const pct = percentual(faturadoCentavos, limiteCentavos);
  const distancia = textoDistancia(faturadoCentavos, limiteCentavos);
  const meter = {
    role: "meter",
    "aria-label": "Limite anual do MEI",
    "aria-valuemin": 0,
    "aria-valuemax": limiteCentavos,
    "aria-valuenow": Math.min(faturadoCentavos, limiteCentavos),
    "aria-valuetext": `${formatarCentavos(faturadoCentavos)} de ${formatarCentavos(limiteCentavos)}, ${pct}%, ${rotulo.toLowerCase()}`,
  } as const;

  const desenho = (
    <Desenho
      variante={variante}
      posicao={vazio ? 0 : posicaoNoFio(faturadoCentavos, limiteCentavos)}
      cor={cor}
      vazio={vazio}
      animar={animar}
    />
  );

  if (variante === "mini") {
    return (
      <span {...meter} className={`inline-flex items-center gap-2 ${className}`}>
        <span className="w-11 shrink-0">{desenho}</span>
        <span className="num text-sm font-bold text-t1">{distancia}</span>
      </span>
    );
  }

  return (
    <div {...meter} className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusPill cor={cor} rotulo={rotulo} />
        <span className="num text-base font-bold text-t1">{distancia}</span>
      </div>
      {desenho}
      <Legenda limiteCentavos={limiteCentavos} />
    </div>
  );
}

function StatusPill({ cor, rotulo }: { cor: string; rotulo: string }) {
  return (
    <span
      className="inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm font-bold"
      style={{ color: cor, background: `color-mix(in oklch, ${cor} 16%, transparent)` }}
    >
      <span aria-hidden="true" className="size-2 rounded-full" style={{ background: cor }} />
      {rotulo}
    </span>
  );
}

function Legenda({ limiteCentavos }: { limiteCentavos: number }) {
  const marca = (left: string, texto: string) => (
    <span className="absolute -translate-x-1/2" style={{ left }}>
      {texto}
    </span>
  );
  return (
    <div aria-hidden="true" className="num relative h-5 text-sm font-medium text-t3">
      <span className="absolute left-0">R$ 0</span>
      {marca(`${(0.8 / ESCALA) * 100}%`, "80%")}
      {marca(`${(1 / ESCALA) * 100}%`, formatarCompacto(limiteCentavos))}
    </div>
  );
}

interface DesenhoProps {
  variante: VarianteFio;
  posicao: number;
  cor: string;
  vazio: boolean;
  animar: boolean;
}

function Desenho({ variante, posicao, cor, vazio, animar }: DesenhoProps) {
  const { w, h, traco, bola } = GEOMETRIA[variante];
  const y = h / 2;
  const teto = w / ESCALA;
  const oitenta = (w * 0.8) / ESCALA;
  const comMarcas = variante !== "mini";
  // Onboarding acompanha a digitação (400ms); as outras entram uma vez (1100ms). Cor nunca transiciona.
  const movimento = (keyframes: string): CSSProperties =>
    variante === "onboarding"
      ? { transition: "stroke-dashoffset 400ms var(--ease-cc), transform 400ms var(--ease-cc)" }
      : animar
        ? { animation: `${keyframes} var(--dur-fio) var(--ease-cc) both` }
        : {};

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${w} ${h}`}
      overflow="visible"
      className="block h-auto w-full"
    >
      <line
        x1={0}
        y1={y}
        x2={comMarcas ? teto : w}
        y2={y}
        strokeWidth={2}
        strokeLinecap="round"
        style={{ stroke: "var(--track)", ...(vazio ? { strokeDasharray: "2 6" } : {}) }}
      />
      {comMarcas && (
        <>
          <line x1={oitenta} y1={6} x2={oitenta} y2={22} strokeWidth={1} style={{ stroke: "var(--t3)" }} />
          <line x1={teto} y1={2} x2={teto} y2={26} strokeWidth={1.5} style={{ stroke: "var(--t2)" }} />
        </>
      )}
      {!vazio && (
        <path
          d={`M0 ${y} H${w}`}
          pathLength={100}
          fill="none"
          strokeWidth={traco}
          strokeLinecap="round"
          strokeDasharray="100"
          style={{
            stroke: cor,
            strokeDashoffset: 100 - posicao,
            filter: `drop-shadow(0 0 6px ${cor})`,
            ...movimento("cc-fio-traco"),
          }}
        />
      )}
      <circle
        cx={0}
        cy={y}
        r={bola}
        style={{
          fill: cor,
          transform: `translateX(${(posicao / 100) * w}px)`,
          filter: `drop-shadow(0 0 9px ${cor})`,
          ...movimento("cc-fio-bola"),
        }}
      />
    </svg>
  );
}
