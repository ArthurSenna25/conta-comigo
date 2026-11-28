"use client";

import { Camera, Check, Image as ImagemIcone, Mic, PenLine, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BOTAO } from "@/components/botao";
import { AvisoIaDemo, ehRecusaSomenteDemo, SaidasIaSomenteDemo } from "@/components/demo/ia-demo";
import { EstadoErro } from "@/components/estado-erro";
import { TEXTO_IA_DEMO_MAX } from "@/lib/security/demo";
import { RODAPE_FLUXO, useFluxo } from "@/app/(app)/fluxo-lancamento";
import { mensagemSemResposta, podeEnviarTexto, resultadoDaLeitura, TEMPO_MAX_LEITURA_MS } from "./leitura";

const MANUAL = "/conferir?modo=manual";
const TEXTO_MAX = 2000; // IngestRequest

type Falha = { status?: number; mensagem: string };
type Etapa = { tipo: "escrever"; falha?: Falha } | { tipo: "lendo" } | { tipo: "erro"; codigo: "503" | "429" };

/** /adicionar só com texto (04 § /adicionar e § Estado Lendo). Foto, áudio e print entram em outra etapa. */
export function Adicionar({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [, despachar] = useFluxo();
  const [texto, setTexto] = useState("");
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "escrever" });
  const [colouLongo, setColouLongo] = useState(false);
  const campo = useRef<HTMLTextAreaElement>(null);
  const leitura = useRef<AbortController | null>(null);

  // saiu da tela no meio da leitura: a resposta não pode mais navegar por cima do usuário
  useEffect(() => () => leitura.current?.abort(), []);

  async function enviar() {
    if (!podeEnviarTexto(texto) || leitura.current) return;
    const controle = new AbortController();
    leitura.current = controle;
    setEtapa({ tipo: "lendo" });
    const fd = new FormData();
    fd.set("kind", "texto");
    fd.set("texto", texto.trim());
    let estourou = false;
    const prazo = setTimeout(() => {
      estourou = true;
      controle.abort();
    }, TEMPO_MAX_LEITURA_MS);
    try {
      const resposta = await fetch("/api/ingest", { method: "POST", body: fd, signal: controle.signal });
      const corpo: unknown = await resposta.json().catch(() => null);
      if (estourou) throw new Error("tempo"); // o corpo não chegou a tempo: cai na mensagem de demora
      if (controle.signal.aborted) return;
      const r = resultadoDaLeitura(resposta.status, corpo);
      if (r.tipo === "rascunhos") {
        despachar({ tipo: "guardar", rascunhos: r.rascunhos });
        router.push("/conferir");
      } else if (r.tipo === "erro") {
        setEtapa({ tipo: "erro", codigo: r.codigo });
      } else {
        setEtapa({ tipo: "escrever", falha: { status: r.status, mensagem: r.mensagem } });
      }
    } catch {
      if (estourou || !controle.signal.aborted) {
        setEtapa({ tipo: "escrever", falha: { mensagem: mensagemSemResposta(estourou) } });
      }
    } finally {
      clearTimeout(prazo);
      if (leitura.current === controle) leitura.current = null;
    }
  }

  function preencherNaMao() {
    leitura.current?.abort();
    leitura.current = null;
    router.push(MANUAL);
  }

  if (etapa.tipo === "lendo") return <Lendo onManual={preencherNaMao} />;
  if (etapa.tipo === "erro") {
    return (
      <main className="mx-auto w-full max-w-[480px] px-5 pt-[18px] pb-10">
        {etapa.codigo === "503" ? (
          <EstadoErro tipo="503" hrefManual={MANUAL} onTentarDeNovo={() => void enviar()} garantia="O que você escreveu continua aqui" />
        ) : (
          <EstadoErro tipo="429" hrefManual={MANUAL} />
        )}
      </main>
    );
  }

  const liberado = podeEnviarTexto(texto);
  const limite = demo ? TEXTO_IA_DEMO_MAX : TEXTO_MAX;
  const encurtado = colouLongo && texto.length >= limite;
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-5 px-5 pt-[18px] pb-6">
        <header className="flex flex-col gap-2">
          <h1 className="num text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] text-balance">O que entrou ou saiu?</h1>
          <p className="text-base text-t2 text-pretty">Mande do jeito mais fácil. A IA monta um rascunho e você confere.</p>
        </header>

        <div className="grid grid-cols-4 gap-2">
          <OpcaoEmBreve rotulo="Foto" Icone={Camera} />
          <OpcaoEmBreve rotulo="Áudio" Icone={Mic} />
          <OpcaoEmBreve rotulo="Print" Icone={ImagemIcone} />
          <button type="button" onClick={() => campo.current?.focus()} className={`${OPCAO} text-t1 active:scale-97`}>
            <PenLine aria-hidden="true" size={30} className="text-acc-ink" />
            Escrever
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="texto-adicionar" className="text-sm font-semibold text-t2">
            Ou escreva do seu jeito
          </label>
          <textarea
            ref={campo}
            id="texto-adicionar"
            rows={3}
            maxLength={limite}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onPaste={(e) => {
              const { selectionStart, selectionEnd } = e.currentTarget;
              const livre = limite - (texto.length - (selectionEnd - selectionStart));
              setColouLongo(e.clipboardData.getData("text").length > livre);
            }}
            placeholder="recebi 120 do corte da Maria hoje"
            aria-describedby={[demo && "aviso-ia-demo", etapa.falha && "falha-adicionar"].filter(Boolean).join(" ") || undefined}
            className="resize-none rounded-2xl border border-line-strong bg-s2 px-4 py-3 text-[17px] leading-[1.45] text-t1 placeholder:text-t3 focus:border-ring focus:shadow-[0_0_0_4px_var(--ring-halo)] focus:outline-none"
          />
          {encurtado && (
            <p role="status" className="text-sm text-t2">
              O texto passou do limite e foi encurtado para {limite} caracteres. Confira se o final ficou de fora.
            </p>
          )}
          <AvisoIaDemo demo={demo} id="aviso-ia-demo" />
        </div>

        {etapa.falha && <AvisoFalha falha={etapa.falha} onTentar={() => void enviar()} podeTentar={liberado} />}

        <p className="flex items-start gap-3 rounded-2xl border border-line bg-card-solid px-4 py-3 text-[15px] text-t2 text-pretty">
          <FioMini />
          A IA só rascunha. Quem calcula limite e DAS é o app, e nada entra sem você confirmar.
        </p>
      </div>

      <footer className={RODAPE_FLUXO}>
        <button
          type="button"
          disabled={!liberado}
          onClick={() => void enviar()}
          className={`${BOTAO.primario} h-14 w-full rounded-2xl text-[17px] disabled:cursor-not-allowed disabled:bg-s3 disabled:text-t3 disabled:brightness-100 disabled:active:scale-100`}
        >
          Enviar para a IA
        </button>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/painel" className={`${BOTAO.fantasma} text-t2`}>
            Cancelar
          </Link>
          <Link href={MANUAL} className={BOTAO.fantasma}>
            Preencher na mão
          </Link>
        </div>
      </footer>
    </main>
  );
}

const OPCAO =
  "relative flex aspect-[.82] flex-col items-center justify-center gap-2 rounded-[20px] border border-line-strong bg-card-solid " +
  "text-[15px] font-semibold transition-transform duration-150 ease-[var(--ease-cc)]";

/** Foto, Áudio e Print: desligados nesta etapa (sem lógica), com o mesmo selo da tab bar. */
function OpcaoEmBreve({ rotulo, Icone }: { rotulo: string; Icone: LucideIcon }) {
  return (
    <button type="button" disabled className={`${OPCAO} cursor-not-allowed text-t3`}>
      <Icone aria-hidden="true" size={30} className="opacity-60" />
      <span className="opacity-60">{rotulo}</span>
      <span className="absolute -top-2.5 rounded-full border border-line-strong bg-s3 px-1.5 text-[11px] leading-4 font-bold whitespace-nowrap text-t2">
        <span className="sr-only">, </span>em breve
      </span>
    </button>
  );
}

/** Falha que não é 429/503: mensagem da rota e o caminho que resolve. "Preencher na mão" fica no rodapé. */
export function AvisoFalha({ falha, onTentar, podeTentar }: { falha: Falha; onTentar: () => void; podeTentar: boolean }) {
  return (
    <div
      id="falha-adicionar"
      role="alert"
      className="flex flex-col gap-2 rounded-2xl border px-4 py-3"
      style={{ background: "color-mix(in oklch, var(--err) 10%, var(--s1))", borderColor: "color-mix(in oklch, var(--err) 50%, transparent)" }}
    >
      <p className="text-[15px] font-semibold text-t1 text-pretty">{falha.mensagem}</p>
      {ehRecusaSomenteDemo(falha) ? (
        <SaidasIaSomenteDemo hrefManual={MANUAL} />
      ) : falha.status === 401 ? (
        <Link href="/entrar?next=%2Fadicionar" className={`${BOTAO.fantasma} self-start`}>
          Entrar novamente
        </Link>
      ) : falha.status === 403 ? (
        <>
          <p className="text-sm text-t2">Confira o consentimento para uso da IA.</p>
          <Link href="/consentimento" className={`${BOTAO.fantasma} self-start`}>
            Conferir consentimento
          </Link>
        </>
      ) : (
        <button type="button" onClick={onTentar} disabled={!podeTentar} className={`${BOTAO.fantasma} self-start disabled:text-t3`}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

/** Estado Lendo (04): o tempo é o real da resposta, sem atraso simulado. */
function Lendo({ onManual }: { onManual: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-6 px-5 pt-[18px] pb-10" aria-busy="true">
      <header role="status" className="flex flex-col gap-2">
        <h1 className="num text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em]">Lendo o que você escreveu…</h1>
        <p className="text-base text-t2">Isso leva poucos segundos. Nada foi salvo ainda.</p>
      </header>
      <div aria-hidden="true" className="relative flex flex-col gap-3 overflow-hidden rounded-[20px] border border-line bg-card-solid p-5">
        <span className="block h-3.5 w-2/5 rounded-md bg-s3" />
        <span className="block h-10 w-3/4 rounded-md bg-s3" />
        <span className="block h-3.5 w-1/2 rounded-md bg-s3" />
        <span
          className="absolute inset-y-0 left-0 w-2/5 bg-[linear-gradient(90deg,transparent,oklch(0.97_0.02_255/0.08),transparent)]"
          style={{ animation: "cc-scan 1.6s ease-in-out infinite" }}
        />
      </div>
      <ul className="flex flex-col gap-3 text-[15px]">
        <li className="flex items-center gap-3 text-t1">
          <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-ok text-on-ok">
            <Check size={14} strokeWidth={3} />
          </span>
          Recebido
        </li>
        <li className="flex items-center gap-3 text-t1">
          <span aria-hidden="true" className="size-6 rounded-full border-2 border-acc border-r-transparent" style={{ animation: "cc-spin .8s linear infinite" }} />
          Procurando valor, data e tipo
        </li>
        <li className="flex items-center gap-3 text-t3">
          <span aria-hidden="true" className="size-6 rounded-full border-2 border-dashed border-line-strong" />
          Montando o rascunho para você conferir
        </li>
      </ul>
      <button type="button" onClick={onManual} className={`${BOTAO.fantasma} self-start`}>
        Prefiro preencher na mão
      </button>
    </main>
  );
}

/** Fio mini decorativo da nota (sem número: aqui não há faturamento para mostrar). */
function FioMini() {
  return (
    <svg aria-hidden="true" viewBox="0 0 44 12" className="mt-1.5 h-3 w-11 shrink-0">
      <line x1={0} y1={6} x2={44} y2={6} strokeWidth={2} strokeLinecap="round" style={{ stroke: "var(--track)" }} />
      <line x1={0} y1={6} x2={20} y2={6} strokeWidth={2} strokeLinecap="round" style={{ stroke: "var(--ok)" }} />
      <circle cx={20} cy={6} r={3} style={{ fill: "var(--ok)" }} />
    </svg>
  );
}
