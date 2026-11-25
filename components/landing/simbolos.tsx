/** Fio decorativo curto (selo do hero, balão do chat, cartões de segurança). Sempre aria-hidden. */
export function FioCurto({
  largura,
  ponta,
  cor = "var(--ok)",
  className = "",
}: {
  largura: number;
  /** Posição da bolinha, em px dentro de `largura`. */
  ponta: number;
  cor?: string;
  className?: string;
}) {
  const altura = 10;
  const y = altura / 2;
  return (
    <svg
      aria-hidden="true"
      width={largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      className={`shrink-0 overflow-visible ${className}`}
    >
      <line x1={1} y1={y} x2={largura - 1} y2={y} strokeWidth={2} strokeLinecap="round" style={{ stroke: "var(--track)" }} />
      <line x1={1} y1={y} x2={ponta} y2={y} strokeWidth={2.5} strokeLinecap="round" style={{ stroke: cor }} />
      <circle cx={ponta} cy={y} r={3} style={{ fill: cor }} />
    </svg>
  );
}

/** Marca (svg/logo-marca.svg) + nome. */
export function Marca({ tamanho = 30, comNome = true }: { tamanho?: number; comNome?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg aria-hidden="true" width={tamanho} height={tamanho} viewBox="0 0 36 36" className="shrink-0">
        <rect x={0.5} y={0.5} width={35} height={35} rx={10} style={{ fill: "var(--s2)", stroke: "var(--line)" }} />
        <line x1={8} y1={18} x2={28} y2={18} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} style={{ stroke: "var(--t3)" }} />
        <line x1={8} y1={18} x2={21} y2={18} strokeWidth={2} strokeLinecap="round" style={{ stroke: "var(--ok)" }} />
        <circle cx={21} cy={18} r={3} style={{ fill: "var(--ok)" }} />
      </svg>
      {comNome && <span className="num text-lg font-extrabold tracking-[-0.01em] text-t1">Conta Comigo</span>}
    </span>
  );
}
