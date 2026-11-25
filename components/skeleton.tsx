const ATRASO = ["0s", ".15s", ".3s", ".45s"] as const;

/** Bloco de carregamento: fundo --s3 pulsando 1.4s. `ordem` escalona o atraso (0 a 3). */
export function Skeleton({ className = "", ordem = 0 }: { className?: string; ordem?: 0 | 1 | 2 | 3 }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-md bg-s3 ${className}`}
      style={{ animation: `cc-pulse 1.4s ease-in-out ${ATRASO[ordem]} infinite` }}
    />
  );
}

/** Esqueleto do painel (03). O texto visível serve de anúncio para leitor de tela. */
export function SkeletonPainel() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-4xl border border-line bg-s1 p-5">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-[52px] w-[78%]" ordem={1} />
        <Skeleton className="h-1 w-full" ordem={2} />
        <Skeleton className="h-3.5 w-[55%]" ordem={3} />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" ordem={1} />
      <Skeleton className="h-[170px] w-full rounded-2xl" ordem={2} />
      <p className="text-center text-sm text-t3">Carregando seu painel…</p>
    </div>
  );
}
