import { z } from "zod";
import {
  ChatRequest, ChatResponse, DashboardResponse, Fonte, IngestResponse,
  LOTE_MAX, Perfil, Rascunho,
} from "@/lib/contracts";
import type { ContextoChat, IngestRequest } from "@/lib/contracts";
import { ErroIa } from "@/lib/ai/erro";

const RascunhoEstrito = Rascunho.extend({ confianca: Rascunho.shape.confianca.strict() }).strict();
const Extracao = IngestResponse.extend({
  rascunhos: z.array(RascunhoEstrito).max(LOTE_MAX),
}).strict();
const SelecaoChat = z.strictObject({
  indicador: z.enum(["resumo", "limite", "das", "vencimento"]).nullable(),
  referencias: z.array(z.int().nonnegative()).max(5),
});

// O serviço aceita um subconjunto de JSON Schema. Limites completos continuam no Zod.
function esquemaGemini(schema: z.ZodType) {
  const json = z.toJSONSchema(schema, {
    override({ jsonSchema }) {
      delete jsonSchema.pattern;
      delete jsonSchema.maxLength;
      delete jsonSchema.minLength;
      delete jsonSchema.exclusiveMinimum;
      // A gramática remota só precisa fixar a estrutura. Zod aplica os
      // limites sem expandir uma gramática por item ou intervalo numérico.
      delete jsonSchema.maxItems;
      delete jsonSchema.minimum;
      delete jsonSchema.maximum;
    },
  });
  delete json.$schema;
  return json;
}

export const ESQUEMA_EXTRACAO = esquemaGemini(Extracao);
export const ESQUEMA_CHAT = esquemaGemini(SelecaoChat);

export function lerExtracao(json: unknown, kind: IngestRequest["kind"]): IngestResponse {
  const resultado = Extracao.safeParse(json);
  if (!resultado.success) throw new ErroIa("resposta");
  const { rascunhos, perguntasPendentes } = resultado.data;
  const faltamDados = !rascunhos.length || rascunhos.some((r) => r.data === null || r.valorCentavos === null);
  if (faltamDados && !perguntasPendentes.some((p) => p.trim())) throw new ErroIa("resposta");
  for (const r of rascunhos) {
    if (kind === "imagem") {
      if (r.origem !== "foto" && r.origem !== "print") throw new ErroIa("resposta");
    } else {
      r.origem = kind;
    }
    if (r.data === null) r.confianca.data = 0;
    if (r.valorCentavos === null) r.confianca.valor = 0;
  }
  return IngestResponse.parse(resultado.data);
}

const Contexto = z.object({
  perfil: Perfil,
  dashboard: DashboardResponse,
  kb: z.array(z.object({ texto: z.string().min(1), fonte: Fonte })),
});

// Projeção de vocabulário para o Gemini Free. Nomes, contatos, números de
// documentos, valores e outros termos livres ficam no servidor.
const TERMOS_CHAT = new Set((
  "qual quais quanto quantos como quando porque o a os as de do da das dos em no na para por se um uma e ou " +
  "meu minha meus minhas seu eu voce minha loja negocio painel cadastro limite teto anual proporcional receita receitas bruta " +
  "faturamento faturar faturei registrei registrado despesas gastei gastos saldo mes mensal ano anos atual este ainda posso " +
  "abri abriu abertura inicio atividade atividades comeco primeiro ultimo dia janeiro fevereiro marco abril maio junho julho " +
  "agosto setembro outubro novembro dezembro integral incompleto conta inteiro seguinte retroage retroativo " +
  "mei comum caminhoneiro transportador excesso exceder excedi ultrapassar ultrapassei passei acima abaixo ate mais menos vinte cento " +
  "desenquadramento desenquadrar efeitos desenquadrado das guia valor valores custa pagar pago vencimento vence vencera prazo " +
  "feriado expediente bancario comercio industria servico servicos mista misto inss icms iss salario minimo arrecadacao " +
  "calcule calcular simule simular hipotetico outro terceiro funcionario empregado contratar salario 2026"
).split(" "));

function minimizarMensagem(conteudo: string): string {
  const termos = conteudo.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(/[a-z]+|\d+/g) ?? [];
  return termos.filter((termo) => TERMOS_CHAT.has(termo)).join(" ");
}

export function prepararChat(mensagens: ChatRequest["mensagens"], contexto: ContextoChat) {
  const chat = ChatRequest.safeParse({ mensagens });
  const dados = Contexto.safeParse(contexto);
  if (!chat.success || !dados.success) throw new ErroIa("entrada");
  const { perfil, kb } = dados.data;
  const ultima = chat.data.mensagens.at(-1)?.conteudo ?? "";
  const periodoDiferente = Array.from(ultima.matchAll(/\b20\d{2}\b/g))
    .some(([ano]) => ano !== dados.data.dashboard.resumoMes.mes.slice(0, 4));
  // O Gemini só roteia a pergunta. Números do painel e dados do
  // perfil permanecem no servidor e são exibidos após a seleção.
  const texto = JSON.stringify({
    mensagens: chat.data.mensagens.map((m) => minimizarMensagem(m.conteudo)),
    indicadores: perfil.ehMei ? ["resumo", "limite", "das", "vencimento"] : ["resumo"],
    trechos: kb.map(({ fonte, texto }, indice) => ({ indice, titulo: fonte.titulo, texto })),
  });
  return { texto, contexto: dados.data, periodoDiferente };
}

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const reais = (centavos: number) => moeda.format(centavos / 100);

export function lerChat(json: unknown, { dashboard, perfil, kb }: ContextoChat): ChatResponse {
  const saida = SelecaoChat.safeParse(json);
  if (!saida.success) throw new ErroIa("resposta");
  const { referencias, indicador } = saida.data;
  let trechos = [...new Set(referencias)].map((indice) => {
    const trecho = kb[indice];
    if (!trecho) throw new ErroIa("resposta");
    return trecho;
  });
  const { resumoMes, limiteMei, proximoDas } = dashboard;
  const ano = resumoMes.mes.slice(0, 4);
  const arquivoLimite = perfil.dataAbertura.startsWith(ano) ? "kb/limite-proporcional.md" : "kb/limite-mei.md";
  const arquivosFiscais = { limite: arquivoLimite, das: "kb/das-mei.md", vencimento: "kb/vencimento-das.md", resumo: null };
  const arquivoFiscal = perfil.ehMei && indicador ? arquivosFiscais[indicador] : null;
  const fonteIndicador = kb.find(({ fonte }) => fonte.url && fonte.arquivo === arquivoFiscal);
  if (fonteIndicador && indicador === "limite") {
    const outraRegra = arquivoLimite === "kb/limite-mei.md" ? "kb/limite-proporcional.md" : "kb/limite-mei.md";
    trechos = trechos.filter(({ fonte }) => fonte.arquivo !== outraRegra);
  }
  if (fonteIndicador && !trechos.includes(fonteIndicador)) trechos.unshift(fonteIndicador);
  const partes = trechos.map(({ texto }) => texto);
  if (indicador === "resumo") {
    partes.unshift(`No mês ${resumoMes.mes}, suas receitas somam ${reais(resumoMes.receitaCentavos)}, as despesas somam ${reais(resumoMes.despesaCentavos)} e o saldo é de ${reais(resumoMes.saldoCentavos)}.`);
  }
  if (fonteIndicador && indicador === "limite") {
    partes.unshift(`No ano, você registrou ${reais(limiteMei.usadoCentavos)} em receitas. O limite do seu cadastro é ${reais(limiteMei.limiteCentavos)}.`);
  }
  if (fonteIndicador && indicador === "das") partes.unshift(`O valor ordinário do próximo DAS no seu painel é ${reais(proximoDas.valorCentavos)}.`);
  if (fonteIndicador && indicador === "vencimento") {
    partes.unshift(`O próximo vencimento ordinário do DAS no seu painel é ${proximoDas.vencimento.split("-").reverse().join("/")}.`);
  }
  if (!trechos.length) {
    partes.push("Para esclarecer dúvidas fiscais sem base verificada no assistente, consulte um contador.");
  }
  const validada = ChatResponse.safeParse({ resposta: partes.join("\n\n"), fontes: trechos.map(({ fonte }) => fonte) });
  if (!validada.success) throw new ErroIa("resposta");
  return validada.data;
}
