/**
 * Destinos do app logado (design/handoff/03-COMPONENTES.md § Tab bar e § FAB Adicionar). Cada dono liga o seu
 * trocando `ativo` para true no PR da tela; desligado aparece com o selo "em breve" e sem link.
 */
export interface Destino {
  href: string;
  rotulo: string;
  ativo: boolean;
}

export const ABAS: readonly Destino[] = [
  { href: "/painel", rotulo: "Painel", ativo: true },
  { href: "/lancamentos", rotulo: "Lançamentos", ativo: true },
  { href: "/chat", rotulo: "Chat", ativo: true },
  { href: "/perfil", rotulo: "Perfil", ativo: false },
];

/** Adicionar não é aba: é o FAB, só no painel. */
export const ADICIONAR: Destino = { href: "/adicionar", rotulo: "Adicionar", ativo: true };

const contem = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/**
 * Abas que abrem em tela cheia, sem a barra. DESVIO do handoff (03 § Tab bar mostra a barra no /chat): a janela
 * do chat (#36) ocupa a altura visível e põe o campo no rodapé, que a barra fixa cobriria. Reavaliar com iPhone real.
 */
const TELA_CHEIA: readonly string[] = ["/chat"];

/** href da aba que contém `pathname` (a própria rota ou subrota), ou null. */
export function abaAtual(pathname: string): string | null {
  return ABAS.find((a) => contem(pathname, a.href))?.href ?? null;
}

/** A barra aparece só nas rotas das abas e fora das telas cheias. */
export function mostrarAbas(pathname: string): boolean {
  return abaAtual(pathname) !== null && !TELA_CHEIA.some((href) => contem(pathname, href));
}
