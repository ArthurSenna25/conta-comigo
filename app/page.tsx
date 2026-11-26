import type { Metadata } from "next";
import { Landing } from "./(marketing)/landing";

export const metadata: Metadata = {
  title: "Conta Comigo · Assistente de papelada para MEI",
  description:
    "Escreva o que entrou ou saiu e a IA monta o rascunho (foto, áudio e print em breve). Você confere, e o app calcula seu limite anual do MEI e o DAS.",
};

export default function Home() {
  return <Landing />;
}
