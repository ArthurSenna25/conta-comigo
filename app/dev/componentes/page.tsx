import { notFound } from "next/navigation";
import { exigirAcesso } from "@/actions/sessao";
import { FaixaDemo } from "@/components/demo/faixa-demo";
import { Vitrine } from "./vitrine";

export const metadata = { title: "Componentes · dev", robots: { index: false } };

/** Vitrine da fundação de design. Só existe em `pnpm dev`; no build de produção é 404. */
export default async function ComponentesPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const { demo } = await exigirAcesso("sessao");
  return (
    <>
      <FaixaDemo demo={demo} />
      <Vitrine />
    </>
  );
}
