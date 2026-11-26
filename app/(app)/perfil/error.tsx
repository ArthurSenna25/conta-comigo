"use client";

import { BOTAO } from "@/components/botao";

export default function ErroPerfil({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-5 py-8 sm:py-12">
      <h1 className="text-3xl leading-tight font-bold">Perfil</h1>
      <div className="grid gap-4 rounded-2xl border border-line bg-s1 p-4 sm:p-6">
        <p role="alert" className="text-t2">Não foi possível exibir o perfil. Tente novamente.</p>
        <button type="button" className={BOTAO.secundario} onClick={retry}>Tentar novamente</button>
      </div>
    </main>
  );
}
