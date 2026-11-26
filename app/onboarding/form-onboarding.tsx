"use client";

import { useEffect, useRef } from "react";
import { enviarPerfil } from "@/app/onboarding/enviar-perfil";
import { ufs } from "@/app/onboarding/ufs";
import { Aviso, BotaoEnviar, Campo } from "@/components/auth/campos";
import { useFormularioAcao } from "@/components/auth/use-formulario-acao";
import { formatarCentavos } from "@/components/moeda";
import { VALOR_MAX_CENTAVOS } from "@/lib/contracts/comum";
import type { Atividade } from "@/lib/contracts/perfil";

const atividades = {
  comercio: "Comércio ou indústria",
  servicos: "Prestação de serviços",
  ambos: "Comércio e serviços",
} satisfies Record<Atividade, string>;

export function FormOnboarding({ hoje }: { hoje: string }) {
  const { estado, despachar, aoEnviar, pendente } = useFormularioAcao(enviarPerfil);
  const formulario = useRef<HTMLFormElement>(null);
  const erro = pendente ? null : estado;
  const campos = erro?.campos;

  useEffect(() => {
    if (campos) formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalido]')?.focus();
  }, [campos]);

  return (
    <form
      ref={formulario}
      action={despachar}
      onSubmit={aoEnviar}
      noValidate
      aria-busy={pendente}
      className="grid gap-5 rounded-2xl border border-line bg-s1 p-4 sm:p-6 [&_input:not([type=radio])]:min-w-0 [&_input:not([type=radio])]:w-full"
    >
      <Campo
        id="nomeNegocio"
        name="nomeNegocio"
        rotulo="Nome do negócio"
        autoComplete="organization"
        maxLength={80}
        required
        erro={campos?.nomeNegocio && "Informe o nome do negócio (até 80 caracteres)."}
      />

      <fieldset className="grid min-w-0 gap-2">
        <legend className="mb-1 text-sm font-medium">Atividade do MEI</legend>
        {Object.entries(atividades).map(([valor, rotulo]) => (
          <label key={valor} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 has-checked:border-ring has-data-invalido:border-destructive">
            <input
              type="radio"
              name="atividade"
              value={valor}
              required
              className="size-4 shrink-0 accent-primary"
              data-invalido={campos?.atividade ? "" : undefined}
              aria-describedby={campos?.atividade ? "atividade-erro" : undefined}
            />
            <span>{rotulo}</span>
          </label>
        ))}
        {campos?.atividade && <p id="atividade-erro" className="text-sm text-destructive">Selecione a atividade do seu MEI.</p>}
      </fieldset>

      <div className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="uf" className="text-sm font-medium">UF</label>
          <select
            id="uf"
            name="uf"
            defaultValue=""
            required
            autoComplete="address-level1"
            aria-invalid={campos?.uf ? true : undefined}
            aria-describedby={campos?.uf ? "uf-erro" : undefined}
            className="h-12 w-full rounded-lg border border-input bg-background px-2 text-base aria-[invalid=true]:border-destructive"
          >
            <option value="" disabled>UF</option>
            {ufs.map((uf) => <option key={uf}>{uf}</option>)}
          </select>
          {campos?.uf && <p id="uf-erro" className="text-sm text-destructive">Selecione a UF.</p>}
        </div>
        <Campo
          id="municipio"
          name="municipio"
          rotulo="Município"
          autoComplete="address-level2"
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
        rotulo="Data de abertura"
        required
        erro={campos?.dataAbertura === "A data de abertura não pode ser futura"
          ? campos.dataAbertura
          : campos?.dataAbertura && "Informe uma data de abertura válida."}
      />

      <Campo
        id="receitaInicialCentavos"
        name="receitaInicialCentavos"
        rotulo={`Quanto você já faturou em ${hoje.slice(0, 4)} (R$)?`}
        dica="Informe o que ainda não registrou em lançamentos. Se ainda não faturou, deixe em branco."
        inputMode="decimal"
        placeholder="0,00"
        maxLength={16}
        erro={campos?.receitaInicialCentavos && `Informe um valor de zero a ${formatarCentavos(VALOR_MAX_CENTAVOS)}, com até duas casas decimais.`}
      />

      {erro && <Aviso alerta={!campos}>{erro.mensagem}</Aviso>}
      <BotaoEnviar pendente={pendente}>Salvar e ir para o painel</BotaoEnviar>
    </form>
  );
}
