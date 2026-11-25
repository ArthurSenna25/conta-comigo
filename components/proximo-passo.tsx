import Link from "next/link";

/** Cor do cartão. Qual passo mostrar (as 5 regras de 03) é decisão da tela, não deste componente. */
export type TomProximoPasso = "acento" | "ok" | "atencao" | "estourou";

export interface ProximoPassoProps {
  tom: TomProximoPasso;
  /** Selo de 36px: "+", "!", "20", "2"… */
  selo: string;
  titulo: string;
  subtitulo: string;
  /** Navega com <Link>; sem href vira <button> com onClick (ex.: abrir o sheet do DAS). */
  href?: string;
  onClick?: () => void;
}

const COR: Record<Exclude<TomProximoPasso, "acento">, string> = {
  ok: "var(--ok)",
  atencao: "var(--warn)",
  estourou: "var(--err)",
};

export function ProximoPasso({ tom, selo, titulo, subtitulo, href, onClick }: ProximoPassoProps) {
  const cor = tom === "acento" ? "var(--acc)" : COR[tom];
  const estilo =
    tom === "acento"
      ? { background: "var(--acc-a10)", borderColor: "var(--acc-a40)" }
      : {
          background: `color-mix(in oklch, ${cor} 11%, var(--s1))`,
          borderColor: `color-mix(in oklch, ${cor} 45%, transparent)`,
        };
  const classes =
    "flex min-h-[72px] w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left text-t1 no-underline " +
    "transition-transform duration-150 ease-[var(--ease-cc)] active:scale-97 hover:opacity-100";

  const conteudo = (
    <>
      <span
        aria-hidden="true"
        className="num grid size-9 shrink-0 place-items-center rounded-md text-base font-extrabold text-on-acc"
        style={{ background: cor }}
      >
        {selo}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold text-t3">Próximo passo</span>
        <span className="text-base font-bold text-pretty">{titulo}</span>
        <span className="text-sm text-t2 text-pretty">{subtitulo}</span>
      </span>
      <span aria-hidden="true" className="text-[22px] text-t3">
        ›
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} style={estilo}>
        {conteudo}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes} style={estilo}>
      {conteudo}
    </button>
  );
}
