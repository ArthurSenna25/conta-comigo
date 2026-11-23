/**
 * Dados falsos (set–nov/2026) para o front andar antes do back.
 * Ligados por NEXT_PUBLIC_USE_MOCKS=true. Nenhum dado real de pessoa.
 * Números do dashboard são escritos à mão (coerentes com os lançamentos de nov),
 * não calculados: quem calcula é lib/engine.
 */
import type { AiProvider } from "./provedor-ia";
import type { ChatResponse } from "./chat";
import type { DashboardResponse } from "./dashboard";
import type { IngestResponse } from "./ingest";
import type { Categoria, FormaPgto, Lancamento, Origem, TipoLancamento } from "./lancamento";
import type { Perfil } from "./perfil";

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
const ts = (data: string) => `${data}T15:00:00.000Z`;

export const mockPerfil: Perfil = {
  userId: id(1),
  nomeNegocio: "Loja da Marta Modas",
  ehMei: true,
  atividade: "comercio",
  uf: "SP",
  municipio: "São Paulo",
  dataAbertura: "2021-03-10",
  receitaInicialCentavos: 4_000_000, // R$ 40 mil de jan a ago, informado no onboarding
  criadoEm: ts("2026-09-01"),
};

type Linha = [
  dia: string,
  tipo: TipoLancamento,
  valorCentavos: number,
  categoria: Categoria,
  descricao: string,
  formaPgto: FormaPgto | null,
  origem: Origem,
  comNota: boolean,
];

const mesPadrao = (m: string): Linha[] => [
  [`${m}-03`, "receita", 210_000, "vendas", "Vendas da semana no cartão", "cartao", "print", true],
  [`${m}-05`, "despesa", 120_000, "aluguel", "Aluguel da loja", "boleto", "foto", true],
  [`${m}-08`, "despesa", 280_000, "estoque", "Compra de roupas no Brás", "pix", "foto", true],
  [`${m}-10`, "receita", 185_000, "vendas", "Vendas da semana no Pix", "pix", "print", true],
  [`${m}-12`, "despesa", 31_000, "contas_consumo", "Energia e internet", "boleto", "foto", true],
  [`${m}-14`, "despesa", 30_000, "frete", "Frete do fornecedor", "pix", "audio", false],
  [`${m}-17`, "receita", 230_000, "vendas", "Vendas da semana", "cartao", "audio", false],
  [`${m}-18`, "despesa", 8_205, "impostos_das", "DAS do mês", "pix", "manual", false],
  [`${m}-21`, "receita", 148_000, "vendas", "Vendas no dinheiro", "dinheiro", "texto", false],
];

const novembroExtras: Linha[] = [
  // despesa atípica: ~10x o marketing usual
  ["2026-11-15", "despesa", 150_000, "marketing", "Impulsionamento no Instagram", "cartao", "texto", false],
  // sugere mistura PF/PJ
  ["2026-11-19", "despesa", 42_000, "outras", "Supermercado da casa", "pix", "audio", false],
];

const linhas: Linha[] = [
  ...mesPadrao("2026-09"),
  ...mesPadrao("2026-10"),
  ["2026-10-22", "despesa", 15_000, "marketing", "Panfletos", "pix", "foto", true],
  ...mesPadrao("2026-11"),
  ...novembroExtras,
];

export const mockLancamentos: Lancamento[] = linhas.map(
  ([data, tipo, valorCentavos, categoria, descricao, formaPgto, origem, comNota], i) => ({
    id: id(100 + i),
    tipo,
    data,
    valorCentavos,
    categoria,
    descricao,
    contraparte: null,
    formaPgto,
    origem,
    documentoId: comNota ? id(500 + i) : null,
    criadoEm: ts(data),
    atualizadoEm: ts(data),
  }),
);

export const mockDashboard: DashboardResponse = {
  resumoMes: {
    mes: "2026-11",
    receitaCentavos: 773_000,
    despesaCentavos: 661_205,
    saldoCentavos: 111_795,
    despesasPorCategoria: [
      { categoria: "estoque", totalCentavos: 280_000 },
      { categoria: "marketing", totalCentavos: 150_000 },
      { categoria: "aluguel", totalCentavos: 120_000 },
      { categoria: "outras", totalCentavos: 42_000 },
      { categoria: "contas_consumo", totalCentavos: 31_000 },
      { categoria: "frete", totalCentavos: 30_000 },
      { categoria: "impostos_das", totalCentavos: 8_205 },
    ],
  },
  limiteMei: {
    usadoCentavos: 6_319_000,
    limiteCentavos: 8_100_000,
    pct: 78.01,
    faixa: "70",
    projecaoAnualCentavos: 7_050_000,
  },
  proximoDas: { vencimento: "2026-12-20", valorCentavos: 8_205 },
  alertas: [
    {
      chave: "limite_mei:2026:70",
      tipo: "limite_mei",
      severidade: "atencao",
      titulo: "Você já usou 78% do limite do MEI",
      mensagem: "Faltam R$ 17.810,00 para o limite de R$ 81 mil em 2026.",
      vencimento: null,
      lancamentoId: null,
    },
    {
      chave: `despesa_atipica:${id(128)}`,
      tipo: "despesa_atipica",
      severidade: "atencao",
      titulo: "Gasto com marketing fora do normal",
      mensagem: "R$ 1.500,00 em marketing, cerca de 10 vezes a sua média.",
      vencimento: null,
      lancamentoId: id(128),
    },
    {
      chave: `mistura_pf_pj:${id(129)}`,
      tipo: "mistura_pf_pj",
      severidade: "info",
      titulo: "Isso parece gasto pessoal",
      mensagem: "\"Supermercado da casa\" saiu do caixa da loja. Separar ajuda a ver o lucro real.",
      vencimento: null,
      lancamentoId: id(129),
    },
    {
      chave: `nota_faltando:${id(124)}`,
      tipo: "nota_faltando",
      severidade: "info",
      titulo: "Frete sem comprovante",
      mensagem: "Guarde a nota do frete de 14/11 para não ter problema depois.",
      vencimento: null,
      lancamentoId: id(124),
    },
  ],
};

export const mockIngest: IngestResponse = {
  rascunhos: [
    {
      tipo: "receita",
      data: "2026-11-23",
      valorCentavos: 120_000,
      categoria: "vendas",
      descricao: "Vendas no cartão",
      contraparte: null,
      formaPgto: "cartao",
      origem: "audio",
      confianca: { data: 0.9, valor: 0.95, categoria: 0.9 },
    },
    {
      tipo: "despesa",
      data: "2026-11-23",
      valorCentavos: 30_000,
      categoria: "frete",
      descricao: "Frete",
      contraparte: null,
      formaPgto: null,
      origem: "audio",
      confianca: { data: 0.9, valor: 0.95, categoria: 0.7 },
    },
  ],
  perguntasPendentes: ["Como você pagou o frete?"],
};

export const mockChat: ChatResponse = {
  resposta:
    "Você já faturou R$ 63.190,00 em 2026, 78% do limite de R$ 81 mil do MEI. " +
    "Se passar do limite em até 20%, paga DAS complementar sobre o excesso; acima disso, " +
    "pode ser desenquadrada. Antes de decidir, valide com um contador.",
  fontes: [
    {
      titulo: "Limite de faturamento do MEI",
      arquivo: "kb/limite-mei.md",
      url: "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor",
      verificadoEm: "2026-11-22",
    },
  ],
};

/** Provider falso: mesma interface do real, custo zero. */
export const mockAiProvider: AiProvider = {
  extrair: async () => ({ resultado: mockIngest, custoCentavos: 0 }),
  responder: async () => ({ resultado: mockChat, custoCentavos: 0 }),
};
