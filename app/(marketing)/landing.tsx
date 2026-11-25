import "./landing.css";
import { CtaFinal, Rodape } from "./cta-e-rodape";
import { Hero } from "./hero";
import { ChatComFonte, IaSoRascunha } from "./ia-e-chat";
import { Limite } from "./limite";
import { Nav } from "./nav";
import { Perguntas, Seguranca } from "./seguranca-e-perguntas";
import { SigaOFio } from "./siga-o-fio";

/** Fio de fundo em SVG (svg/fio-fallback-landing.svg). Estático; a etapa de movimento liga ao scroll. */
function FioDeFundo() {
  const curva = "M88 -10 C 30 110, 18 230, 64 340 S 96 560, 34 690 S 6 900, 58 1010";
  return (
    <svg aria-hidden="true" viewBox="0 0 100 1000" preserveAspectRatio="none" className="lp-fio-fundo" data-movimento="fio-fundo">
      <path d={curva} strokeWidth={12} style={{ stroke: "oklch(0.80 0.11 240 / 0.16)" }} />
      <path d={curva} strokeWidth={2} style={{ stroke: "var(--fio-wire)" }} />
    </svg>
  );
}

/**
 * Landing completa, sem animação (Landing 1 · estrutura). Server Component; só o menu mobile e o
 * botão da demo são client. Ganchos para a etapa de movimento: atributos data-movimento (lista no PR).
 */
export function Landing() {
  return (
    <div className="lp">
      <a
        href="#conteudo"
        className="fixed top-3 left-3 z-[var(--z-modal)] -translate-y-[200%] rounded-md bg-cta px-4 py-3 font-bold text-cta-fg focus-visible:translate-y-0"
      >
        Pular para o conteúdo
      </a>
      <div aria-hidden="true" className="lp-fundo" />
      <div aria-hidden="true" className="lp-estrelas" />
      <FioDeFundo />
      <div aria-hidden="true" className="lp-grao" />
      <Nav />
      <main id="conteudo">
        <Hero />
        <SigaOFio />
        <Limite />
        <IaSoRascunha />
        <ChatComFonte />
        <Seguranca />
        <Perguntas />
        <CtaFinal />
      </main>
      <Rodape />
    </div>
  );
}
