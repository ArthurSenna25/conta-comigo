import Link from "next/link";
import { BotaoDemo } from "@/components/auth/botao-demo";
import { SwitchModoLeve } from "@/components/landing/movimento/switch-modo-leve";
import { Marca } from "@/components/landing/simbolos";

export function CtaFinal() {
  return (
    <section aria-labelledby="titulo-cta" data-fio="1" className="relative pt-[clamp(24px,4vw,48px)] pb-[clamp(96px,12vw,160px)]">
      <svg
        aria-hidden="true"
        viewBox="0 0 20 300"
        preserveAspectRatio="none"
        className="mx-auto block h-[clamp(160px,26vh,280px)] w-5 overflow-visible"
      >
        <line x1={10} y1={0} x2={10} y2={300} strokeWidth={2} vectorEffect="non-scaling-stroke" style={{ stroke: "var(--track)" }} />
        <path
          data-movimento="cta-linha"
          d="M10 0 V300"
          pathLength={100}
          strokeDasharray="100"
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ stroke: "oklch(0.88 0.08 232)", strokeDashoffset: 0, filter: "drop-shadow(0 0 6px var(--acc))" }}
        />
      </svg>
      <div
        data-movimento="reveal"
        className="lp-vidro relative mx-auto flex w-[min(1240px,100%-40px)] flex-col items-center gap-7 overflow-hidden rounded-cta px-[clamp(24px,5vw,72px)] py-[clamp(72px,11vw,152px)] text-center"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 h-1/2 w-[1.5px] -translate-x-1/2 [background:linear-gradient(180deg,oklch(0.98_0.02_230),transparent)] shadow-[0_0_20px_3px_oklch(0.78_0.12_240/0.45),0_0_100px_30px_oklch(0.62_0.14_245/0.22)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[10%] -bottom-[40%] h-4/5 [background:radial-gradient(50%_60%_at_50%_100%,oklch(0.55_0.14_245/0.45),transparent_70%)]"
        />
        <h2
          id="titulo-cta"
          data-movimento="linhas"
          className="num relative m-0 max-w-[820px] text-[clamp(42px,6.6vw,104px)] leading-[0.95] font-extrabold tracking-[-0.05em] text-balance"
        >
          Conta comigo para a papelada.
        </h2>
        <p className="lp-corpo relative max-w-[520px]">
          Crie sua conta em um minuto, ou teste agora com dados de exemplo.
        </p>
        <div className="relative flex flex-wrap items-center justify-center gap-3">
          <span className="lp-borda-conica" data-movimento="borda-conica">
            <Link href="/cadastrar" className="lp-btn lp-btn-branco" data-movimento="ima">
              Comece agora
            </Link>
          </span>
          <BotaoDemo rotulo="Testar com a conta demo" className="lp-btn lp-btn-vidro aria-disabled:opacity-60" />
        </div>
      </div>
    </section>
  );
}

// PENDENTE (07 #13): texto final do rodapé. Páginas legais (#9, #10) são do Frigeri.
export function Rodape() {
  return (
    <footer className="relative pt-2 pb-12">
      <div className="lp-contido flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-col gap-1.5">
          <Marca tamanho={28} />
          <p className="m-0 max-w-[460px] text-[15px] text-t2">
            Projeto de hackathon. Não é um escritório de contabilidade e não substitui um contador.
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/legal/termos" className="lp-nav-link rounded-full px-3">
              Termos de uso
            </Link>
          </li>
          <li>
            <Link href="/legal/privacidade" className="lp-nav-link rounded-full px-3">
              Privacidade
            </Link>
          </li>
          <li>
            <SwitchModoLeve />
          </li>
        </ul>
      </div>
    </footer>
  );
}
