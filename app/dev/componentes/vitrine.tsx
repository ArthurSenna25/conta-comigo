"use client";

import type { ReactNode } from "react";
import { ChipFonte } from "@/components/chip-fonte";
import { EstadoErro } from "@/components/estado-erro";
import { EstadoVazio } from "@/components/estado-vazio";
import { FioDoLimite } from "@/components/fio-do-limite";
import { nivelDoFio } from "@/components/nivel-do-fio";
import { ProximoPasso } from "@/components/proximo-passo";
import { Skeleton, SkeletonPainel } from "@/components/skeleton";
import { ValorMoeda } from "@/components/valor-moeda";
import type { FaixaLimite } from "@/lib/contracts";

// Todos os valores abaixo são EXEMPLO (design/handoff/07). O limite vem do lib/engine nas telas.
const LIMITE = 8_100_000;
// A tela recebe `faixa` do obterDashboard e converte com nivelDoFio(); nunca mapeia por conta própria.
const FIOS: { faixa: FaixaLimite; faturado: number }[] = [
  { faixa: "ok", faturado: 3_402_000 },
  { faixa: "70", faturado: 6_804_000 },
  { faixa: "90", faturado: 7_614_000 },
  { faixa: "100", faturado: 8_424_000 },
];

export function Vitrine() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-5 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-[0.06em] text-t3">SÓ EM DESENVOLVIMENTO</p>
        <h1 className="num text-[30px] leading-[1.1] font-extrabold tracking-[-0.02em]">Componentes</h1>
        <p className="text-base text-t2">
          Todos os estados de <code>components/</code>. Copie o uso do código desta página (
          <code>app/dev/componentes/vitrine.tsx</code>). Dados marcados como exemplo.
        </p>
      </header>

      <Secao titulo="FioDoLimite" nota="nivel = nivelDoFio(faixa do lib/engine); o componente não calcula limiar.">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {FIOS.map(({ faixa, faturado }) => (
            <Cartao key={faixa} legenda={`faixa="${faixa}" → nivel="${nivelDoFio(faixa)}" · hero`}>
              <ValorMoeda centavos={faturado} tamanho="hero" contar />
              <FioDoLimite nivel={nivelDoFio(faixa)} faturadoCentavos={faturado} limiteCentavos={LIMITE} />
            </Cartao>
          ))}
          <Cartao legenda="vazio · hero">
            <FioDoLimite nivel={nivelDoFio("ok")} faturadoCentavos={0} limiteCentavos={LIMITE} vazio />
            <p className="text-[15px] text-t2">Assim que entrar o primeiro valor, o fio começa a andar.</p>
          </Cartao>
          <Cartao legenda="compacto · 120% (bolinha para no fim)">
            <FioDoLimite nivel={nivelDoFio("100")} faturadoCentavos={9_720_000} limiteCentavos={LIMITE} variante="compacto" />
          </Cartao>
          <Cartao legenda="onboarding (sem entrada, 400ms ao mudar)">
            <FioDoLimite nivel={nivelDoFio("ok")} faturadoCentavos={2_000_000} limiteCentavos={LIMITE} variante="onboarding" />
          </Cartao>
          <Cartao legenda="mini (chat, chips)">
            {FIOS.map(({ faixa, faturado }) => (
              <FioDoLimite key={faixa} nivel={nivelDoFio(faixa)} faturadoCentavos={faturado} limiteCentavos={LIMITE} variante="mini" />
            ))}
          </Cartao>
        </div>
      </Secao>

      <Secao titulo="ValorMoeda" nota="centavos inteiros; Manrope tabular.">
        <Cartao legenda="tamanhos e sinais">
          <ValorMoeda centavos={18_000} sinal="entrada" tamanho="sm" />
          <ValorMoeda centavos={24_590} sinal="saida" tamanho="md" />
          <ValorMoeda centavos={35_000} tamanho="lg" />
          <ValorMoeda centavos={123_456} tamanho="hero" />
        </Cartao>
      </Secao>

      <Secao titulo="ProximoPasso" nota="a tela escolhe qual regra (03) mostrar; o componente só desenha.">
        <div className="grid gap-3 md:grid-cols-2">
          <ProximoPasso tom="acento" selo="+" titulo="Mande seu primeiro lançamento" subtitulo="Uma foto de recibo já basta. Toque aqui ou em Adicionar." href="/adicionar" />
          <ProximoPasso tom="estourou" selo="!" titulo="Veja o que fazer agora" subtitulo="Passou do teto. Tem caminho, e a gente explica." href="/chat" />
          <ProximoPasso tom="atencao" selo="!" titulo="Veja o que fazer com 80%" subtitulo="Entenda o que acontece se passar do teto." href="/chat" />
          <ProximoPasso tom="acento" selo="2" titulo="Confira 2 rascunhos" subtitulo="A IA já leu. Falta só você conferir." href="/conferir" />
          <ProximoPasso tom="ok" selo="20" titulo="Seu DAS vence em 26 dias" subtitulo="Valor e código de pagamento ficam prontos aqui." onClick={() => undefined} />
        </div>
      </Secao>

      <Secao titulo="ChipFonte" nota="rótulo, resumo, url https e data por props. Sem url ou data válida, não renderiza.">
        <Cartao legenda="exemplo (não é texto legal)">
          <div className="flex flex-wrap gap-3">
            <ChipFonte rotulo="Fonte de exemplo" resumo="Resumo de exemplo. Aqui entra o resumo da fonte, escrito por quem conferiu o texto oficial." url="https://example.com/" consultadoEm="2026-11-24" />
          </div>
          <div className="flex items-center gap-2 text-sm text-t3">
            Sem data → <ChipFonte rotulo="invisível" resumo="" url="https://example.com/" consultadoEm="" />
            <span>(nada renderizado)</span>
          </div>
        </Cartao>
      </Secao>

      <Secao titulo="Skeleton">
        <div className="grid gap-6 md:grid-cols-2">
          <Cartao legenda="Skeleton">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-10 w-3/4" ordem={1} />
            <Skeleton className="h-3.5 w-1/2" ordem={2} />
          </Cartao>
          <Cartao legenda="SkeletonPainel">
            <SkeletonPainel />
          </Cartao>
        </div>
      </Secao>

      <Secao titulo="EstadoErro">
        <div className="grid gap-6 md:grid-cols-2">
          <Cartao legenda='tipo="503"'>
            <EstadoErro tipo="503" hrefManual="/conferir" onTentarDeNovo={() => undefined} />
          </Cartao>
          <Cartao legenda='tipo="429"'>
            <EstadoErro tipo="429" hrefManual="/conferir" />
          </Cartao>
          <Cartao legenda='tipo="rede"'>
            <EstadoErro tipo="rede" mensagem="Algo deu errado. Tente de novo em instantes." />
          </Cartao>
        </div>
      </Secao>

      <Secao titulo="EstadoVazio">
        <div className="grid gap-6 md:grid-cols-2">
          <EstadoVazio tipo="geral" />
          <EstadoVazio tipo="filtro" />
        </div>
      </Secao>
    </main>
  );
}

function Secao({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 border-b border-line pb-3">
        <h2 className="num text-2xl font-extrabold tracking-[-0.015em]">{titulo}</h2>
        {nota && <p className="text-sm text-t3">{nota}</p>}
      </div>
      {children}
    </section>
  );
}

function Cartao({ legenda, children }: { legenda: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-[var(--card-solid)] p-5">
      <span className="self-start rounded-xs border border-dashed border-line-strong px-2 py-0.5 text-sm font-semibold text-t3">
        {legenda}
      </span>
      {children}
    </div>
  );
}
