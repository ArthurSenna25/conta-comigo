import Link from "next/link";
import { ADICIONAR } from "./navegacao";

// Borda direita alinhada à da tab bar (inset 12px, coluna de 456px) e 12px acima dela; a safe-area já vem em --abas-h.
// 48px de altura: alvo de toque folgado sem virar um bloco sobre o conteúdo.
const POSICAO =
  "fixed right-[max(12px,calc((100vw-456px)/2))] bottom-[calc(var(--abas-h)+12px)] z-[var(--z-fab)] " +
  "inline-flex h-12 items-center gap-1.5 rounded-2xl pr-5 pl-4 text-base font-bold no-underline";

/** FAB Adicionar (03-COMPONENTES.md § Outros do app). Só no painel. Desligado: não renderiza (um botão desabilitado cobriria o conteúdo). */
export function FabAdicionar() {
  const mais = (
    <span aria-hidden="true" className="text-lg leading-none">
      +
    </span>
  );
  if (!ADICIONAR.ativo) return null;
  return (
    <Link
      href={ADICIONAR.href}
      data-fab
      className={`${POSICAO} bg-acc text-on-acc shadow-[var(--shadow-fab)] transition-transform duration-150 ease-[var(--ease-cc)] active:scale-96 active:brightness-92 focus-visible:outline-offset-4`}
    >
      {mais}
      {ADICIONAR.rotulo}
    </Link>
  );
}
