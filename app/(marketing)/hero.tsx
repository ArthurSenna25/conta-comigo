import Link from "next/link";
import type { ReactNode } from "react";
import { Celular } from "@/components/landing/celular";
import { BotaoExperimente } from "@/components/landing/experimente/botao-experimente";
import { FioCurto } from "@/components/landing/simbolos";

const GARANTIAS = ["Nada é salvo sem você confirmar", "IA opcional", "Você apaga quando quiser"];

export function Hero() {
  return (
    <section
      id="topo"
      aria-labelledby="titulo-hero"
      data-fio="1"
      data-movimento="hero"
      className="relative flex min-h-svh flex-col items-center overflow-x-clip pt-[clamp(124px,17vh,176px)]"
    >
      <Feixes />
      <div className="relative z-[2] flex w-[min(1180px,100%-40px)] flex-col items-center gap-[26px] text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[4%] -inset-y-[16%] -z-10 [background:radial-gradient(closest-side,oklch(0.13_0.025_255/0.78),transparent)]"
        />
        <p
          data-movimento="hero-item"
          className="lp-vidro flex min-h-9 items-center gap-2.5 rounded-full px-4 text-sm font-semibold text-t2"
        >
          <FioCurto largura={30} ponta={14} />
          Assistente de papelada para MEI
        </p>
        <h1
          id="titulo-hero"
          data-movimento="hero-linhas"
          className="num m-0 max-w-[12ch] text-[clamp(52px,9.2vw,150px)] leading-[0.92] font-extrabold tracking-[-0.055em] text-balance"
        >
          Anote a venda. A gente cuida do resto.
        </h1>
        <p data-movimento="hero-item" className="lp-corpo max-w-[560px] text-[clamp(17px,1.4vw,20px)]">
          Escreva do seu jeito e a IA monta o rascunho. Você confere, e o app calcula seu limite anual e o DAS.{" "}
          <span className="whitespace-nowrap text-t3">Foto, áudio e print: em breve.</span>
        </p>
        <div data-movimento="hero-item" className="flex flex-wrap items-center justify-center gap-3">
          <span className="lp-borda-conica" data-movimento="borda-conica">
            <Link href="/cadastrar" className="lp-btn lp-btn-branco" data-movimento="ima">
              Comece agora
            </Link>
          </span>
          <a href="#como" className="lp-btn lp-btn-vidro">
            Ver o app funcionando
            <span aria-hidden="true" className="text-t3">
              ↓
            </span>
          </a>
          <BotaoExperimente />
        </div>
        <ul
          data-movimento="hero-item"
          className="flex flex-wrap justify-center gap-x-[22px] gap-y-2 text-[15px] text-t2"
        >
          {GARANTIAS.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
      <Palco />
    </section>
  );
}

/** Celular com o painel de exemplo e, no desktop, dois cartões de vidro inclinados (CSS 3D estático). */
function Palco() {
  return (
    <div
      data-movimento="hero-palco"
      className="relative z-[1] mt-[clamp(36px,5vh,64px)] flex h-[calc(844px*0.5*0.68+30px)] w-[min(1180px,100%)] justify-center overflow-hidden pt-[30px] [perspective:1400px] [mask-image:linear-gradient(180deg,#000_55%,transparent_98%)] md:h-[calc(844px*0.56*0.68+30px)] xl:h-[calc(844px*0.68*0.74+30px)]"
    >
      <CartaoFlutuante
        lado="esquerda"
        rotulo="Faturado em 2026"
        valor="R$ 34.020,00"
        rodape={<span className="num text-[15px] font-bold text-ok">Faltam R$ 46.980,00</span>}
        fio
      />
      <CartaoFlutuante
        lado="direita"
        rotulo="Próximo DAS"
        valor="R$ 82,05"
        rodape={<span className="num text-[15px] text-t2">Vence em 20/12/2026</span>}
      />
      <div data-movimento="hero-item abertura-celular" className="relative z-[2]">
        <div data-movimento="flutuar">
          <div data-movimento="tilt">
            <Celular tela="painel" className="celular-hero" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface CartaoFlutuanteProps {
  lado: "esquerda" | "direita";
  rotulo: string;
  valor: string;
  rodape: ReactNode;
  fio?: boolean;
}

function CartaoFlutuante({ lado, rotulo, valor, rodape, fio = false }: CartaoFlutuanteProps) {
  const posicao =
    lado === "esquerda"
      ? "left-[5%] top-24 w-[280px] [transform:rotateY(22deg)_rotateZ(-4deg)]"
      : "right-[5%] top-[170px] w-[260px] [transform:rotateY(-22deg)_rotateZ(4deg)]";
  return (
    <div
      aria-hidden="true"
      data-movimento="parallax abertura"
      data-speed={lado === "esquerda" ? "0.18" : "0.24"}
      className={`absolute hidden [transform-style:preserve-3d] xl:block ${posicao}`}
    >
      <div data-movimento="tilt" className="lp-vidro flex flex-col gap-2.5 rounded-3xl p-5 text-left">
        <div className="flex justify-between text-sm text-t2">
          <span>{rotulo}</span>
          <span className="text-t3">exemplo</span>
        </div>
        <span className="num text-[30px] font-extrabold tracking-[-0.02em]">{valor}</span>
        {fio && (
          <svg viewBox="0 0 240 12" className="h-auto w-full">
            <line x1={2} y1={6} x2={218} y2={6} strokeWidth={2} strokeLinecap="round" style={{ stroke: "var(--track)" }} />
            <line x1={2} y1={6} x2={92} y2={6} strokeWidth={3} strokeLinecap="round" style={{ stroke: "var(--ok)" }} />
            <circle cx={92} cy={6} r={4.5} style={{ fill: "var(--ok)" }} />
            <line x1={218} y1={0} x2={218} y2={12} strokeWidth={1.5} style={{ stroke: "var(--t2)" }} />
          </svg>
        )}
        {rodape}
      </div>
    </div>
  );
}

/** Feixes cônicos, feixe central e horizonte curvo (só gradientes CSS, ver protótipo). */
function Feixes() {
  return (
    <>
      <div
        aria-hidden="true"
        data-movimento="parallax abertura"
        data-speed="0.3"
        className="pointer-events-none absolute inset-x-0 top-0 bottom-1/4 opacity-75 [mask-image:linear-gradient(180deg,#000_55%,transparent)]"
      >
        <div className="absolute -top-[30%] -left-1/4 h-[130%] w-3/4 blur-[12px] [background:conic-gradient(from_135deg_at_100%_0%,transparent_0deg,oklch(0.72_0.12_238/0.14)_14deg,transparent_34deg)]" />
        <div className="absolute -top-[30%] -right-1/4 h-[130%] w-3/4 blur-[12px] [background:conic-gradient(from_191deg_at_0%_0%,transparent_0deg,oklch(0.72_0.12_238/0.14)_20deg,transparent_34deg)]" />
        <div className="absolute -top-[12%] left-1/2 h-4/5 w-[min(760px,95vw)] -translate-x-1/2 blur-[24px] [background:radial-gradient(50%_55%_at_50%_0%,oklch(0.68_0.14_240/0.32),transparent_72%)]" />
        <div className="absolute top-0 left-1/2 h-1/2 w-[1.5px] -translate-x-1/2 [background:linear-gradient(180deg,oklch(0.98_0.02_230/0.9),oklch(0.86_0.09_235/0.3)_55%,transparent)] shadow-[0_0_18px_3px_oklch(0.78_0.12_240/0.4),0_0_90px_20px_oklch(0.62_0.14_245/0.2)]" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-[140px] h-[560px] overflow-hidden">
        <div className="absolute top-10 left-1/2 h-[360px] w-[min(150vw,2100px)] -translate-x-1/2 blur-[14px] [background:radial-gradient(50%_50%_at_50%_55%,oklch(0.55_0.13_242/0.28),transparent_72%)]" />
        <div className="absolute top-[220px] left-1/2 aspect-square w-[min(190vw,2700px)] -translate-x-1/2 rounded-full blur-[3px] [background:radial-gradient(closest-side,oklch(0.14_0.024_255)_97%,oklch(0.48_0.11_242/0.5)_99.4%,transparent_100%)] [mask-image:linear-gradient(180deg,#000_0,#000_1.5%,transparent_8%)]" />
      </div>
    </>
  );
}
