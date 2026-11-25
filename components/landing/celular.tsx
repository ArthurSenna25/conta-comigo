import Image from "next/image";
import type { ReactNode } from "react";
import { FioDoLimite } from "@/components/fio-do-limite";
import { ProximoPasso } from "@/components/proximo-passo";
import { ValorMoeda } from "@/components/valor-moeda";

/**
 * Celular da landing: ilustração estática das telas do app com dados de EXEMPLO (07-ASSETS-E-DADOS.md).
 * Desenhado em 390×844 e reduzido por `transform: scale(var(--s))` (landing.css), então a caixa
 * externa tem tamanho fixo e não causa CLS. É decorativo: `inert` + `aria-hidden`.
 */
export type TelaCelular = "painel" | "adicionar" | "lendo" | "conferir" | "confirmado";

const LIMITE_EXEMPLO = 8_100_000;

export function Celular({ tela, className = "" }: { tela: TelaCelular; className?: string }) {
  return (
    <div className={`celular ${className}`} aria-hidden="true" inert>
      <div className="celular-tela">{TELAS[tela]}</div>
    </div>
  );
}

const TELAS: Record<TelaCelular, ReactNode> = {
  painel: <Painel faturado={3_402_000} />,
  confirmado: <Painel faturado={3_437_000} toast />,
  adicionar: <Adicionar />,
  lendo: <Lendo />,
  conferir: <Conferir />,
};

function FaixaDemo() {
  return (
    <div className="flex h-[30px] items-center justify-center gap-2 rounded-sm border border-line-strong text-sm font-semibold text-t2 [background:repeating-linear-gradient(135deg,oklch(0.245_0.035_255)_0_9px,oklch(0.28_0.04_255)_9px_18px)]">
      <span className="size-2 rounded-full bg-warn" />
      Modo demonstração · dados de exemplo
    </div>
  );
}

function Painel({ faturado, toast = false }: { faturado: number; toast?: boolean }) {
  return (
    <div className="flex h-full flex-col gap-4 px-5 pt-5">
      <FaixaDemo />
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] text-t2">Olá, Ana</span>
          <span className="num text-2xl leading-tight font-extrabold tracking-[-0.015em]">Seu ano até aqui</span>
        </div>
        <span className="num grid size-11 place-items-center rounded-full border border-line-strong bg-s2 font-extrabold">A</span>
      </div>
      <div className="flex flex-col gap-4 rounded-4xl border border-line-strong p-5 shadow-panel [background:radial-gradient(380px_circle_at_25%_0%,var(--spot),transparent_62%),var(--panel)]">
        <span className="text-[15px] text-t2">Faturado em 2026</span>
        <ValorMoeda centavos={faturado} tamanho="hero" />
        <FioDoLimite nivel="folga" faturadoCentavos={faturado} limiteCentavos={LIMITE_EXEMPLO} animar={false} />
      </div>
      <ProximoPasso
        tom="ok"
        selo="20"
        titulo="Seu DAS vence em 26 dias"
        subtitulo="Valor e código de pagamento ficam prontos aqui."
      />
      <div className="flex items-center justify-between rounded-2xl border border-line bg-card-solid p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-t3">Próximo DAS</span>
          <span className="num text-[22px] font-extrabold">R$ 81,90</span>
        </div>
        <span className="text-sm text-t2">Vence em 20/12/2026</span>
      </div>
      {toast && (
        <div className="absolute inset-x-4 bottom-[180px] flex items-center gap-3 rounded-[18px] border border-line-strong bg-s3 p-4 shadow-toast">
          <span className="grid size-6 place-items-center rounded-full bg-ok text-sm font-bold text-on-ok">✓</span>
          <span className="flex flex-col">
            <span className="text-[15px] font-bold">Lançamento salvo</span>
            <span className="num text-sm text-t2">Faltam R$ 46.630,00 no fio</span>
          </span>
        </div>
      )}
      <TabBar />
    </div>
  );
}

function TabBar() {
  const itens = ["Painel", "Lançamentos", "Chat", "Perfil"];
  return (
    <>
      <span className="absolute right-5 bottom-[108px] flex h-[58px] items-center gap-2 rounded-2xl bg-acc pr-6 pl-[18px] text-[17px] font-bold text-on-acc shadow-fab">
        + Adicionar
      </span>
      <div className="absolute inset-x-3 bottom-3.5 grid grid-cols-4 gap-1 rounded-4xl border border-line-strong bg-[oklch(0.20_0.03_255/0.78)] p-1.5 shadow-nav">
        {itens.map((item, i) => (
          <span
            key={item}
            className={`grid h-[58px] place-items-center rounded-2xl text-sm font-bold ${i === 0 ? "bg-[var(--acc-a16)] text-acc-ink" : "text-t2"}`}
          >
            {item}
          </span>
        ))}
      </div>
    </>
  );
}

const OPCOES = [
  { nome: "Foto", icone: "foto" },
  { nome: "Áudio", icone: "audio" },
  { nome: "Print", icone: "print" },
  { nome: "Escrever", icone: "escrever" },
] as const;

function Adicionar() {
  return (
    <div className="flex h-full flex-col gap-5 px-5 pt-8">
      <span className="num text-[30px] leading-[1.1] font-extrabold tracking-[-0.02em]">O que entrou ou saiu?</span>
      <span className="text-base text-t2">Mande do jeito mais fácil. A IA monta um rascunho e você confere.</span>
      <div className="grid grid-cols-2 gap-3">
        {OPCOES.map(({ nome, icone }, i) => (
          <span
            key={nome}
            className={`flex h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border text-base font-bold ${i === 0 ? "border-acc bg-[var(--acc-a10)]" : "border-line-strong bg-s1"}`}
          >
            <Image src={`/landing/icone-${icone}.svg`} alt="" width={30} height={30} />
            {nome}
          </span>
        ))}
      </div>
      <span className="text-sm font-semibold text-t2">Ou escreva do seu jeito</span>
      <span className="h-[96px] rounded-xl border border-line-strong bg-s2 p-4 text-[17px] text-t3">
        recebi 120 do corte da Maria hoje
      </span>
      <span className="rounded-xl bg-s2 p-3.5 text-sm leading-snug text-t2">
        A IA só rascunha. Quem calcula limite e DAS é o app, e nada entra sem você confirmar.
      </span>
    </div>
  );
}

function Lendo() {
  return (
    <div className="flex h-full flex-col gap-5 px-5 pt-8">
      <span className="num text-[30px] leading-[1.1] font-extrabold tracking-[-0.02em]">Lendo sua foto…</span>
      <span className="text-base text-t2">Isso leva poucos segundos. Nada foi salvo ainda.</span>
      <div className="relative h-[300px] overflow-hidden rounded-3xl border border-line-strong [background:repeating-linear-gradient(135deg,var(--s2)_0_8px,var(--s3)_8px_16px)]">
        <span className="absolute inset-x-0 top-[38%] h-[30%] [background:linear-gradient(180deg,transparent,oklch(0.78_0.12_240/0.45),transparent)]" />
      </div>
      <span className="flex items-center gap-3 text-base">
        <span className="grid size-6 place-items-center rounded-full bg-ok text-sm font-bold text-on-ok">✓</span>
        Recebido
      </span>
      <span className="flex items-center gap-3 text-base text-t2">
        <span className="ml-2 size-2 rounded-full bg-acc" />
        Procurando valor, data e tipo
      </span>
      <span className="flex items-center gap-3 text-base text-t3">
        <span className="ml-1 size-4 rounded-full border border-dashed border-line-strong" />
        Montando o rascunho para você conferir
      </span>
    </div>
  );
}

function Campo({ rotulo, valor, aviso = false, grande = false }: { rotulo: string; valor: string; aviso?: boolean; grande?: boolean }) {
  return (
    <span className="flex flex-col gap-1.5">
      <span className={`text-sm font-semibold ${aviso ? "text-warn" : "text-t2"}`}>{rotulo}</span>
      <span
        className={`num flex items-center rounded-lg border px-4 ${grande ? "h-16 text-[28px] font-extrabold" : "h-[52px] text-base font-semibold"} ${aviso ? "border-warn [background:color-mix(in_oklch,var(--warn)_10%,var(--s2))]" : "border-line-strong bg-s2"}`}
      >
        {valor}
      </span>
    </span>
  );
}

function Conferir() {
  return (
    <div className="flex h-full flex-col gap-4 px-5 pt-6">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center text-2xl text-t2">‹</span>
        <span className="num flex-1 text-[22px] font-extrabold">Conferir rascunho</span>
        <span className="rounded-xs border border-dashed border-line-strong px-2 py-0.5 text-sm font-semibold text-t3">exemplo</span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-s1 p-3">
        <span className="grid size-14 place-items-center rounded-md text-sm text-t2 [background:repeating-linear-gradient(135deg,var(--s2)_0_8px,var(--s3)_8px_16px)]">foto</span>
        <span className="flex flex-col">
          <span className="text-[15px] font-semibold">Lido de uma foto</span>
          <span className="text-sm text-t3">Hoje, 14:32 · toque para ver o original</span>
        </span>
      </div>
      <Campo rotulo="Valor" valor="R$ 350,00" grande />
      <Campo rotulo="Descrição" valor="Escova progressiva · Maria" />
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Data · confira" valor="2?/11/2026" aviso />
        <Campo rotulo="Tipo" valor="Entrada" />
      </div>
      <span className="rounded-xl border border-warn p-3 text-sm text-t1 [background:color-mix(in_oklch,var(--warn)_10%,var(--s1))]">
        A data estava cortada na foto. Confira.
      </span>
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 border-t border-line px-5 pt-3 pb-[34px] [background:oklch(0.16_0.025_255/0.85)]">
        <span className="text-center text-sm text-t2">Nada foi salvo ainda. Só entra no fio quando você confirmar.</span>
        <span className="grid grid-cols-[1fr_1.5fr] gap-3">
          <span className="grid h-14 place-items-center rounded-xl text-base font-semibold text-acc-ink">Descartar rascunho</span>
          <span className="grid h-14 place-items-center rounded-xl bg-acc text-[17px] font-bold text-on-acc">Confirmar lançamento</span>
        </span>
      </div>
    </div>
  );
}
