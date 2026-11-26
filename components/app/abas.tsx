"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ABAS, abaAtual, mostrarAbas } from "./navegacao";

/** Ícones de design/handoff/svg/icone-*.svg (24px, currentColor), sem o bloco de metadados. */
const ICONE: Record<string, ReactNode> = {
  "/painel": (
    <>
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.5" opacity=".4" />
      <line x1="3" y1="12" x2="14" y2="12" strokeWidth="2.2" />
      <circle cx="14" cy="12" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  "/lancamentos": (
    <>
      <line x1="5" y1="7" x2="19" y2="7" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="5" y1="17" x2="14" y2="17" />
    </>
  ),
  "/chat": (
    <>
      <rect x="4" y="5" width="16" height="12" rx="4" />
      <line x1="8" y1="20" x2="11" y2="17" />
    </>
  ),
  "/perfil": (
    <>
      <circle cx="12" cy="9" r="4" />
      <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
    </>
  ),
};

const ITEM =
  "relative flex h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] text-sm font-bold no-underline " +
  "transition-transform duration-150 ease-[var(--ease-cc)] focus-visible:outline-offset-[-2px]";

/**
 * Tab bar do app (03-COMPONENTES.md § Tab bar). Some fora das rotas das abas. O espaço reservado embaixo e a
 * posição usam --abas-h (globals.css), que já soma a safe-area do iPhone.
 */
export function Abas() {
  const pathname = usePathname();
  const atual = abaAtual(pathname);
  if (!atual || !mostrarAbas(pathname)) return null;

  return (
    <>
      <div aria-hidden="true" className="h-[calc(var(--abas-h)+34px)] shrink-0" />
      {/* Esmaece o conteúdo que rola por baixo da barra em vez de o texto colidir com ela; com o FAB na tela (painel), sobe até ele. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-scrim)] h-[calc(var(--abas-h)+28px)] [body:has([data-fab])_&]:h-[calc(var(--abas-h)+84px)] bg-[linear-gradient(to_top,var(--bg)_55%,transparent)]"
      />
      <nav
        aria-label="Principal"
        className="fixed inset-x-3 bottom-[calc(14px+env(safe-area-inset-bottom))] z-[var(--z-tabbar)] mx-auto flex max-w-[456px] gap-1 rounded-[26px] border border-line-strong bg-[oklch(0.20_0.03_255/0.94)] p-1.5 shadow-[var(--shadow-nav)] backdrop-blur-[20px]"
      >
        {ABAS.map(({ href, rotulo, ativo }) => {
          const icone = (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {ICONE[href]}
            </svg>
          );
          if (!ativo) {
            return (
              <span key={href} aria-disabled="true" className={`${ITEM} text-t3`}>
                <span className="opacity-60">{icone}</span>
                <span className="opacity-60">{rotulo}</span>
                {/* depois do rótulo no DOM: o leitor de tela ouve "Lançamentos, em breve" */}
                <span className="absolute -top-2.5 rounded-full border border-line-strong bg-s3 px-1.5 text-[11px] leading-4 font-bold whitespace-nowrap text-t2">
                  <span className="sr-only">, </span>em breve
                </span>
              </span>
            );
          }
          const eAtual = href === atual;
          return (
            <Link
              key={href}
              href={href}
              aria-current={eAtual ? "page" : undefined}
              className={`${ITEM} active:scale-96 ${eAtual ? "bg-[var(--acc-a16)] text-acc-ink" : "text-t2 hover:text-t1 active:bg-[var(--acc-a10)]"}`}
            >
              {icone}
              {rotulo}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
