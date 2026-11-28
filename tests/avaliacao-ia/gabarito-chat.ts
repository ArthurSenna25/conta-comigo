import { Atividade, DataISO, type ChatResponse, type Lancamento } from "@/lib/contracts";
import { mockPerfil } from "@/lib/contracts/mocks";
import { montarContexto } from "@/app/api/chat/contexto";
import { selecionarTrechos } from "@/app/api/chat/conhecimento";
import { FORA_DO_ESCOPO, SEM_FONTE_CONFIAVEL } from "@/lib/ai/saidas";
import dados from "./casos-chat.json";
import { z } from "zod";

export const casosChat = z.array(z.object({
  id: z.string(), pergunta: z.string(), atividade: Atividade, dataAbertura: DataISO, hoje: DataISO,
  base: z.string(), fontes: z.array(z.string()), inclui: z.array(z.string()),
  indicador: z.enum(["resumo", "limite", "das", "vencimento"]).nullable(),
})).parse(dados);

type Caso = typeof casosChat[number];
const movimentos = [
  { tipo: "receita", valorCentavos: 125000, categoria: "vendas", id: "10000000-0000-4000-8000-000000000001" },
  { tipo: "despesa", valorCentavos: 35000, categoria: "estoque", id: "10000000-0000-4000-8000-000000000002" },
] as const;
const linhas: Lancamento[] = movimentos.map(({ tipo, categoria, id, valorCentavos }) => ({
  id, tipo, categoria, valorCentavos, data: "2026-11-12", descricao: "Movimentação fictícia",
  contraparte: null, formaPgto: "pix", origem: "manual", documentoId: null,
  criadoEm: "2026-11-12T13:00:00.000Z", atualizadoEm: "2026-11-12T13:00:00.000Z",
}));

export async function contextoDaAvaliacao(caso: Caso) {
  const kb = await selecionarTrechos(caso.pergunta);
  return montarContexto({ ...mockPerfil, atividade: caso.atividade, dataAbertura: caso.dataAbertura,
    receitaInicialCentavos: 100000 }, linhas, caso.hoje, kb);
}

export function avaliarResposta(caso: Caso, resultado: ChatResponse, trechos: Awaited<ReturnType<typeof selecionarTrechos>>) {
  const resposta = resultado.resposta.replace(/\s+/g, " ");
  const fontes = resultado.fontes.map((f) => f.arquivo);
  const fontesCorretas = JSON.stringify([...fontes].sort()) === JSON.stringify(caso.fontes.map((f) => `kb/${f}.md`).sort());
  // A origem do texto precisa ser o trecho citado, não apenas uma URL válida.
  const correspondencia = resultado.fontes.every((f) => trechos.some((t) =>
    JSON.stringify(t.fonte) === JSON.stringify(f) && resultado.resposta.includes(t.texto)));
  const conteudoCorreto = caso.inclui.every((termo) => resposta.includes(termo));
  const fallbackCorreto = caso.indicador !== null || caso.fontes.length > 0 ||
    (!resposta.includes("R$") && fontes.length === 0 &&
      (resposta.includes("consulte um contador") || resposta.startsWith(SEM_FONTE_CONFIAVEL) || resposta === FORA_DO_ESCOPO));
  return { fontesCorretas, correspondencia, conteudoCorreto, fallbackCorreto,
    aprovado: fontesCorretas && correspondencia && conteudoCorreto && fallbackCorreto };
}
