import type { Viewport } from "next";
import { Abas } from "@/components/app/abas";
import { ProvedorFluxo } from "./fluxo-lancamento";

// cover só no app logado: sem isso env(safe-area-inset-*) vale 0 no iPhone e a tab bar fica sob o indicador home
export const viewport: Viewport = { viewportFit: "cover" };

/**
 * Casca do app logado: a tab bar e o estado do fluxo adicionar → conferir (memória do cliente). NÃO chama exigirAcesso (layout não re-renderiza a cada navegação;
 * cada página chama o portão) e não importa lib/db nem lib/ai.
 */
export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <ProvedorFluxo>
      {children}
      <Abas />
    </ProvedorFluxo>
  );
}
