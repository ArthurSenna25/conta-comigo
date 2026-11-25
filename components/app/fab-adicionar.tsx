import Link from "next/link";
import { ADICIONAR } from "./navegacao";

// Direita 20 dentro da coluna de 480px, 22px acima da tab bar (≈108 do fundo, como no handoff).
const POSICAO =
  "fixed right-[max(20px,calc((100vw-480px)/2+20px))] bottom-[calc(var(--abas-h)+22px)] z-[var(--z-fab)] " +
  "inline-flex h-[58px] items-center gap-2 rounded-[20px] pr-6 pl-[18px] text-[17px] font-bold no-underline";

/** FAB Adicionar (03-COMPONENTES.md § Outros do app). Só no painel. Desligado: "em breve", sem link. */
export function FabAdicionar() {
  const mais = (
    <span aria-hidden="true" className="text-base leading-none">
      +
    </span>
  );
  if (!ADICIONAR.ativo) {
    return (
      <span aria-disabled="true" className={`${POSICAO} border border-line-strong bg-s3 text-t3`}>
        {mais}
        {ADICIONAR.rotulo}
        <span className="rounded-full border border-line-strong px-1.5 text-[11px] leading-4 font-bold text-t2">em breve</span>
      </span>
    );
  }
  return (
    <Link
      href={ADICIONAR.href}
      className={`${POSICAO} bg-acc text-on-acc shadow-[var(--shadow-fab)] transition-transform duration-150 ease-[var(--ease-cc)] active:scale-96`}
    >
      {mais}
      {ADICIONAR.rotulo}
    </Link>
  );
}
