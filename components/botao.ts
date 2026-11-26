// Classes dos botões de 03-COMPONENTES.md usados pelos estados. Só transform transiciona (06).
// Desabilitado (disabled ou aria-disabled): sem afundar ao toque e com cor apagada, mas legível.
const BASE =
  "inline-flex h-12 min-w-11 items-center justify-center gap-2 rounded-lg px-5 text-base no-underline " +
  "transition-transform duration-150 ease-[var(--ease-cc)] active:scale-97 hover:opacity-100 " +
  "disabled:cursor-not-allowed disabled:active:scale-100 aria-disabled:cursor-not-allowed aria-disabled:active:scale-100";

export const BOTAO = {
  primario: `${BASE} bg-acc font-bold text-on-acc hover:brightness-108 active:brightness-92 disabled:bg-s3 disabled:text-t3 disabled:brightness-100`,
  secundario: `${BASE} border border-line-strong bg-s2 font-semibold text-t1 hover:bg-s3 disabled:text-t3 disabled:hover:bg-s2`,
  fantasma: `${BASE} bg-transparent font-semibold text-acc-ink hover:bg-[var(--acc-a10)] active:bg-[var(--acc-a14)] disabled:text-t3 disabled:hover:bg-transparent`,
} as const;
