import { startTransition, useEffect, useRef, useState, type FormEvent } from "react";
import { editar, excluir } from "@/actions/lancamentos";
import { Aviso, Campo } from "@/components/auth/campos";
import { BOTAO } from "@/components/botao";
import { Centavos } from "@/lib/contracts/comum";
import type { Lancamento } from "@/lib/contracts/lancamento";
import { CATEGORIAS, centavosDoCampo, FORMAS_PAGAMENTO } from "@/app/(app)/lancamentos/dados";

type Props = {
  item: Lancamento;
  modo: "editar" | "excluir";
  hoje: string;
  fechar: () => void;
  concluir: (item: Lancamento | null) => void;
};

type Erro = { mensagem: string; campos?: Record<string, string> };
const BRL_SEM_SIMBOLO = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function GerenciarLancamento({ item, modo, hoje, fechar, concluir }: Props) {
  const modal = useRef<HTMLDialogElement>(null);
  const enviando = useRef(false);
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState<Erro | null>(null);
  const removendo = modo === "excluir";

  useEffect(() => {
    const dialogo = modal.current;
    dialogo?.showModal();
    return () => dialogo?.close();
  }, []);

  useEffect(() => {
    if (erro?.campos) modal.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [erro]);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando.current) return;
    const dados = new FormData(evento.currentTarget);
    const valor = Centavos.safeParse(centavosDoCampo(String(dados.get("valor") ?? "")));
    if (!removendo && !valor.success) {
      setErro({ mensagem: "Confira o valor e tente de novo.", campos: { valorCentavos: "Digite um valor válido, maior que zero." } });
      return;
    }

    enviando.current = true;
    setPendente(true);
    setErro(null);
    startTransition(async () => {
      try {
        const resposta = removendo ? await excluir(item.id) : await editar({
          id: item.id,
          lancamento: {
            tipo: dados.get("tipo"),
            data: dados.get("data"),
            valorCentavos: valor.data,
            categoria: dados.get("categoria"),
            descricao: dados.get("descricao"),
            contraparte: String(dados.get("contraparte") ?? "").trim() || null,
            formaPgto: dados.get("formaPgto") || null,
            origem: item.origem,
          },
        });
        if (resposta.ok) concluir(resposta.dados);
        else setErro(resposta.erro);
      } catch {
        setErro({ mensagem: "Não foi possível concluir agora. Tente novamente." });
      } finally {
        enviando.current = false;
        setPendente(false);
      }
    });
  }

  const erroCampo = (campo: string) => erro?.campos?.[`lancamento.${campo}`] ?? erro?.campos?.[campo];

  return (
    <dialog ref={modal} aria-labelledby="titulo-gerenciar" aria-describedby={removendo ? "aviso-excluir" : undefined}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2.5rem)] w-[calc(100%-2.5rem)] max-w-lg overflow-auto rounded-2xl border border-line-strong bg-s1 p-5 text-t1 backdrop:bg-[var(--scrim-modal)]"
      onCancel={(evento) => { evento.preventDefault(); if (!enviando.current) fechar(); }}>
      <h2 id="titulo-gerenciar" className="mb-4 text-xl font-bold">
        {removendo ? "Excluir lançamento?" : "Editar lançamento"}
      </h2>
      <form method="post" onSubmit={aoEnviar} aria-busy={pendente} className="grid gap-4">
        {removendo ? (
          <p id="aviso-excluir" className="text-t2 break-words">
            O lançamento <strong>“{item.descricao}”</strong> será excluído. Essa ação é permanente.
            {item.documentoId && " Se o comprovante estiver ligado apenas a este lançamento, ele também será apagado."}
          </p>
        ) : (
          <>
            <Campo id="edicao-valor" name="valor" rotulo="Valor (R$)" inputMode="decimal" required maxLength={17}
              defaultValue={BRL_SEM_SIMBOLO.format(item.valorCentavos / 100)} erro={erroCampo("valorCentavos")} />
            <Campo id="edicao-descricao" name="descricao" rotulo="Descrição" required maxLength={200}
              defaultValue={item.descricao} erro={erroCampo("descricao")} />
            <Campo id="edicao-data" name="data" rotulo="Data" type="date" required max={hoje}
              defaultValue={item.data} erro={erroCampo("data")} />
            <Selecao nome="tipo" rotulo="Tipo" valor={item.tipo} opcoes={{ receita: "Entrada", despesa: "Saída" }} erro={erroCampo("tipo")} />
            <Selecao nome="categoria" rotulo="Categoria" valor={item.categoria} opcoes={CATEGORIAS} erro={erroCampo("categoria")} />
            <Campo id="edicao-contraparte" name="contraparte" rotulo="Cliente ou fornecedor (opcional)" maxLength={120}
              defaultValue={item.contraparte ?? ""} erro={erroCampo("contraparte")} />
            <Selecao nome="formaPgto" rotulo="Forma de pagamento" valor={item.formaPgto ?? ""}
              opcoes={{ "": "Não informada", ...FORMAS_PAGAMENTO }} erro={erroCampo("formaPgto")} />
          </>
        )}
        {erro && <Aviso alerta>{erro.mensagem}</Aviso>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={`${BOTAO.secundario} px-2 disabled:opacity-60`} disabled={pendente} onClick={fechar}>Cancelar</button>
          <button type="submit" aria-disabled={pendente}
            className={`${removendo ? `${BOTAO.secundario} border-err/45 text-err` : BOTAO.primario} px-2 aria-disabled:opacity-60`}>
            {pendente ? "Aguarde…" : removendo ? "Excluir" : "Salvar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function Selecao({ nome, rotulo, valor, opcoes, erro }: {
  nome: string;
  rotulo: string;
  valor: string;
  opcoes: Record<string, string>;
  erro?: string;
}) {
  const id = `edicao-${nome}`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{rotulo}</label>
      <select id={id} name={nome} defaultValue={valor} aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className="h-12 rounded-lg border border-line-strong bg-s2 px-3 text-base focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-err">
        {Object.entries(opcoes).map(([chave, label]) => <option key={chave} value={chave}>{label}</option>)}
      </select>
      {erro && <p id={`${id}-erro`} className="text-sm text-err">{erro}</p>}
    </div>
  );
}
