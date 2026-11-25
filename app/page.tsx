import type { Metadata } from "next";
import { Landing } from "./(marketing)/landing";

export const metadata: Metadata = {
  title: "Conta Comigo · Assistente de papelada para MEI",
  description:
    "Mande a foto do recibo, o áudio ou o print. A IA monta o rascunho, você confere, e o app calcula seu limite anual do MEI e o DAS.",
};

export default function Home() {
  return <Landing />;
}
