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
const RespostaComReferencias = z.strictObject({
  resposta: z.string().trim().min(1).max(4000),
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
export const ESQUEMA_CHAT = esquemaGemini(RespostaComReferencias);

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

export function prepararChat(mensagens: ChatRequest["mensagens"], contexto: ContextoChat) {
  const chat = ChatRequest.safeParse({ mensagens });
  const dados = Contexto.safeParse(contexto);
  if (!chat.success || !dados.success) throw new ErroIa("entrada");
  const { perfil, dashboard, kb } = dados.data;
  // IDs, nome do negócio e texto de alertas podem identificar o titular.
  const texto = JSON.stringify({
    mensagens: chat.data.mensagens.map((m) => m.conteudo),
    perfil: { ehMei: perfil.ehMei, atividade: perfil.atividade },
    resumoMes: dashboard.resumoMes,
    limiteMei: dashboard.limiteMei,
    proximoDas: dashboard.proximoDas,
    alertas: dashboard.alertas.map(({ tipo, severidade, vencimento }) => ({ tipo, severidade, vencimento })),
    trechos: kb.map(({ texto }, indice) => ({ indice, texto })),
  });
  return { texto, fontes: kb.map(({ fonte }) => fonte) };
}

export function lerChat(json: unknown, disponiveis: Fonte[]): ChatResponse {
  const saida = RespostaComReferencias.safeParse(json);
  if (!saida.success) throw new ErroIa("resposta");
  const { referencias } = saida.data;
  let { resposta } = saida.data;
  if (/https?:\/\/|www\./i.test(resposta)) throw new ErroIa("resposta");
  const fontes = [...new Set(referencias)].map((indice) => {
    const fonte = disponiveis[indice];
    if (!fonte) throw new ErroIa("resposta");
    return fonte;
  });
  if (fontes.length === 0 && !/consulte um contador/i.test(resposta)) {
    resposta += " Consulte um contador.";
  }
  const validada = ChatResponse.safeParse({ resposta, fontes });
  if (!validada.success) throw new ErroIa("resposta");
  return validada.data;
}
