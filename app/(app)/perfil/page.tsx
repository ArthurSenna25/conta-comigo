import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obterPerfil } from "@/actions/perfil";
import { exigirAcesso } from "@/actions/sessao";
import { FormPerfil } from "@/app/(app)/perfil/form-perfil";
import { dadosEditaveis, ROTULO_ATIVIDADE, type DadosEditaveis } from "@/app/(app)/perfil/dados-perfil";
import { FaixaDemo } from "@/components/demo/faixa-demo";
import { formatarCentavos } from "@/components/moeda";
import { hojeBrasil } from "@/lib/contracts/comum";

export const metadata: Metadata = { title: "Perfil · Conta Comigo" };

export default async function PaginaPerfil() {
  const { demo } = await exigirAcesso("consentimento");
  const resultado = await obterPerfil();
  if (!resultado.ok) {
    if (resultado.erro.codigo === "nao_encontrado") redirect("/onboarding");
    throw new Error("Não foi possível carregar o perfil.");
  }

  const dados = dadosEditaveis(resultado.dados);

  return (
    <>
      <FaixaDemo demo={demo} />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-5 py-8 sm:py-12">
        <header className="space-y-2">
          <h1 className="text-3xl leading-tight font-bold">Perfil</h1>
          <p className="text-t2">Dados do seu negócio.</p>
        </header>
        {demo ? <PerfilDemo dados={dados} /> : <FormPerfil dados={dados} hoje={hojeBrasil()} />}
      </main>
    </>
  );
}

function PerfilDemo({ dados }: { dados: DadosEditaveis }) {
  const [ano, mes, dia] = dados.dataAbertura.split("-");
  const itens = [
    ["Nome do negócio", dados.nomeNegocio],
    ["Atividade do MEI", ROTULO_ATIVIDADE[dados.atividade]],
    ["UF", dados.uf],
    ["Município", dados.municipio],
    ["Data de abertura", `${dia}/${mes}/${ano}`],
    ["Receita inicial", formatarCentavos(dados.receitaInicialCentavos)],
  ];

  return (
    <section className="grid gap-4 rounded-2xl border border-line bg-s1 p-4 sm:p-6" aria-label="Dados do negócio">
      <p className="text-t2">
        Você pode consultar os dados do negócio na conta de demonstração. A edição está disponível em uma conta própria.
      </p>
      <dl className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        {itens.map(([rotulo, valor]) => (
          <div key={rotulo} className="min-w-0">
            <dt className="text-sm font-medium text-t2">{rotulo}</dt>
            <dd className="break-words">{valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
