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
  "calcule calcular simule simular hipotetico outro terceiro funcionario empregado contratar salario 2026 " +
  "2027 2028 funcionarios empregados contratacao perdao remissao divida dividas debito debitos lei nova muda mudou " +
  "continua reforma tributaria ibs cbs"
).split(" "));

/** Resposta honesta quando a pergunta está fora da base verificada do chat. */
export const SEM_FONTE_CONFIAVEL = "Não tenho fonte confiável sobre isso nesta versão.";

/** Saudação fixa: mesmo texto e perguntas de exemplo da tela do chat. Não chama a IA. */
export const SAUDACAO_CHAT =
  "Olá! Tiro dúvidas sobre o MEI com base em fontes oficiais e nos números do seu painel. Experimente uma destas perguntas:\n\n" +
  "- Quando vence o DAS?\n- Qual o limite do MEI em 2027?\n- Posso contratar empregado?";

function minimizarMensagem(conteudo: string): string {
  const termos: string[] = conteudo.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(/[a-z]+|\d+/g) ?? [];
  if (perguntaSobreExcessoMei(conteudo)) termos.unshift("excesso");
  return termos.filter((termo) => TERMOS_CHAT.has(termo)).join(" ");
}

export function perguntaSobreExcessoMei(pergunta: string): boolean {
  const texto = pergunta.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(/[a-z]+/g)?.join(" ") ?? "";
  return /\bdesenquadr[a-z]*\b/.test(texto)
    || /\b(?:pass|estour|ultrapass|exced)[a-z]* (?:(?:do|o|os|dos) )?(?:meu )?limites? (?:do mei|de faturamento)\b/.test(texto)
    || /^(?:(?:e se|o que acontece se|se) (?:eu )?|como |eu )?(?:pass|estour|ultrapass|exced)[a-z]* (?:(?:do|o|os|dos) )?(?:meu )?limites?$/.test(texto);
}

/** Regras avaliadas no texto original, antes da projeção do vocabulário para o provedor. */
function orientarPergunta(pergunta: string): string | null {
  const texto = pergunta.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ");
  const soLetras = texto.replace(/[^a-z ]/g, " ").replace(/ +/g, " ").trim();
  if (/^(?:(?:ola|oi|oie|opa|hey|hello|e ai|bom dia|boa tarde|boa noite|tudo bem|tudo bom)(?: |$))+$/.test(soLetras)) return SAUDACAO_CHAT;
  if (/\b(?:irpf|imposto (?:de|sobre a) renda|declaracao de (?:imposto de )?renda)\b/.test(texto)
    || /\bdedu[a-z]*\b.*\bdespesas medicas\b|\bdespesas medicas\b.*\bdedu[a-z]*\b/.test(texto)) {
    return "Não ofereço orientação individual de IRPF. Para sua declaração ou deduções, consulte um contador.";
  }
  if (/\b(?:invente|forje|fabrique)\b.*\b(?:fonte|lei|url|referencia)\b|\b(?:ignore|desconsidere|esqueca)\b.*\b(?:base juridica|fontes verificadas)\b/.test(texto)) {
    return "Uso apenas fontes verificadas da base jurídica. Se a regra que você procura estiver fora da base, consulte um contador.";
  }
  if (/\b(?:calcule|calcular|simule|simular)\b.*\b(?:imposto|tributos?|das)\b/.test(texto)) {
    return "Não faço cálculos tributários sob demanda. Confira o DAS no painel e, para apurar impostos do seu caso, consulte um contador.";
  }
  if (/\bsaldo\b.*\bsem (?:consultar|usar|acessar)\b/.test(texto)) {
    return "Confira o saldo atualizado no painel. O saldo usa os lançamentos registrados no sistema.";
  }
  if (/\b(?:contas?|financas?)\b/.test(texto)
    && /\b(?:pessoa fisica|pesso(?:al|ais)|particular(?:es)?)\b/.test(texto)
    && /\b(?:mei|empresaria(?:l|is)|empresa)\b/.test(texto)) {
    return "Para acompanhar o seu negócio no Conta Comigo, registre no painel as receitas e despesas do MEI e acompanhe os gastos pessoais separadamente. Para saber se você pode usar a mesma conta bancária, consulte um contador. A base verificada do chat não cobre essa regra.";
  }
  // ponytail: lista curta de culinária só para "receita" de cozinha não virar receita do MEI.
  if (/\b(?:bolo|torta|pudim|culinaria|cozinhar|ingredientes?|forno)\b/.test(texto)) return SEM_FONTE_CONFIAVEL;
  const assuntoDoChat = perguntaSobreExcessoMei(texto)
    || /\b(?:mei|das-mei|impostos?|tributos?|painel|saldo|receitas?|despesas?|fatur\w*|lancamentos?|vencimento|estoque)\b/.test(texto)
    || /\b(?:empregad[oa]s?|funcionari[oa]s?|reforma tributaria|ibs|cbs|perdao|remissao)\b/.test(texto)
    || /\b(?:(?:meu|o|do|proximo) das|mes da abertura|ano de abertura)\b/.test(texto)
    || /\b(?:meu (?:limite|teto)|limite (?:anual|proporcional))(?: este ano| em 20\d{2})?[?.! ]*$/.test(texto);
  return assuntoDoChat ? null : SEM_FONTE_CONFIAVEL;
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
  return { texto, contexto: dados.data, periodoDiferente, orientacao: orientarPergunta(ultima) };
}

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const reais = (centavos: number) => moeda.format(centavos / 100);

/** `outroAno`: a pergunta cita outro ano, então os indicadores do painel (ano atual) não se aplicam. */
export function lerChat(json: unknown, { dashboard, perfil, kb }: ContextoChat, outroAno = false): ChatResponse {
  const saida = SelecaoChat.safeParse(json);
  if (!saida.success) throw new ErroIa("resposta");
  const referencias = saida.data.referencias;
  const indicador = outroAno ? null : saida.data.indicador;
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
    partes.unshift(`No mês ${resumoMes.mes}, suas receitas somam ${reais(resumoMes.receitaCentavos)}, as despesas somam ${reais(resumoMes.despesaCentavos)} e o saldo é de ${reais(resumoMes.saldoCentavos)}. Confira os dados atualizados no painel.`);
  }
  if (fonteIndicador && indicador === "limite") {
    partes.unshift(`No ano, você registrou ${reais(limiteMei.usadoCentavos)} em receitas. O limite do seu cadastro é ${reais(limiteMei.limiteCentavos)}.`);
  }
  if (fonteIndicador && indicador === "das") partes.unshift(`O valor ordinário do próximo DAS no seu painel é ${reais(proximoDas.valorCentavos)}.`);
  if (fonteIndicador && indicador === "vencimento") {
    partes.unshift(`O próximo vencimento ordinário do DAS no seu painel é ${proximoDas.vencimento.split("-").reverse().join("/")}.`);
  }
  if (!trechos.length && indicador !== "resumo") {
    partes.push(`${SEM_FONTE_CONFIAVEL} Para o seu caso, consulte um contador.`);
  }
  const validada = ChatResponse.safeParse({ resposta: partes.join("\n\n"), fontes: trechos.map(({ fonte }) => fonte) });
  if (!validada.success) throw new ErroIa("resposta");
  return validada.data;
}
