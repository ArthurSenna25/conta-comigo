import { Skeleton } from "@/components/skeleton";

export default function CarregandoLancamentos() {
  return (
    <main className="mx-auto grid w-full max-w-xl gap-5 px-5 py-8 sm:py-12" aria-busy="true">
      <p role="status" className="text-sm text-t3">Carregando lançamentos…</p>
      <Skeleton className="h-36 rounded-2xl" />
      {[0, 1].map((grupo) => (
        <div key={grupo} className="grid gap-2 rounded-2xl border border-line bg-s1 p-3">
          <Skeleton className="h-16" ordem={1} />
          <Skeleton className="h-16" ordem={2} />
          <Skeleton className="h-16" ordem={3} />
        </div>
      ))}
    </main>
  );
}
