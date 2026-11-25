import type { Metadata } from "next";
import { exigirAcesso } from "@/actions/sessao";
import { FaixaDemo } from "@/components/demo/faixa-demo";
import { hojeBrasil } from "@/lib/contracts";
import { Conferir } from "./conferir";

export const metadata: Metadata = { title: "Conferir · Conta Comigo" };

/** Modo IA (rascunhos guardados no cliente pelo /adicionar) ou manual (?modo=manual). Confirma por confirmarLancamento. */
export default async function PaginaConferir({ searchParams }: PageProps<"/conferir">) {
  const { demo } = await exigirAcesso();
  const manual = (await searchParams).modo === "manual";
  return (
    <div className="flex min-h-dvh flex-col">
      <FaixaDemo demo={demo} />
      <Conferir key={manual ? "manual" : "ia"} manual={manual} hoje={hojeBrasil()} />
    </div>
  );
}
