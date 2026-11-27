"use client";

import Link from "next/link";
import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { BOTAO } from "@/components/botao";
import { ChipFonte, fonteValida } from "@/components/chip-fonte";
import { AvisoIaDemo, ehRecusaSomenteDemo, SaidasIaSomenteDemo } from "@/components/demo/ia-demo";
import type { ChatResponse } from "@/lib/contracts";
import { TEXTO_IA_DEMO_MAX } from "@/lib/security/demo";
import { enviarPergunta } from "./requisicao";

const SUGESTOES = ["Quando vence o DAS?", "Qual o limite do MEI em 2027?", "Posso contratar empregado?"];
const LIMITE_PERGUNTA = 1000;
type Troca = { pergunta: string; retorno: ChatResponse };
type Falha = { mensagem: string; status?: number };

export function JanelaChat({ children }: { children: ReactNode }) {
  const janela = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    function ajustar() {
      const visivel = viewport?.scale === 1 ? viewport : null;
      const altura = Math.round(visivel?.height ?? window.innerHeight);
      const base = Math.max(0, window.innerHeight - altura - (visivel?.offsetTop ?? 0));
      janela.current?.style.setProperty("--chat-altura", `${altura}px`);
      janela.current?.style.setProperty("--chat-base", `${base}px`);
      janela.current?.setAttribute("data-compacto", String(altura < 540));
    }
    ajustar();
    viewport?.addEventListener("resize", ajustar);
    viewport?.addEventListener("scroll", ajustar);
    window.addEventListener("resize", ajustar);
    return () => {
      viewport?.removeEventListener("resize", ajustar);
      viewport?.removeEventListener("scroll", ajustar);
      window.removeEventListener("resize", ajustar);
    };
  }, []);
  return <div ref={janela} className="group/chat flex h-[var(--chat-altura,100dvh)] flex-col overflow-hidden bg-bg text-t1">{children}</div>;
}

function Fontes({ fontes }: { fontes: ChatResponse["fontes"] }) {
  if (!fontes.length) return null;
  return (
    <div className="mt-4 border-t border-line pt-3">
      <p className="mb-2 text-sm font-semibold text-t2">Fontes jurídicas</p>
      <ul className="grid gap-2">
        {fontes.map(({ arquivo, titulo, url, verificadoEm }) => {
          const data = verificadoEm.split("-").reverse().join("/");
          return (
            <li key={arquivo} className="min-w-0 space-y-1 [overflow-wrap:anywhere] [&>button]:h-auto [&>button]:min-h-11 [&>button]:max-w-full [&>button]:py-2 [&>button]:text-left [&>dialog]:bottom-[var(--chat-base,0px)] [&>dialog]:max-h-[var(--chat-altura,100dvh)] [&>dialog]:overflow-y-auto">
              {url && fonteValida(url, verificadoEm) ?
                <ChipFonte rotulo={titulo} resumo="Consulte a publicação oficial que fundamenta esta resposta." url={url} consultadoEm={verificadoEm} /> :
                <span className="text-sm">{titulo}</span>}
              <p className="text-xs text-t3">Verificada em <time dateTime={verificadoEm}>{data}</time></p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Conversa({ demo }: { demo: boolean }) {
  const [historico, setHistorico] = useState<Troca[]>([]);
  const [rascunho, setRascunho] = useState("");
  const [pendente, setPendente] = useState<string | null>(null);
  const [falha, setFalha] = useState<Falha | null>(null);
  const chamada = useRef<AbortController | null>(null);
  const conversa = useRef<HTMLElement>(null);
  const seguirFim = useRef(true);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => () => chamada.current?.abort(), []);
  useLayoutEffect(() => {
    const area = conversa.current;
    if (area && seguirFim.current) area.scrollTop = area.scrollHeight;
  }, [pendente, historico.length, falha]);
  useEffect(() => {
    const area = conversa.current;
    if (!area) return;
    const observador = new ResizeObserver(() => {
      if (seguirFim.current) area.scrollTop = area.scrollHeight;
    });
    observador.observe(area);
    return () => observador.disconnect();
  }, []);

  async function enviar(pergunta: string) {
    const texto = pergunta.trim();
    if (!texto || chamada.current) return;
    const controle = new AbortController();
    chamada.current = controle;
    seguirFim.current = true;
    setRascunho(texto);
    setFalha(null);
    setPendente(texto);
    try {
      const retorno = await enviarPergunta(texto, historico.map((troca) => troca.pergunta), controle.signal);
      if (controle.signal.aborted) return;
      if (retorno.ok) {
        setHistorico((atual) => [...atual, { pergunta: texto, retorno: retorno.dados }]);
        setRascunho("");
      } else {
        setFalha(retorno);
      }
    } finally {
      chamada.current = null;
      if (!controle.signal.aborted) setPendente(null);
    }
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void enviar(rascunho);
  }

  return (
    <>
      <section ref={conversa} aria-label="Conversa com o assistente" tabIndex={0}
        onScroll={(evento) => {
          const { scrollTop, scrollHeight, clientHeight } = evento.currentTarget;
          seguirFim.current = scrollHeight - clientHeight - scrollTop <= 48;
        }}
        className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-2">
        {/* Saudação fixa, sem chamar a IA. */}
        <article className="rounded-2xl border border-line bg-s1 p-4 sm:p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-acc-ink">
            <Sparkles size={15} aria-hidden="true" /> Assistente
          </h2>
          <p className="leading-relaxed">Olá! Tiro dúvidas sobre o MEI com base em fontes oficiais e nos números do seu painel. Experimente uma destas perguntas:</p>
          {historico.length === 0 && !pendente && (
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGESTOES.map((sugestao) => (
                <button key={sugestao} type="button" onClick={() => void enviar(sugestao)}
                  className="min-h-11 rounded-lg border border-line-strong bg-s2 px-3 text-left text-sm font-semibold text-acc-ink hover:bg-s3">
                  {sugestao}
                </button>
              ))}
            </div>
          )}
        </article>
        <div role="log" aria-label="Mensagens" aria-relevant="additions" className="space-y-5">
          {historico.map(({ pergunta, retorno }, i) => (
            <div key={i} className="space-y-3">
              <Pergunta texto={pergunta} />
              <article className="rounded-2xl border border-line bg-s1 p-4 sm:p-5">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-acc-ink">
                  <Sparkles size={15} aria-hidden="true" /> Assistente
                </h2>
                <p className="leading-relaxed wrap-anywhere whitespace-pre-wrap">{retorno.resposta}</p>
                <Fontes fontes={retorno.fontes} />
              </article>
            </div>
          ))}
          {pendente && <Pergunta texto={pendente} />}
        </div>
        {falha && <FalhaChat falha={falha} podeTentar={!!rascunho.trim()} onTentar={() => void enviar(rascunho)} />}
      </section>
      <form ref={form} onSubmit={aoEnviar} className="shrink-0 border-t border-line bg-bg pt-2">
        <p role="status" className={pendente ? "mb-2 text-sm font-medium text-acc-ink" : "sr-only"}>
          {pendente ? "Preparando a resposta…" : ""}
        </p>
        <label htmlFor="pergunta-chat" className="mb-2 block text-sm font-semibold group-data-[compacto=true]/chat:sr-only">Sua pergunta</label>
        {demo && <div className="mb-2 group-data-[compacto=true]/chat:mb-1.5 group-data-[compacto=true]/chat:[&>p]:py-1.5 group-data-[compacto=true]/chat:[&>p]:text-xs"><AvisoIaDemo demo id="aviso-ia-demo" /></div>}
        <div className="flex items-end gap-2">
          <textarea id="pergunta-chat" value={rascunho} maxLength={demo ? TEXTO_IA_DEMO_MAX : LIMITE_PERGUNTA} rows={2}
            aria-describedby={demo ? "aviso-ia-demo" : undefined}
            placeholder="Escreva sua dúvida" readOnly={pendente !== null}
            onChange={(evento) => setRascunho(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key === "Enter" && !evento.shiftKey && !evento.nativeEvent.isComposing) {
                evento.preventDefault();
                form.current?.requestSubmit();
              }
            }}
            className="min-h-[52px] min-w-0 flex-1 resize-none rounded-xl border border-line-strong bg-s2 px-3 py-3 text-base text-t1 placeholder:text-t3 group-data-[compacto=true]/chat:h-[52px]" />
          <button type="submit" aria-label="Enviar pergunta" disabled={!rascunho.trim() || pendente !== null}
            className="grid size-[52px] shrink-0 place-items-center rounded-xl bg-acc text-on-acc hover:brightness-110 disabled:bg-s3 disabled:text-t3">
            <ArrowUp size={24} aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-xs text-t3 group-data-[compacto=true]/chat:mt-1 group-data-[compacto=true]/chat:leading-4">A IA pode cometer erros. Confira informações importantes na fonte ou com um contador.</p>
      </form>
    </>
  );
}

/** Falha do chat. A recusa "IA só na demo" mostra a mensagem do servidor e o caminho para a demo. */
export function FalhaChat({ falha, podeTentar, onTentar }: { falha: Falha; podeTentar: boolean; onTentar: () => void }) {
  const somenteDemo = ehRecusaSomenteDemo(falha);
  return (
    <div className="rounded-xl border border-line-strong bg-s2 p-4">
      <p role="alert" className="text-sm font-medium text-t1">{falha.mensagem}</p>
      {falha.status === 403 && !somenteDemo && <p className="mt-1 text-sm text-t2">Confira seu acesso à demo e o consentimento para uso da IA.</p>}
      {falha.status !== 401 && falha.status !== 403 && (
        <p className="mt-1 text-sm text-t2">Se precisar registrar uma receita ou despesa, volte ao painel para continuar pelo fluxo de lançamentos.</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {somenteDemo ? <SaidasIaSomenteDemo /> :
          falha.status === 401 ? <Link href="/entrar?next=%2Fchat" className={BOTAO.fantasma}>Entrar novamente</Link> :
            falha.status === 403 ? <Link href="/consentimento" className={BOTAO.fantasma}>Conferir consentimento</Link> :
              <button type="button" onClick={onTentar} disabled={!podeTentar} className={BOTAO.fantasma}>Tentar novamente</button>}
        <Link href="/painel" className={BOTAO.fantasma}>Continuar no painel</Link>
      </div>
    </div>
  );
}

function Pergunta({ texto }: { texto: string }) {
  return (
    <div className="ml-auto max-w-[85%] rounded-2xl border border-line-strong bg-s2 px-4 py-3 wrap-anywhere">
      <p className="text-xs font-semibold text-t3">Você</p>
      <p className="mt-1 whitespace-pre-wrap">{texto}</p>
    </div>
  );
}
