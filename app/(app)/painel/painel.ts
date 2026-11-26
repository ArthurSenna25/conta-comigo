import type { ProximoPassoProps } from "@/components/proximo-passo";
import { nivelDoFio } from "@/components/nivel-do-fio";
import type { DashboardResponse, FaixaLimite } from "@/lib/contracts";

/** `obterDashboard` devolve `proximoDas.valorCentavos: 1` quando não há tabela oficial do DAS (2027+). Nunca é DAS real. */
const MARCADOR_SEM_TABELA = 1;

export function painelSemTabelaDoDas(d: DashboardResponse): boolean {
  return d.proximoDas.valorCentavos === MARCADOR_SEM_TABELA;
}

/** Dias de calendário entre duas datas "YYYY-MM-DD" (Date.parse lê as duas em UTC: sem efeito de fuso). */
export function diasAte(hoje: string, data: string): number {
  return Math.round((Date.parse(data) - Date.parse(hoje)) / 86_400_000);
}

export interface EntradaProximoPasso {
  /** Sem receita no ano (aproximação de "sem lançamentos": o contrato não traz a contagem). */
  vazio: boolean;
  faixa: FaixaLimite;
  vencimentoDas: string;
  hoje: string;
  adicionarAtivo: boolean;
}

type Passo = Required<Pick<ProximoPassoProps, "tom" | "selo" | "titulo" | "subtitulo" | "href">>;

/**
 * Regras do ProximoPasso (03-COMPONENTES.md), primeira verdadeira. Regra 4 (rascunhos pendentes) não se aplica:
 * rascunho não é persistido. O nível vem do engine (nivelDoFio), a tela não recalcula limiar.
 */
export function escolherProximoPasso({ vazio, faixa, vencimentoDas, hoje, adicionarAtivo }: EntradaProximoPasso): Passo {
  if (vazio && adicionarAtivo) {
    return {
      tom: "acento",
      selo: "+",
      titulo: "Mande seu primeiro lançamento",
      subtitulo: "Uma foto de recibo já basta. Toque aqui ou em Adicionar.",
      href: "/adicionar",
    };
  }
  const nivel = nivelDoFio(faixa);
  if (nivel === "estourou") {
    return { tom: "estourou", selo: "!", titulo: "Veja o que fazer agora", subtitulo: "Passou do teto. Tem caminho, e a gente explica.", href: "/chat" };
  }
  if (nivel === "atencao") {
    // o handoff diz "com 80%", mas a faixa do engine começa em 70%: título da regra 2 para não prometer um número errado
    return { tom: "atencao", selo: "!", titulo: "Veja o que fazer agora", subtitulo: "Entenda o que acontece se passar do teto.", href: "/chat" };
  }
  const dias = diasAte(hoje, vencimentoDas);
  return {
    tom: "ok",
    selo: vencimentoDas.slice(8, 10),
    titulo: dias === 0 ? "Seu DAS vence hoje" : `Seu DAS vence em ${dias} ${dias === 1 ? "dia" : "dias"}`,
    subtitulo: "É a guia mensal que o MEI paga. Tire dúvidas no chat.",
    href: "/chat",
  };
}
