"use client";

import "./experimente.css";
import { type KeyboardEvent, type SyntheticEvent, useEffect, useReducer, useRef } from "react";
import { createPortal } from "react-dom";
import { ROTULO_CATEGORIA } from "@/components/categoria";
import { FioDoLimite } from "@/components/fio-do-limite";
import { nivelExemplo } from "@/components/landing/limite-exemplo";
import { useEstatico } from "@/components/landing/movimento/preferencias";
import { formatarCentavos } from "@/components/moeda";
import { ValorMoeda } from "@/components/valor-moeda";
import {
  ATRASO_RASCUNHO_MS,
  ESTADO_INICIAL,
  type AcaoSimulacao,
  type EstadoSimulacao,
  PAINEL_FICTICIO,
  RASCUNHO_FAKE,
  roteiro,
  TEXTO_EXEMPLO,
} from "./roteiro";

export const ROTULO_SIMULACAO = "Simulação com dados fictícios";
const FOCAVEIS = 'button:not([disabled]), textarea, a[href], [tabindex]:not([tabindex="-1"])';
const BTN = "lp-btn w-full justify-center";
const PAD_X = "pl-[max(20px,env(safe-area-inset-left))] pr-[max(20px,env(safe-area-inset-right))]";

/**
 * Diálogo da simulação (carregado sob demanda pelo BotaoExperimente). <dialog> nativo em modo modal, num
 * portal no <body>: o resto da página recebe `inert`, a rolagem do fundo trava (html[data-experimente]) e
 * o canvas 3D some, o que pausa o loop dele (IntersectionObserver do fio3d). `data-lenis-prevent` faz o
 * Lenis ignorar a roda dentro do diálogo. Esc fecha; quem abriu devolve o foco ao botão.
 */
export function DialogoExperimente({ aoFechar }: { aoFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    const html = document.documentElement;
    const fundo = [...document.body.children].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== dialogo && !el.inert,
    );
    fundo.forEach((el) => (el.inert = true));
    html.dataset.experimente = "";
    dialogo.showModal();
    return () => {
      dialogo.close();
      delete html.dataset.experimente;
      fundo.forEach((el) => (el.inert = false));
    };
  }, []);

  const aoCancelar = (e: SyntheticEvent) => {
    e.preventDefault(); // Esc: o React decide o fechamento (e a devolução do foco)
    aoFechar();
  };

  return createPortal(
    <dialog
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-experimente"
      data-lenis-prevent=""
      onCancel={aoCancelar}
      onKeyDown={prenderTab}
      className="exp-dialogo m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-bg p-0 text-t1 backdrop:bg-[oklch(0.1_0.02_255/0.72)] md:m-auto md:h-fit md:max-h-[min(880px,calc(100dvh-48px))] md:max-w-[440px] md:rounded-3xl md:border md:border-line-strong"
    >
      <Simulacao aoFechar={aoFechar} />
    </dialog>,
    document.body,
  );
}

/** Tab e Shift+Tab giram dentro do diálogo (o modal nativo deixaria sair para a barra do navegador). */
function prenderTab(e: KeyboardEvent<HTMLDialogElement>) {
  if (e.key !== "Tab") return;
  const focaveis = [...e.currentTarget.querySelectorAll<HTMLElement>(FOCAVEIS)];
  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];
  if (!primeiro || !ultimo) return;
  if (e.shiftKey && document.activeElement === primeiro) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primeiro.focus();
  }
}

/** Conteúdo do diálogo. Exportado para o teste renderizar sem portal. */
export function Simulacao({ aoFechar, inicial = ESTADO_INICIAL }: { aoFechar: () => void; inicial?: EstadoSimulacao }) {
  const [estado, despachar] = useReducer(roteiro, inicial);
  const estatico = useEstatico();

  useEffect(() => {
    if (estado.etapa !== "lendo") return;
    const id = window.setTimeout(() => despachar("rascunhoPronto"), ATRASO_RASCUNHO_MS);
    return () => clearTimeout(id);
  }, [estado.etapa]);

  return (
    <div className="flex min-h-full flex-col">
      {/* Cabeçalho fixo: o rótulo da simulação fica visível mesmo com o conteúdo rolado. */}
      <header
        className={`sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-bg pt-[max(14px,env(safe-area-inset-top))] pb-3 ${PAD_X}`}
      >
        <div className="flex flex-col gap-1.5">
          <p className="inline-flex w-fit items-center gap-2 rounded-lg border border-dashed border-line-strong px-2.5 py-1 text-sm font-semibold text-t2">
            <span aria-hidden="true" className="size-2 rounded-full bg-warn" />
            {ROTULO_SIMULACAO}
          </p>
          <h2 id="titulo-experimente" className="num text-xl font-extrabold tracking-[-0.02em]">
            Experimente o Conta Comigo
          </h2>
        </div>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar simulação"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-s2 text-xl text-t2 hover:text-t1"
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className={`flex flex-col gap-4 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] ${PAD_X}`}>
        <Painel faturadoCentavos={estado.faturadoCentavos} estatico={estatico} />
        <Etapas estado={estado} despachar={despachar} />
      </div>

      <p role="status" className="sr-only">
        {estado.etapa === "lendo" && "Lendo o texto."}
        {estado.etapa === "rascunho" && "Rascunho pronto. Confira e confirme."}
        {estado.etapa === "confirmado" && `Lançamento confirmado. Faturado agora: ${formatarCentavos(estado.faturadoCentavos)}.`}
      </p>
    </div>
  );
}

function Painel({ faturadoCentavos, estatico }: { faturadoCentavos: number; estatico: boolean }) {
  const { limiteCentavos, ano, das } = PAINEL_FICTICIO;
  return (
    <>
      <section
        aria-labelledby="exp-faturado"
        className="flex flex-col gap-3 rounded-[26px] border border-line-strong bg-panel p-5 shadow-[var(--shadow-panel)]"
      >
        <h3 id="exp-faturado" className="text-sm font-semibold text-t3">
          Faturado em {ano}
        </h3>
        <ValorMoeda centavos={faturadoCentavos} tamanho="hero" contar={!estatico} />
        <p className="text-[15px] text-t2">
          de <ValorMoeda centavos={limiteCentavos} tamanho="sm" className="font-semibold" /> · limite do MEI
        </p>
        <FioDoLimite
          nivel={nivelExemplo(faturadoCentavos)}
          faturadoCentavos={faturadoCentavos}
          limiteCentavos={limiteCentavos}
          animar={!estatico}
        />
      </section>
      <section aria-labelledby="exp-das" className="flex items-center justify-between gap-3 rounded-[20px] border border-line bg-card-solid px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h3 id="exp-das" className="text-base font-bold">
            Próximo DAS
          </h3>
          <p className="text-sm text-t2">Vence em {das.vencimento}</p>
        </div>
        <ValorMoeda centavos={das.valorCentavos} tamanho="lg" />
      </section>
    </>
  );
}

function Etapas({ estado, despachar }: { estado: EstadoSimulacao; despachar: (a: AcaoSimulacao) => void }) {
  const { etapa } = estado;
  if (etapa === "painel") {
    return (
      <div className="flex flex-col gap-2">
        {/* autoFocus só tem efeito ao voltar do "Recomeçar": na abertura o <dialog> ainda está fechado quando
            o React foca, e o showModal() segue focando o primeiro controle (o Fechar). */}
        <button type="button" autoFocus onClick={() => despachar("escrever")} className={`${BTN} lp-btn-branco`}>
          Escrever
        </button>
        <p className="text-center text-sm text-t3">Anote uma venda por texto, como no app.</p>
      </div>
    );
  }

  if (etapa === "escrever" || etapa === "lendo") {
    const lendo = etapa === "lendo";
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor="exp-texto" className="text-sm font-semibold text-t2">
          O que aconteceu?
        </label>
        <textarea
          id="exp-texto"
          readOnly
          autoFocus
          rows={2}
          value={TEXTO_EXEMPLO}
          aria-describedby="exp-texto-dica"
          className="resize-none rounded-2xl border border-line-strong bg-s2 px-4 py-3 text-base text-t1"
        />
        <p id="exp-texto-dica" className="text-sm text-t3">
          Texto de exemplo, fixo nesta simulação.
        </p>
        <button
          type="button"
          aria-disabled={lendo}
          onClick={() => despachar("enviar")}
          className={`${BTN} lp-btn-branco aria-disabled:opacity-60`}
        >
          {lendo ? "Lendo…" : "Enviar"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Rascunho confirmado={etapa === "confirmado"} />
      {etapa === "rascunho" ? (
        <button type="button" autoFocus onClick={() => despachar("confirmar")} className={`${BTN} lp-btn-branco`}>
          Confirmar lançamento
        </button>
      ) : (
        <>
          <p className="text-center text-[15px] font-semibold text-ok">Pronto: o valor entrou no faturado acima.</p>
          <button type="button" autoFocus onClick={() => despachar("recomecar")} className={`${BTN} lp-btn-vidro`}>
            Recomeçar
          </button>
        </>
      )}
    </div>
  );
}

function Rascunho({ confirmado }: { confirmado: boolean }) {
  const r = RASCUNHO_FAKE;
  const linha = "flex items-baseline justify-between gap-3 py-1.5";
  return (
    <section aria-labelledby="exp-rascunho" className="flex flex-col gap-2 rounded-[20px] border border-line bg-card-solid p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 id="exp-rascunho" className="text-base font-bold">
          {confirmado ? "Lançamento confirmado" : "Rascunho da IA"}
        </h3>
        <span className="rounded-full bg-s3 px-3 py-1 text-sm font-semibold text-t2">
          {confirmado ? "simulado" : "não salvo"}
        </span>
      </div>
      <dl className="flex flex-col divide-y divide-line">
        <div className={linha}>
          <dt className="text-[15px] text-t2">Receita</dt>
          <dd>
            <ValorMoeda centavos={r.valorCentavos} sinal="entrada" tamanho="md" />
          </dd>
        </div>
        <div className={linha}>
          <dt className="text-[15px] text-t2">Descrição</dt>
          <dd className="text-[15px] font-semibold">{r.descricao}</dd>
        </div>
        <div className={linha}>
          <dt className="text-[15px] text-t2">Cliente</dt>
          <dd className="text-[15px] font-semibold">{r.contraparte}</dd>
        </div>
        <div className={linha}>
          <dt className="text-[15px] text-t2">Categoria</dt>
          <dd className="text-[15px] font-semibold">{ROTULO_CATEGORIA[r.categoria]}</dd>
        </div>
        <div className={linha}>
          <dt className="text-[15px] text-t2">Data</dt>
          <dd className="text-[15px] font-semibold">{r.data}</dd>
        </div>
      </dl>
    </section>
  );
}
