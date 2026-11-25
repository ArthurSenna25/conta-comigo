import type { Metadata } from "next";
import { exigirAcesso } from "@/actions/sessao";
import { FaixaDemo } from "@/components/demo/faixa-demo";
import { Adicionar } from "./adicionar";

export const metadata: Metadata = { title: "Adicionar · Conta Comigo" };

/** Tela de fluxo (sem tab bar): o envio vai a POST /api/ingest, que tem o próprio portão. */
export default async function PaginaAdicionar() {
  const { demo } = await exigirAcesso();
  return (
    <div className="flex min-h-dvh flex-col">
      <FaixaDemo demo={demo} />
      <Adicionar />
    </div>
  );
}
