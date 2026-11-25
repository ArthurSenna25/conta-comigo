import Link from "next/link";
import type { ReactNode } from "react";
import { BOTAO } from "@/components/botao";

type DocumentoLegalProps = {
  titulo: string;
  resumo: string;
  outroDocumento: {
    href: "/legal/termos" | "/legal/privacidade";
    rotulo: string;
  };
  children: ReactNode;
};

export function DocumentoLegal({ titulo, resumo, outroDocumento, children }: DocumentoLegalProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-3xl px-5 py-2 sm:px-8">
          <Link href="/" prefetch={false} aria-label="Conta Comigo, página inicial" className={BOTAO.fantasma}>
            Conta Comigo
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        <article aria-labelledby="titulo-documento">
          <h1 id="titulo-documento" className="text-4xl leading-tight font-bold text-t1 sm:text-5xl">
            {titulo}
          </h1>
          <p className="mt-3 max-w-prose leading-relaxed text-t2">{resumo}</p>

          <aside aria-label="Status do documento" className="mt-6 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3">
            <p className="text-sm leading-relaxed text-t2">
              <strong className="text-warn">PENDENTE de aprovação.</strong>{" "}
              Esta é a versão para revisão. A data de vigência será informada após a aprovação.
            </p>
          </aside>

          <div className="mt-8 grid gap-7 leading-relaxed text-t2 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-t1 [&_p+p]:mt-3">
            {children}
          </div>
        </article>
      </main>

      <footer className="border-t border-line">
        <nav aria-label="Documentos legais" className="mx-auto flex w-full max-w-3xl px-5 py-3 sm:px-8">
          <Link href={outroDocumento.href} prefetch={false} className={BOTAO.fantasma}>
            {outroDocumento.rotulo}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
