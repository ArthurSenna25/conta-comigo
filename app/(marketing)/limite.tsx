import { formatarCentavos } from "@/components/moeda";
import { barrasExemplo, TETO_EXEMPLO_CENTAVOS, TOTAL_EXEMPLO_CENTAVOS } from "@/components/landing/limite-exemplo";
import { LimiteVivo } from "@/components/landing/movimento/limite-vivo";

/**
 * "O limite". O texto e a frase para leitor de tela são do servidor; odômetro, Fio e barras são a ilha
 * LimiteVivo, que já chega desenhada no estado final (novembro) e só liga ao scroll com JS.
 */
export function Limite() {
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
        <LimiteVivo barras={barrasExemplo()} />
      </div>
    </section>
  );
}
