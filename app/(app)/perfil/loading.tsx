import { Skeleton } from "@/components/skeleton";

export default function CarregandoPerfil() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-5 py-8 sm:py-12">
      <h1 className="text-3xl leading-tight font-bold">Perfil</h1>
      <p role="status" className="text-t2">Carregando perfil…</p>
      <div aria-hidden="true" className="grid gap-5 rounded-2xl border border-line bg-s1 p-4 sm:p-6">
        <Skeleton className="h-12" />
        <Skeleton className="h-36" ordem={1} />
        <Skeleton className="h-12" ordem={2} />
        <Skeleton className="h-12" ordem={3} />
      </div>
    </main>
  );
}
