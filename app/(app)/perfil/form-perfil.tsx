"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { atualizarPerfil } from "@/app/(app)/perfil/atualizar-perfil";
import { ROTULO_ATIVIDADE, type DadosEditaveis } from "@/app/(app)/perfil/dados-perfil";
import { enviarPerfilHidratado, iniciarEnvio } from "@/app/(app)/perfil/envio-perfil";
import { receitaParaCampo } from "@/app/(app)/perfil/receita-inicial";
import { ufs } from "@/app/onboarding/ufs";
import { Aviso, BotaoEnviar, Campo } from "@/components/auth/campos";
import { useFormularioAcao } from "@/components/auth/use-formulario-acao";
import { formatarCentavos } from "@/components/moeda";
import { VALOR_MAX_CENTAVOS } from "@/lib/contracts/comum";

export function FormPerfil({ dados, hoje }: { dados: DadosEditaveis; hoje: string }) {
  // O POST nativo continua apontando à Server Action. O envio hidratado captura falhas
  // de transporte no cliente, mantendo os controles montados para uma nova tentativa.
  const nativo = useFormularioAcao(atualizarPerfil);
  const salvosNativos = nativo.estado?.status === "sucesso" ? nativo.estado.dados : undefined;
  const [hidratado, despachar, pendenteHidratado] = useActionState(
    (anterior: Awaited<ReturnType<typeof enviarPerfilHidratado>> | null, formulario: FormData) =>
      enviarPerfilHidratado(atualizarPerfil, formulario, anterior?.salvos ?? salvosNativos),
    null,
  );
  const estado = hidratado ? hidratado.estado : nativo.estado;
  const pendente = pendenteHidratado || nativo.pendente;
  const formulario = useRef<HTMLFormElement>(null);
  const seletorUf = useRef<HTMLSelectElement>(null);
  const enviando = useRef(false);
  const erro = !pendente && estado?.status === "erro" ? estado.erro : null;
  const campos = erro?.campos;
  const sucesso = estado?.status === "sucesso";
  const salvos = hidratado?.salvos ?? salvosNativos ?? dados;
  const valores = estado?.status === "erro" && estado.rascunho
    ? estado.rascunho
    : { ...salvos, receitaInicialCentavos: receitaParaCampo(salvos.receitaInicialCentavos) };
  const opcoesUf = ufs.includes(salvos.uf) ? ufs : [...ufs, salvos.uf];

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    startTransition(() => {
      iniciarEnvio(enviando, pendente, () => {
        const dados = new FormData(evento.currentTarget);
        despachar(dados);
      });
    });
  }

  useEffect(() => {
    if (pendente) return;
    enviando.current = false;
    if (estado?.status !== "sucesso") return;
    formulario.current?.reset();
    // React aplica defaultValue de um select não controlado só na montagem.
    if (seletorUf.current) seletorUf.current.value = estado.dados.uf;
  }, [estado, pendente]);

  useEffect(() => {
    if (campos) formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalido]')?.focus();
  }, [campos]);

  return (
    <form
      ref={formulario}
      action={nativo.despachar}
      onSubmit={enviar}
      noValidate
      aria-busy={pendente}
      className="grid gap-5 rounded-2xl border border-line bg-s1 p-4 sm:p-6 [&_:is(input,select,button)]:scroll-mb-[calc(var(--abas-h)+16px)] [&_input:not([type=radio])]:min-w-0 [&_input:not([type=radio])]:w-full"
    >
      <fieldset disabled={pendente} className="grid min-w-0 gap-5">
        <legend className="sr-only">Dados do negócio</legend>
        <Campo
          id="nomeNegocio"
          name="nomeNegocio"
          rotulo="Nome do negócio"
          autoComplete="organization"
          defaultValue={valores.nomeNegocio}
          maxLength={80}
          required
          erro={campos?.nomeNegocio && "Informe o nome do negócio (até 80 caracteres)."}
        />

        <fieldset className="grid min-w-0 gap-2">
          <legend className="mb-1 text-sm font-medium">Atividade do MEI</legend>
          {Object.entries(ROTULO_ATIVIDADE).map(([valor, rotulo]) => (
            <label
              key={valor}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 has-checked:border-ring has-data-invalido:border-destructive has-focus-visible:ring-2 has-focus-visible:ring-ring"
            >
              <input
                type="radio"
                name="atividade"
                value={valor}
                defaultChecked={valor === valores.atividade}
                required
                className="size-4 shrink-0 accent-primary"
                data-invalido={campos?.atividade ? "" : undefined}
                aria-describedby={campos?.atividade ? "atividade-erro" : undefined}
              />
              <span>{rotulo}</span>
            </label>
          ))}
          {campos?.atividade && (
            <p id="atividade-erro" className="text-sm text-destructive">Selecione a atividade do seu MEI.</p>
          )}
        </fieldset>

        <div className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="uf" className="text-sm font-medium">UF</label>
            <select
              ref={seletorUf}
              id="uf"
              name="uf"
              defaultValue={opcoesUf.includes(valores.uf) ? valores.uf : ""}
              required
              autoComplete="address-level1"
              aria-invalid={campos?.uf ? true : undefined}
              aria-describedby={campos?.uf ? "uf-erro" : undefined}
              className="h-12 w-full rounded-lg border border-input bg-background px-2 text-base outline-hidden focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
            >
              <option value="" disabled>UF</option>
              {opcoesUf.map((uf) => <option key={uf}>{uf}</option>)}
            </select>
            {campos?.uf && <p id="uf-erro" className="text-sm text-destructive">Selecione a UF.</p>}
          </div>
          <Campo
            id="municipio"
            name="municipio"
            rotulo="Município"
            autoComplete="address-level2"
            defaultValue={valores.municipio}
            maxLength={80}
            required
            erro={campos?.municipio && "Informe o município (até 80 caracteres)."}
          />
        </div>

        <Campo
          id="dataAbertura"
          name="dataAbertura"
          type="date"
          max={hoje}
          defaultValue={valores.dataAbertura}
          rotulo="Data de abertura"
          required
          erro={campos?.dataAbertura === "A data de abertura não pode ser futura"
            ? campos.dataAbertura
            : campos?.dataAbertura && "Informe uma data de abertura válida."}
        />

        <Campo
          id="receitaInicialCentavos"
          name="receitaInicialCentavos"
          rotulo="Receita inicial (R$)"
          dica="Se deixar em branco, o valor salvo será mantido. Para zerar a receita inicial, informe 0."
          inputMode="decimal"
          defaultValue={valores.receitaInicialCentavos}
          placeholder="0,00"
          maxLength={16}
          erro={campos?.receitaInicialCentavos &&
            `Informe um valor de zero a ${formatarCentavos(VALOR_MAX_CENTAVOS)}, com até duas casas decimais.`}
        />
      </fieldset>

      {erro && <Aviso alerta={!campos}>{erro.mensagem}</Aviso>}
      <p role="status" className={pendente || sucesso ? "text-sm text-t2" : "sr-only"}>
        {pendente ? "Salvando…" : sucesso ? "Perfil salvo com sucesso." : ""}
        {!pendente && sucesso && estado.aviso && <> {estado.aviso}</>}
      </p>
      <BotaoEnviar pendente={pendente}>Salvar</BotaoEnviar>
    </form>
  );
}
