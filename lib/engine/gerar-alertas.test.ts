import { describe, expect, it } from "vitest";
import { Alerta, type Lancamento, type Perfil } from "@/lib/contracts";
import { gerarAlertas, type EstadoAlertas } from "./index";

const perfil: Perfil = {
  userId: "00000000-0000-4000-8000-000000000001",
  nomeNegocio: "Loja de teste",
  ehMei: true,
  atividade: "comercio",
  uf: "SP",
  municipio: "São Paulo",
  dataAbertura: "2024-07-10",
  receitaInicialCentavos: 0,
  criadoEm: "2026-01-05T12:00:00Z",
};

function estado(alteracoes: Partial<EstadoAlertas> = {}): EstadoAlertas {
  return { hoje: "2026-11-24", perfil, lancamentos: [], ...alteracoes };
}

function lancamento(numero: number, alteracoes: Partial<Lancamento> = {}): Lancamento {
  return {
    id: `00000000-0000-4000-8000-${String(numero).padStart(12, "0")}`,
    tipo: "receita",
    categoria: "vendas",
    data: "2026-11-15",
    valorCentavos: 100,
    descricao: "Lançamento de teste",
    contraparte: null,
    formaPgto: null,
    origem: "manual",
    documentoId: null,
    criadoEm: "2026-11-24T12:00:00Z",
    atualizadoEm: "2026-11-24T12:00:00Z",
    ...alteracoes,
  };
}

describe("gerarAlertas", () => {
  describe("DAS", () => {
    it.each([
      ["2026-05-13", "2026-05-20", "info"],
      ["2026-05-18", "2026-05-20", "atencao"],
      ["2026-06-15", "2026-06-22", "info"], // dia 20 cai no sábado
      ["2026-06-20", "2026-06-22", "atencao"],
      ["2026-11-16", "2026-11-23", "info"], // feriado bancário na sexta, dia 20
      ["2026-11-21", "2026-11-23", "atencao"],
      ["2027-01-13", "2027-01-20", "info"], // DAS da competência de dezembro
      ["2027-01-18", "2027-01-20", "atencao"],
    ])("em %s avisa sobre o vencimento efetivo de %s com severidade %s", (hoje, vencimento, severidade) => {
      const chave = `das_vencendo:${vencimento.slice(0, 7)}`;
      const alertas = gerarAlertas(estado({ hoje }));

      expect(alertas).toEqual([
        expect.objectContaining({ chave, tipo: "das_vencendo", severidade, vencimento, lancamentoId: null }),
      ]);
      expect(`${alertas[0].titulo} ${alertas[0].mensagem}`).not.toMatch(
        /em aberto|pendente de pagamento|não (?:foi )?pago|atrasado|em atraso/i,
      );
    });

    it("omite o DAS de outubro para MEI aberto em novembro", () => {
      const alertas = gerarAlertas(estado({
        hoje: "2026-11-16",
        perfil: { ...perfil, dataAbertura: "2026-11-01" },
      }));

      expect(alertas).toEqual([]);
    });

    it.each([
      ["2026-11-30", "2026-12-14", "2026-12-21", "info"],
      ["2026-12-31", "2027-01-18", "2027-01-20", "atencao"],
    ])("avisa sobre a primeira competência do MEI aberto em %s", (dataAbertura, hoje, vencimento, severidade) => {
      const alertas = gerarAlertas(estado({ hoje, perfil: { ...perfil, dataAbertura } }));

      expect(alertas).toEqual([
        expect.objectContaining({
          chave: `das_vencendo:${vencimento.slice(0, 7)}`,
          tipo: "das_vencendo",
          severidade,
          vencimento,
        }),
      ]);
    });

    it.each([
      "2026-05-12", "2026-05-14", "2026-05-17", "2026-05-19", "2026-05-20", "2026-05-21",
      "2026-11-13", "2026-11-18", "2026-12-31", "2027-01-01",
    ])("não avisa fora dos dois marcos em %s", (hoje) => {
      expect(gerarAlertas(estado({ hoje }))).toEqual([]);
    });
  });

  describe("limite MEI", () => {
    it.each([
      [5_669_999, null, null],
      [5_670_000, "70", "atencao"],
      [5_670_001, "70", "atencao"],
      [7_289_999, "70", "atencao"],
      [7_290_000, "90", "atencao"],
      [7_290_001, "90", "atencao"],
      [8_099_999, "90", "atencao"],
      [8_100_000, "100", "critico"],
      [8_100_001, "100", "critico"],
    ])("com %i centavos emite somente a faixa %s", (valorCentavos, faixa, severidade) => {
      const alertas = gerarAlertas(estado({ lancamentos: [lancamento(2, { valorCentavos })] }));

      expect(alertas).toEqual(faixa === null ? [] : [
        expect.objectContaining({
          chave: `limite_mei:2026:${faixa}`,
          tipo: "limite_mei",
          severidade,
          vencimento: null,
          lancamentoId: null,
        }),
      ]);
    });

    it.each([
      [8_100_000, /atingi/i, /ultrapass|exced/i],
      [8_100_001, /ultrapass/i, /atingi/i],
    ])("distingue o limite atingido do ultrapassado com %i centavos", (valorCentavos, termo, outroTermo) => {
      const [alerta] = gerarAlertas(estado({ lancamentos: [lancamento(2, { valorCentavos })] }));
      const texto = `${alerta.titulo} ${alerta.mensagem}`;

      expect(texto).toMatch(termo);
      expect(texto).not.toMatch(outroTermo);
    });

    it("soma a receita inicial uma vez e inclui as duas extremidades do período desde a abertura", () => {
      const lancamentos = [
        lancamento(2, { data: "2026-07-31", valorCentavos: 500_000 }),
        lancamento(3, { data: "2026-11-24", valorCentavos: 1_335_000 }),
      ];
      const alertas = gerarAlertas(estado({
        perfil: { ...perfil, dataAbertura: "2026-07-31", receitaInicialCentavos: 1_000_000 },
        lancamentos,
      }));

      expect(alertas.map(({ chave }) => chave)).toEqual(["limite_mei:2026:70"]);
    });

    it("ignora despesas e receitas anteriores à abertura, futuras ou de outro ano", () => {
      const lancamentos = [
        lancamento(2, { valorCentavos: 2_834_999 }),
        lancamento(3, { data: "2026-07-30", valorCentavos: 1 }),
        lancamento(4, { data: "2026-11-25", valorCentavos: 1 }),
        lancamento(5, { data: "2025-12-31", valorCentavos: 1 }),
        lancamento(6, { tipo: "despesa", categoria: "aluguel", valorCentavos: 1 }),
      ];

      expect(gerarAlertas(estado({
        perfil: { ...perfil, dataAbertura: "2026-07-31" },
        lancamentos,
      }))).toEqual([]);
    });

    it("exclui receitas de outro ano mesmo quando posteriores à abertura", () => {
      const lancamentos = [
        lancamento(2, { valorCentavos: 5_669_999 }),
        lancamento(3, { data: "2025-12-31", valorCentavos: 1 }),
      ];

      expect(gerarAlertas(estado({ lancamentos }))).toEqual([]);
    });

    it.each([
      ["2026-11-24", "2026-01-05T12:00:00Z", ["limite_mei:2026:70"]],
      ["2027-01-04", "2026-01-05T12:00:00Z", []],
      ["2026-12-31", "2027-01-01T02:59:59Z", ["limite_mei:2026:70"]],
      ["2027-01-04", "2027-01-01T02:59:59Z", []],
      ["2027-01-04", "2027-01-01T03:00:00Z", ["limite_mei:2027:70"]],
    ])("em %s considera o ano civil em São Paulo para cadastro em %s", (hoje, criadoEm, chaves) => {
      const alertas = gerarAlertas(estado({
        hoje,
        perfil: { ...perfil, criadoEm, receitaInicialCentavos: 5_670_000 },
      }));

      expect(alertas.map(({ chave }) => chave)).toEqual(chaves);
    });

    it("conta uma única vez receitas idênticas com o mesmo UUID", () => {
      const receita = lancamento(2, { valorCentavos: 5_669_999 });

      expect(gerarAlertas(estado({ lancamentos: [receita, { ...receita }] }))).toEqual([]);
    });

    // Valores sintéticos acima do teto individual isolam a proteção do acumulador.
    it("aceita o maior inteiro seguro em centavos", () => {
      const lancamentos = [
        lancamento(2, { valorCentavos: Number.MAX_SAFE_INTEGER - 1 }),
        lancamento(3, { valorCentavos: 1 }),
      ];

      expect(gerarAlertas(estado({ lancamentos }))).toEqual([
        expect.objectContaining({ chave: "limite_mei:2026:100", severidade: "critico" }),
      ]);
    });

    it.each([
      ["um lançamento", 1, 0],
      ["a receita inicial", 0, 1],
    ])("rejeita total acima do maior inteiro seguro ao acrescentar %s", (_origem, valorExtra, receitaInicialCentavos) => {
      const lancamentos = [lancamento(2, { valorCentavos: Number.MAX_SAFE_INTEGER })];
      if (valorExtra > 0) lancamentos.push(lancamento(3, { valorCentavos: valorExtra }));

      expect(() => gerarAlertas(estado({
        perfil: { ...perfil, receitaInicialCentavos },
        lancamentos,
      }))).toThrow(RangeError);
    });
  });

  describe("nota faltando", () => {
    it("não gera alerta sem lançamentos", () => {
      expect(gerarAlertas(estado())).toEqual([]);
    });

    it.each(["estoque", "frete"] as const)("gera título singular para despesa de %s", (categoria) => {
      const despesa = lancamento(2, { tipo: "despesa", categoria });
      const alertas = gerarAlertas(estado({ lancamentos: [despesa] }));

      expect(alertas).toEqual([
        expect.objectContaining({
          chave: "nota_faltando:2026",
          tipo: "nota_faltando",
          severidade: "info",
          titulo: "1 despesa de estoque ou frete sem comprovante",
          vencimento: null,
          lancamentoId: null,
          lancamentoIds: [despesa.id],
        }),
      ]);
      expect(`${alertas[0].titulo} ${alertas[0].mensagem}`).toMatch(/comprovante/i);
      expect(`${alertas[0].titulo} ${alertas[0].mensagem}`).not.toMatch(
        /anexa|irregular|infração|obrigatóri|multa/i,
      );
    });

    it("ignora documento presente, receitas, outras despesas e datas fora do período", () => {
      // Despesa atípica e mistura PF/PJ são limitações conhecidas e ficam sem alertas.
      const lancamentos = [
        lancamento(2, { tipo: "despesa", categoria: "estoque", documentoId: perfil.userId }),
        lancamento(3, { tipo: "receita", categoria: "frete" }),
        lancamento(4, { tipo: "despesa", categoria: "impostos_das" }),
        lancamento(5, { tipo: "despesa", categoria: "retirada" }),
        lancamento(6, { tipo: "despesa", categoria: "marketing", valorCentavos: 1_000_000 }),
        lancamento(7, { tipo: "despesa", categoria: "outras", descricao: "Supermercado da casa" }),
        lancamento(8, { tipo: "despesa", categoria: "estoque", data: "2024-07-09" }),
        lancamento(9, { tipo: "despesa", categoria: "frete", data: "2026-11-25" }),
      ];

      expect(gerarAlertas(estado({ lancamentos }))).toEqual([]);
    });

    it("inclui despesas confirmadas na data de abertura e no dia de referência", () => {
      const estoque = lancamento(2, { tipo: "despesa", categoria: "estoque", data: perfil.dataAbertura });
      const frete = lancamento(3, { tipo: "despesa", categoria: "frete", data: "2026-11-24" });

      const alertas = gerarAlertas(estado({ lancamentos: [estoque, frete] }));

      expect(alertas).toEqual([
        expect.objectContaining({
          chave: "nota_faltando:2026",
          titulo: "2 despesas de estoque ou frete sem comprovante",
          lancamentoIds: [estoque.id, frete.id],
        }),
      ]);
    });

    it("mantém a chave quando a quantidade muda e inclui todos os IDs", () => {
      const lancamentos = Array.from({ length: 12 }, (_, i) =>
        lancamento(i + 2, { tipo: "despesa", categoria: "frete" }),
      );
      const [singular] = gerarAlertas(estado({ lancamentos: lancamentos.slice(0, 1) }));
      const [plural] = gerarAlertas(estado({ lancamentos }));

      expect(plural.chave).toBe(singular.chave);
      expect(plural).toMatchObject({
        titulo: "12 despesas de estoque ou frete sem comprovante",
        lancamentoIds: lancamentos.map(({ id }) => id),
      });
      expect(Alerta.parse(plural).mensagem.length).toBeLessThanOrEqual(400);
    });
  });

  it("em perfil não MEI mantém o lembrete de comprovante e omite os alertas de DAS e limite", () => {
    const despesa = lancamento(2, { tipo: "despesa", categoria: "frete", data: "2026-11-16" });
    const alertas = gerarAlertas(estado({
      hoje: "2026-11-16",
      perfil: { ...perfil, ehMei: false, receitaInicialCentavos: 8_100_000 },
      lancamentos: [despesa],
    }));

    expect(alertas.map(({ chave }) => chave)).toEqual(["nota_faltando:2026"]);
  });

  it("gera alertas válidos, com chaves únicas e ordem estável, preservando a entrada", () => {
    const frete = Object.freeze(lancamento(2, { tipo: "despesa", categoria: "frete" }));
    const estoque = Object.freeze(lancamento(3, { tipo: "despesa", categoria: "estoque" }));
    const receita = Object.freeze(lancamento(4, { valorCentavos: 7_290_000 }));
    const entrada = Object.freeze(estado({
      hoje: "2026-11-16",
      perfil: Object.freeze({ ...perfil }),
      lancamentos: Object.freeze([estoque, frete, receita, Object.freeze({ ...frete })]),
    }));
    const antes = structuredClone(entrada);

    const alertas = gerarAlertas(entrada);

    expect(Alerta.array().parse(alertas)).toEqual(alertas);
    expect(alertas).toEqual([
      expect.objectContaining({ chave: "das_vencendo:2026-11", severidade: "info" }),
      expect.objectContaining({ chave: "limite_mei:2026:90", severidade: "atencao" }),
      expect.objectContaining({
        chave: "nota_faltando:2026",
        titulo: "2 despesas de estoque ou frete sem comprovante",
        lancamentoIds: [frete.id, estoque.id],
      }),
    ]);
    expect(gerarAlertas(entrada)).toEqual(alertas);
    expect(gerarAlertas({ ...entrada, lancamentos: [...entrada.lancamentos].reverse() })).toEqual(alertas);
    expect(entrada).toEqual(antes);
  });

  it.each(["2026-02-29", "2026-13-01", "24/11/2026", ""])("rejeita data de referência inválida %j", (hoje) => {
    expect(() => gerarAlertas(estado({ hoje }))).toThrow(RangeError);
  });

  it("rejeita perfil com abertura posterior à data de referência", () => {
    expect(() => gerarAlertas(estado({
      perfil: { ...perfil, dataAbertura: "2026-11-25" },
    }))).toThrow(RangeError);
  });
});
