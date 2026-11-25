"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { confirmarLancamento } from "@/actions/lancamentos";
import { BOTAO } from "@/components/botao";
import { ROTULO_CATEGORIA } from "@/components/categoria";
import { formatarSemSimbolo } from "@/components/moeda";
import { criarTrava, desfechoDaConfirmacao, MSG_AMBIGUA } from "./confirmacao";
import { RODAPE_FLUXO, useFluxo } from "@/app/(app)/fluxo-lancamento";
import {
  centavosDigitados,
  formDataDoLote,
  formularioDoRascunho,
  formularioManual,
  ORDEM_CATEGORIAS,
  validar,
  validarLote,
  type Erros,
  type Formulario,
} from "./formulario";

interface ConferirProps {
  manual: boolean;
  hoje: string;
}

/** /conferir nos modos IA e manual (04 § /conferir). Edição continua no diálogo de /lancamentos. */
export function Conferir({ manual, hoje }: ConferirProps) {
  const router = useRouter();
  const [{ rascunhos }, despachar] = useFluxo();
  // cópia local: limpar o estado do fluxo ao concluir não pode esvaziar a tela antes da navegação
  const [forms, setForms] = useState<Formulario[] | null>(() =>
    manual ? [formularioManual(hoje)] : (rascunhos?.map(formularioDoRascunho) ?? null),
  );
  const [indice, setIndice] = useState(0);
  const [erros, setErros] = useState<Erros>({});
  const [falha, setFalha] = useState<{ mensagem: string; ambigua: boolean } | null>(null);
  const [pendente, setPendente] = useState(false);
  const [tentativa, setTentativa] = useState(0); // só a confirmação recusada move o foco, não cada tecla
  const trava = useRef(criarTrava());
  const formulario = useRef<HTMLFormElement>(null);

  // refresh apaga a memória do cliente: sem rascunho não há o que conferir
  useEffect(() => {
    if (!forms) router.replace("/adicionar");
  }, [forms, router]);

  useEffect(() => {
    formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [tentativa]);

  if (!forms) return null;
  const atual = forms[indice];
  const total = forms.length;
  const ultimo = indice === total - 1;

  function mudar(parcial: Partial<Formulario>, limpa?: keyof Erros) {
    setForms((fs) => fs && fs.map((f, i) => (i === indice ? { ...f, ...parcial } : f)));
    if (limpa && erros[limpa]) setErros((e) => ({ ...e, [limpa]: undefined }));
  }

  function recusar(e: Erros) {
    setErros(e);
    setTentativa((t) => t + 1);
  }

  function irPara(i: number) {
    setIndice(i);
    setErros({});
    window.scrollTo({ top: 0 });
  }

  function descartar() {
    despachar({ tipo: "concluir", aviso: manual ? null : { titulo: "Rascunho descartado", sub: "Nada foi salvo" } });
    router.push("/painel");
  }

  function aoConfirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!forms) return;
    const v = validar(atual, hoje);
    if (!v.ok) return recusar(v.erros);
    if (!ultimo) return irPara(indice + 1);
    const lote = validarLote(forms, hoje);
    if (!lote.ok) {
      setIndice(lote.indice);
      return recusar(lote.erros);
    }

    if (!trava.current.pegar()) return; // um envio por vez, mesmo com clique duplo
    setPendente(true);
    setFalha(null);
    startTransition(async () => {
      let desfecho = desfechoDaConfirmacao("excecao");
      try {
        desfecho = desfechoDaConfirmacao(await confirmarLancamento(formDataDoLote(lote.lancamentos)));
      } catch {
        // mantém "ambiguo": a resposta pode ter se perdido depois de gravar
      }
      if (desfecho.tipo === "salvo") {
        // a trava não solta: a tela está saindo e um segundo toque não pode regravar
        const n = desfecho.quantidade;
        despachar({ tipo: "concluir", aviso: { titulo: n > 1 ? `${n} lançamentos salvos` : "Lançamento salvo" } });
        router.push("/painel");
        return;
      }
      // sem nova tentativa automática; o rascunho fica na tela
      setFalha(desfecho.tipo === "ambiguo" ? { mensagem: MSG_AMBIGUA, ambigua: true } : { mensagem: desfecho.mensagem, ambigua: false });
      trava.current.soltar();
      setPendente(false);
    });
  }

  const titulo = manual ? "Novo lançamento" : "Conferir rascunho";
  const rotuloConfirmar = !ultimo ? "Próximo rascunho" : total > 1 ? `Confirmar ${total} lançamentos` : "Confirmar lançamento";

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
      <form ref={formulario} noValidate onSubmit={aoConfirmar} aria-busy={pendente} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-5 px-5 pt-[18px] pb-6">
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Link href="/painel" aria-label="Voltar ao painel" className="-ml-2 grid size-11 place-items-center rounded-xl text-t1 hover:bg-s2">
                <ChevronLeft aria-hidden="true" size={26} />
              </Link>
              <h1 className="num text-[26px] font-extrabold tracking-[-0.02em]">{titulo}</h1>
            </div>
            {total > 1 && (
              <div className="flex items-center justify-between gap-2">
                <p className="num text-sm font-semibold text-t3" aria-live="polite">
                  Rascunho {indice + 1} de {total}
                </p>
                {indice > 0 && (
                  <button type="button" onClick={() => irPara(indice - 1)} className={`${BOTAO.fantasma} h-11 px-3`}>
                    Anterior
                  </button>
                )}
              </div>
            )}
          </header>

          <CampoValor
            centavos={atual.valorCentavos}
            duvidoso={atual.valorDuvidoso}
            erro={erros.valor}
            onChange={(c) => mudar({ valorCentavos: c, valorDuvidoso: false }, "valor")}
          />

          <Rotulado id="descricao" rotulo="Descrição" erro={erros.descricao}>
            <input
              id="descricao"
              value={atual.descricao}
              maxLength={200}
              placeholder="Ex.: Corte · Maria"
              onChange={(e) => mudar({ descricao: e.target.value }, "descricao")}
              {...aria("descricao", erros.descricao)}
              className={`h-[52px] rounded-[14px] border px-4 text-base font-medium text-t1 placeholder:text-t3 ${estado(erros.descricao, false)}`}
            />
          </Rotulado>

          <div className="grid grid-cols-2 gap-3">
            <Rotulado id="data" rotulo={atual.dataDuvidosa ? "Data · confira" : "Data"} erro={erros.data} duvidoso={atual.dataDuvidosa}>
              <input
                id="data"
                type="date"
                max={hoje}
                value={atual.data}
                onChange={(e) => mudar({ data: e.target.value, dataDuvidosa: false }, "data")}
                {...aria("data", erros.data)}
                className={`num h-[52px] w-full min-w-0 rounded-[14px] border px-3 text-base font-semibold text-t1 [color-scheme:dark] ${estado(erros.data, atual.dataDuvidosa)}`}
              />
            </Rotulado>
            <fieldset className="flex min-w-0 flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-semibold text-t2">Tipo</legend>
              <div className="grid h-[52px] grid-cols-2 gap-1 rounded-[14px] bg-s2 p-1">
                {(["receita", "despesa"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    aria-pressed={atual.tipo === tipo}
                    onClick={() => mudar({ tipo })}
                    className="rounded-[10px] text-[15px] font-bold text-t3 transition-transform duration-150 active:scale-97 aria-pressed:bg-s3 aria-pressed:text-t1"
                  >
                    {tipo === "receita" ? "Entrada" : "Saída"}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {atual.dataDuvidosa && atual.data && (
            <div
              className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
              style={{ background: "color-mix(in oklch, var(--warn) 10%, var(--s1))", borderColor: "color-mix(in oklch, var(--warn) 50%, transparent)" }}
            >
              <p className="text-[15px] text-t1 text-pretty">A IA não teve certeza da data. Confira.</p>
              <button type="button" onClick={() => mudar({ dataDuvidosa: false })} className={`${BOTAO.secundario} h-11 shrink-0 px-3`}>
                Está certa
              </button>
            </div>
          )}

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-t2">Categoria</legend>
            <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
              {ORDEM_CATEGORIAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={atual.categoria === c}
                  onClick={() => mudar({ categoria: c })}
                  className="min-h-11 rounded-xl border border-line-strong bg-s2 px-2 py-2 text-[14px] leading-tight font-semibold text-t2 transition-transform duration-150 active:scale-97 aria-pressed:border-acc aria-pressed:bg-[var(--acc-a14)] aria-pressed:text-acc-ink"
                >
                  {ROTULO_CATEGORIA[c]}
                </button>
              ))}
            </div>
          </fieldset>

          {erros.geral && <p className="text-sm font-semibold text-err">{erros.geral}</p>}
        </div>

        <footer className={RODAPE_FLUXO}>
          <p className="text-sm text-t2 text-pretty">
            {manual ? "Preenchido por você. Salva quando confirmar." : "Nada foi salvo ainda. Só entra no fio quando você confirmar."}
          </p>
          {falha && (
            <p role="alert" className="text-[15px] font-semibold text-err text-pretty">
              {falha.mensagem}
              {falha.ambigua && (
                <>
                  {" "}
                  <Link href="/lancamentos" className="underline">
                    Abrir Lançamentos
                  </Link>
                </>
              )}
            </p>
          )}
          <div className="grid grid-cols-[1fr_1.5fr] gap-2">
            <button type="button" onClick={descartar} disabled={pendente} className={`${BOTAO.fantasma} px-2 disabled:text-t3`}>
              {manual ? "Cancelar" : "Descartar rascunho"}
            </button>
            <button type="submit" aria-disabled={pendente} className={`${BOTAO.primario} px-2 aria-disabled:opacity-70`}>
              {pendente && (
                <span aria-hidden="true" className="size-4 rounded-full border-2 border-current border-r-transparent" style={{ animation: "cc-spin .8s linear infinite" }} />
              )}
              {pendente ? "Salvando" : rotuloConfirmar}
            </button>
          </div>
        </footer>
      </form>
    </main>
  );
}

const aria = (id: string, erro?: string) => ({
  "aria-invalid": erro ? true : undefined,
  "aria-describedby": erro ? `${id}-erro` : undefined,
});

/** Estados de campo do 03: padrão, foco (halo), erro e dúvida da IA (âmbar). */
function estado(erro: string | undefined, duvidoso: boolean): string {
  const halo = "focus-within:shadow-[0_0_0_4px_var(--ring-halo)] focus:outline-none";
  if (erro) return `${halo} border-err bg-[color-mix(in_oklch,var(--err)_8%,var(--s2))]`;
  if (duvidoso) return `${halo} focus-within:border-ring border-warn bg-[color-mix(in_oklch,var(--warn)_10%,var(--s2))]`;
  return `${halo} focus-within:border-ring border-line-strong bg-s2`;
}

function Rotulado({ id, rotulo, erro, duvidoso = false, children }: { id: string; rotulo: string; erro?: string; duvidoso?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={`text-sm font-semibold ${duvidoso ? "text-warn" : "text-t2"}`}>
        {rotulo}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} className="text-sm font-semibold text-err">
          {erro}
        </p>
      )}
    </div>
  );
}

/** InputMoeda lg (03): "centavos entram primeiro", R$ fixo à esquerda. 0 aparece vazio. */
function CampoValor({ centavos, duvidoso, erro, onChange }: { centavos: number; duvidoso: boolean; erro?: string; onChange: (c: number) => void }) {
  return (
    <Rotulado id="valor" rotulo={duvidoso ? "Valor · confira" : "Valor"} erro={erro} duvidoso={duvidoso}>
      <div className={`flex h-16 items-center gap-2 rounded-2xl border px-4 ${estado(erro, duvidoso)}`}>
        <span aria-hidden="true" className="num text-xl font-bold text-t3">
          R$
        </span>
        <input
          id="valor"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0,00"
          value={centavos ? formatarSemSimbolo(centavos) : ""}
          onChange={(e) => onChange(centavosDigitados(e.target.value))}
          {...aria("valor", erro)}
          className="num w-full min-w-0 bg-transparent text-[28px] font-extrabold text-t1 tabular-nums placeholder:text-t3 focus:outline-none"
        />
      </div>
    </Rotulado>
  );
}
