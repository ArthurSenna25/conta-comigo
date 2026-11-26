/**
 * Aviso fixo da conta de demonstração. Cada página protegida renderiza <FaixaDemo demo={...} /> com o
 * `demo` que exigirAcesso() devolveu (tests/portao.test.ts falha se faltar). Em conta comum não renderiza nada.
 */
export function FaixaDemo({ demo }: { demo: boolean }) {
  if (!demo) return null;
  return (
    <div
      role="note"
      // Uma linha a partir de 360px: 12px (13px a partir de 390) com tracking levemente fechado; abaixo disso quebra em vez de cortar.
      className="sticky top-0 z-50 border-b border-amber-700 bg-amber-100 px-3 py-1.5 text-center text-xs leading-5 font-medium tracking-[-0.015em] text-amber-950 xs:text-[13px]"
    >
      Conta de demonstração: dados fictícios, não envie dados reais.
    </div>
  );
}
