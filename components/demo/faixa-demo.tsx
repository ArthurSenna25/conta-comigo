/**
 * Aviso fixo da conta de demonstração. Cada página protegida renderiza <FaixaDemo demo={...} /> com o
 * `demo` que exigirAcesso() devolveu (tests/portao.test.ts falha se faltar). Em conta comum não renderiza nada.
 */
export function FaixaDemo({ demo }: { demo: boolean }) {
  if (!demo) return null;
  return (
    <aside
      aria-label="Aviso"
      className="sticky top-0 z-50 border-b border-amber-700 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950"
    >
      Conta de demonstração: dados fictícios, não envie dados reais.
    </aside>
  );
}
