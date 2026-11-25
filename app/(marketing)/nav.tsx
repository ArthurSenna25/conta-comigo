import Link from "next/link";
import { BOTAO } from "@/components/botao";
import { Marca } from "@/components/landing/simbolos";
import { MenuMobile } from "./menu-mobile";

export const LINKS_NAV = [
  { href: "#como", rotulo: "Como funciona" },
  { href: "#recursos", rotulo: "O limite" },
  { href: "#seguranca", rotulo: "Segurança" },
  { href: "#perguntas", rotulo: "Perguntas" },
] as const;

export function Nav() {
  return (
    <header className="lp-nav" data-movimento="nav">
      <nav aria-label="Principal" className="flex items-center gap-2 py-2 pr-2 pl-[18px]">
        <a href="#topo" className="flex min-h-11 items-center no-underline hover:opacity-100">
          <Marca />
        </a>
        <ul className="hidden flex-1 justify-center gap-0.5 xl:flex">
          {LINKS_NAV.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="lp-nav-link">
                {l.rotulo}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-1 xl:flex">
          <Link href="/entrar" className={`${BOTAO.fantasma} h-11 rounded-md px-4 text-[15px] text-t1`}>
            Entrar
          </Link>
          <Link
            href="/cadastrar"
            className="lp-btn lp-btn-branco min-h-11 px-5 text-[15px]"
            data-movimento="ima"
          >
            Comece agora
          </Link>
        </div>
        <div className="ml-auto xl:hidden">
          <MenuMobile links={LINKS_NAV} />
        </div>
      </nav>
    </header>
  );
}
