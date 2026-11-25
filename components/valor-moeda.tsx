import { ContadorMoeda } from "./contador-moeda";
import { formatarCentavos } from "./moeda";

export interface ValorMoedaProps {
  centavos: number;
  sinal?: "entrada" | "saida";
  tamanho?: "sm" | "md" | "lg" | "hero";
  /** Conta de 0 até o valor (1100ms easeOutQuart). Reduced motion mostra direto. */
  contar?: boolean;
  className?: string;
}

const TAMANHO = {
  sm: "text-base font-bold",
  md: "text-lg font-bold",
  lg: "text-[28px] font-extrabold tracking-[-0.02em]",
  // 52px no máximo; encolhe pela largura do contêiner ("R$ 84.240,00" mede ~6,1× a fonte).
  hero: "text-[min(52px,15.5cqi)] leading-none font-extrabold tracking-[-0.035em]",
} as const;

/** Prefixo do sinal: entrada "+ ", saída "− " (U+2212). Com sinal, o valor é sempre absoluto. */
export function textoValor(centavos: number, sinal?: ValorMoedaProps["sinal"]): string {
  if (!sinal) return formatarCentavos(centavos);
  return `${sinal === "entrada" ? "+" : "−"} ${formatarCentavos(Math.abs(centavos))}`;
}

export function ValorMoeda({ centavos, sinal, tamanho = "md", contar = false, className = "" }: ValorMoedaProps) {
  const cor = sinal === "entrada" ? "text-ok" : "text-t1";
  const classes = `num whitespace-nowrap ${TAMANHO[tamanho]} ${cor} ${className}`;
  const valor =
    contar && !sinal ? (
      <ContadorMoeda centavos={centavos} className={classes} />
    ) : (
      <span className={classes}>{textoValor(centavos, sinal)}</span>
    );
  // O herói ocupa a linha toda para o tamanho acompanhar a largura do cartão.
  return tamanho === "hero" ? <span className="block [container-type:inline-size]">{valor}</span> : valor;
}
