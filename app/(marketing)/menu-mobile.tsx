"use client";

import Link from "next/link";
import { useRef, type KeyboardEvent } from "react";
import { BOTAO } from "@/components/botao";

interface MenuMobileProps {
  links: readonly { href: string; rotulo: string }[];
}

/**
 * <details> nativo: abre e fecha sem JS (o <summary> já expõe aberto/fechado ao leitor de tela).
 * O JS só acrescenta: Esc fecha e devolve o foco, e tocar num link fecha o painel.
 */
export function MenuMobile({ links }: MenuMobileProps) {
  const menu = useRef<HTMLDetailsElement>(null);
  const fechar = () => menu.current?.removeAttribute("open");
  const aoTeclar = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !menu.current?.open) return;
    fechar();
    menu.current.querySelector("summary")?.focus();
  };

  return (
    <details ref={menu} className="lp-menu" onKeyDown={aoTeclar}>
      <summary className={`${BOTAO.secundario} h-11 rounded-md px-4 text-[15px]`}>
        <span className="lp-menu-abrir">Menu</span>
        <span className="lp-menu-fechar">Fechar</span>
      </summary>
      <div className="fixed top-[82px] right-3 left-3 z-[var(--z-menu)] flex flex-col gap-1 rounded-2xl border border-line-strong bg-[oklch(0.20_0.03_255/0.94)] p-2.5 backdrop-blur-[20px]">
        <ul className="flex flex-col gap-1">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={fechar}
                className="flex min-h-[52px] items-center rounded-md px-3.5 text-[17px] font-semibold text-t1 no-underline hover:bg-[oklch(1_0_0/0.05)] hover:opacity-100"
              >
                {l.rotulo}
              </a>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-2 border-t border-line pt-2">
          <Link href="/entrar" className={`${BOTAO.secundario} h-[52px]`}>
            Entrar
          </Link>
          <Link href="/cadastrar" className={`${BOTAO.primario} h-[52px]`}>
            Comece agora
          </Link>
        </div>
      </div>
    </details>
  );
}
