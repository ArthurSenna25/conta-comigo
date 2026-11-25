// Classes dos botões de 03-COMPONENTES.md usados pelos estados. Só transform transiciona (06).
const BASE =
  "inline-flex h-12 min-w-11 items-center justify-center gap-2 rounded-lg px-5 text-base no-underline " +
  "transition-transform duration-150 ease-[var(--ease-cc)] active:scale-97 hover:opacity-100";

export const BOTAO = {
  primario: `${BASE} bg-acc font-bold text-on-acc hover:brightness-108 active:brightness-92`,
  secundario: `${BASE} border border-line-strong bg-s2 font-semibold text-t1 hover:bg-s3`,
  fantasma: `${BASE} bg-transparent font-semibold text-acc-ink hover:bg-[var(--acc-a10)]`,
} as const;
