import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { obterDashboard } from "@/actions/dashboard";
import { exigirAcesso } from "@/actions/sessao";
import { FabAdicionar } from "@/components/app/fab-adicionar";
import { ADICIONAR } from "@/components/app/navegacao";
import { BotaoSair } from "@/components/auth/botao-sair";
import { ROTULO_CATEGORIA } from "@/components/categoria";
import { FaixaDemo } from "@/components/demo/faixa-demo";
import { EstadoErro } from "@/components/estado-erro";
import { EstadoVazio } from "@/components/estado-vazio";
import { FioDoLimite } from "@/components/fio-do-limite";
import { nivelDoFio } from "@/components/nivel-do-fio";
import { ProximoPasso } from "@/components/proximo-passo";
import { ValorMoeda } from "@/components/valor-moeda";
import { type DashboardResponse, hojeBrasil, type Severidade } from "@/lib/contracts";
import { diasAte, escolherProximoPasso, painelSemTabelaDoDas } from "./painel";

export const metadata: Metadata = { title: "Painel · Conta Comigo" };

/** Painel (design/handoff/04-TELAS-APP.md § /painel). Só formata o que obterDashboard devolve; nada é calculado aqui. */
export default async function PaginaPainel() {
  const { demo } = await exigirAcesso(); // toda página protegida chama o portão: layout não re-renderiza a cada navegação
  const resultado = await obterDashboard();
  const hoje = hojeBrasil();

  return (
    <div className="flex flex-col">
      <FaixaDemo demo={demo} />
      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-5 pt-[18px] pb-[70px]">
        <h1 className="num text-2xl font-extrabold tracking-[-0.02em]">Seu ano até aqui</h1>
        {!resultado.ok ? (
          <EstadoErro tipo="rede" mensagem={resultado.erro.mensagem} />
        ) : painelSemTabelaDoDas(resultado.dados) ? (
          // 2027+: sem tabela oficial do DAS, a action devolve painel zerado com marcador; nunca mostrar R$ 0,01
          <EstadoVazio tipo="geral" hrefAdicionar={ADICIONAR.href} />
        ) : (
          <Conteudo dados={resultado.dados} hoje={hoje} demo={demo} />
        )}
        <div className="mt-6">
          {/* Sair mora aqui até /perfil existir (é a única saída do app logado) */}
          <BotaoSair />
        </div>
      </main>
      <FabAdicionar />
    </div>
  );
}

function Conteudo({ dados, hoje, demo }: { dados: DashboardResponse; hoje: string; demo: boolean }) {
  const { limiteMei, proximoDas, alertas, resumoMes } = dados;
  const vazio = limiteMei.usadoCentavos === 0;
  const passo = escolherProximoPasso({
    vazio,
    faixa: limiteMei.faixa,
    vencimentoDas: proximoDas.vencimento,
    hoje,
    adicionarAtivo: ADICIONAR.ativo,
  });

  return (
    <>
      <Heroi limite={limiteMei} ano={hoje.slice(0, 4)} vazio={vazio} demo={demo} />
      {alertas.length > 0 && <Alertas alertas={alertas} />}
      <ProximoPasso {...passo} />
      {!vazio && <CartaoDas vencimento={proximoDas.vencimento} valorCentavos={proximoDas.valorCentavos} hoje={hoje} />}
      <Resumo resumo={resumoMes} />
    </>
  );
}

function Heroi({ limite, ano, vazio, demo }: { limite: DashboardResponse["limiteMei"]; ano: string; vazio: boolean; demo: boolean }) {
  const nivel = nivelDoFio(limite.faixa);
  return (
    <section
      aria-labelledby="titulo-heroi"
      className="flex flex-col gap-4 rounded-[26px] border border-line-strong bg-panel p-5 shadow-[var(--shadow-panel)] backdrop-blur-[18px]"
    >
      <div className="flex items-center gap-2">
        <h2 id="titulo-heroi" className="text-sm font-semibold text-t3">
          Faturado em {ano}
        </h2>
        {demo && <span className="rounded-lg border border-dashed border-line-strong px-2 py-0.5 text-sm font-semibold text-t3">exemplo</span>}
      </div>
      <ValorMoeda centavos={limite.usadoCentavos} tamanho="hero" contar />
      <p className="text-[15px] text-t2">
        de <ValorMoeda centavos={limite.limiteCentavos} tamanho="sm" className="font-semibold" /> · limite do MEI em {ano}
      </p>
      <FioDoLimite nivel={nivel} faturadoCentavos={limite.usadoCentavos} limiteCentavos={limite.limiteCentavos} vazio={vazio} />
      <p className="text-[15px] text-t2 text-pretty">
        {vazio ? (
          "Assim que entrar o primeiro valor, o fio começa a andar."
        ) : nivel === "estourou" ? (
          "Calma: tem caminho. Veja abaixo o que fazer agora."
        ) : (
          <>
            No ritmo atual, você fecha {ano} perto de <ValorMoeda centavos={limite.projecaoAnualCentavos} tamanho="sm" />.
          </>
        )}
      </p>
    </section>
  );
}

/** Cor por severidade: atenção e crítico seguem os cartões de alerta do handoff (itens 4 e 5); info usa o acento. */
const COR_SEVERIDADE: Record<Severidade, CSSProperties> = {
  info: { background: "var(--acc-a10)", borderColor: "var(--acc-a40)" },
  atencao: { background: "color-mix(in oklch, var(--warn) 11%, var(--s1))", borderColor: "color-mix(in oklch, var(--warn) 50%, transparent)" },
  critico: { background: "color-mix(in oklch, var(--err) 12%, var(--s1))", borderColor: "color-mix(in oklch, var(--err) 55%, transparent)" },
};

function Alertas({ alertas }: { alertas: DashboardResponse["alertas"] }) {
  return (
    <section aria-label="Alertas">
      <ul className="flex flex-col gap-3">
        {alertas.map((a) => (
          <li key={a.chave} className="flex flex-col gap-1 rounded-[18px] border px-4 py-3.5" style={COR_SEVERIDADE[a.severidade]}>
            <p className="text-base font-bold text-pretty">{a.titulo}</p>
            <p className="text-[15px] text-t2 text-pretty">{a.mensagem}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const dataBr = (iso: string) => iso.split("-").reverse().join("/");

function CartaoDas({ vencimento, valorCentavos, hoje }: { vencimento: string; valorCentavos: number; hoje: string }) {
  const dias = diasAte(hoje, vencimento);
  return (
    <section aria-labelledby="titulo-das" className="flex flex-col gap-2 rounded-[20px] border border-line bg-card-solid p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="titulo-das" className="text-base font-bold">
          Próximo DAS
        </h2>
        <span className="rounded-full bg-s3 px-3 py-1 text-sm font-semibold text-t2">
          {dias === 0 ? "hoje" : `em ${dias} ${dias === 1 ? "dia" : "dias"}`}
        </span>
      </div>
      <ValorMoeda centavos={valorCentavos} tamanho="lg" />
      <p className="text-[15px] text-t2">
        Vence em <time dateTime={vencimento}>{dataBr(vencimento)}</time>
      </p>
    </section>
  );
}

const nomeDoMes = (mes: string) =>
  new Date(`${mes}-15T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

function Resumo({ resumo }: { resumo: DashboardResponse["resumoMes"] }) {
  const linha = "flex items-baseline justify-between gap-3 py-2";
  return (
    <section aria-labelledby="titulo-resumo" className="flex flex-col gap-3 rounded-[20px] border border-line bg-card-solid p-5">
      <h2 id="titulo-resumo" className="text-base font-bold">
        Resumo de {nomeDoMes(resumo.mes)}
      </h2>
      <dl className="flex flex-col divide-y divide-line">
        <div className={linha}>
          <dt className="text-[15px] text-t2">Receitas</dt>
          <dd><ValorMoeda centavos={resumo.receitaCentavos} sinal="entrada" tamanho="sm" /></dd>
        </div>
        <div className={linha}>
          <dt className="text-[15px] text-t2">Despesas</dt>
          <dd><ValorMoeda centavos={resumo.despesaCentavos} sinal="saida" tamanho="sm" /></dd>
        </div>
        <div className={linha}>
          <dt className="text-[15px] font-semibold text-t1">Saldo</dt>
          <dd>
            <ValorMoeda centavos={resumo.saldoCentavos} sinal={resumo.saldoCentavos < 0 ? "saida" : undefined} tamanho="md" />
          </dd>
        </div>
      </dl>
      {resumo.despesasPorCategoria.length > 0 && (
        <>
          <h3 className="pt-2 text-sm font-semibold text-t3">Despesas por categoria</h3>
          <ul className="flex flex-col">
            {resumo.despesasPorCategoria.map(({ categoria, totalCentavos }) => (
              <li key={categoria} className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="text-[15px] text-t2">{ROTULO_CATEGORIA[categoria]}</span>
                <ValorMoeda centavos={totalCentavos} tamanho="sm" className="font-semibold" />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
