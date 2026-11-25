import { describe, expect, it } from "vitest";
import type { Lancamento, ResumoMes } from "@/lib/contracts";
import { resumoMes } from "./index";

const mes = "2026-11";
const resumoVazio: ResumoMes = {
  mes,
  receitaCentavos: 0,
  despesaCentavos: 0,
  saldoCentavos: 0,
  despesasPorCategoria: [],
};

function lancamento(
  numero: number,
  tipo: Lancamento["tipo"],
  valorCentavos: number,
  categoria: Lancamento["categoria"],
  data = "2026-11-15",
): Lancamento {
  return {
    id: `00000000-0000-4000-8000-${String(numero).padStart(12, "0")}`,
    tipo,
    valorCentavos,
    categoria,
    data,
    descricao: "Lançamento de teste",
    contraparte: null,
    formaPgto: null,
    origem: "manual",
    documentoId: null,
    criadoEm: `${data}T12:00:00Z`,
    atualizadoEm: `${data}T12:00:00Z`,
  };
}

const foraDoMes = [
  lancamento(1, "receita", 500, "vendas", "2026-10-31"),
  lancamento(2, "despesa", 600, "estoque", "2026-12-01"),
  lancamento(3, "despesa", 700, "aluguel", "2025-11-15"),
];

describe("resumoMes", () => {
  it("retorna um resumo zerado para uma lista vazia", () => {
    expect(resumoMes([], mes)).toEqual(resumoVazio);
  });

  it("ignora meses vizinhos e o mesmo mês de outro ano", () => {
    expect(resumoMes(foraDoMes, mes)).toEqual(resumoVazio);
  });

  it("inclui o primeiro e o último dia do mês", () => {
    const lancamentos = [
      ...foraDoMes,
      lancamento(4, "receita", 123, "vendas", "2026-11-01"),
      lancamento(5, "despesa", 45, "frete", "2026-11-30"),
    ];

    expect(resumoMes(lancamentos, mes)).toEqual({
      ...resumoVazio,
      receitaCentavos: 123,
      despesaCentavos: 45,
      saldoCentavos: 78,
      despesasPorCategoria: [{ categoria: "frete", totalCentavos: 45 }],
    });
  });

  it("soma receitas e despesas separadamente e agrupa apenas despesas", () => {
    const lancamentos = [
      lancamento(1, "receita", 101, "vendas"),
      lancamento(2, "receita", 202, "servicos_prestados"),
      lancamento(3, "despesa", 13, "estoque"),
      lancamento(4, "despesa", 27, "estoque"),
      lancamento(5, "despesa", 9, "frete"),
    ];

    expect(resumoMes(lancamentos, mes)).toEqual({
      mes,
      receitaCentavos: 303,
      despesaCentavos: 49,
      saldoCentavos: 254,
      despesasPorCategoria: [
        { categoria: "estoque", totalCentavos: 40 },
        { categoria: "frete", totalCentavos: 9 },
      ],
    });
  });

  it("retorna saldo igual à receita em um mês com apenas receitas", () => {
    expect(resumoMes([lancamento(1, "receita", 123, "vendas")], mes)).toEqual({
      ...resumoVazio,
      receitaCentavos: 123,
      saldoCentavos: 123,
    });
  });

  it("retorna saldo negativo em um mês com apenas despesas", () => {
    expect(resumoMes([lancamento(1, "despesa", 123, "frete")], mes)).toEqual({
      ...resumoVazio,
      despesaCentavos: 123,
      saldoCentavos: -123,
      despesasPorCategoria: [{ categoria: "frete", totalCentavos: 123 }],
    });
  });

  it("ordena por total decrescente e desempata pela ordem do enum Categoria", () => {
    const lancamentos = [
      lancamento(1, "despesa", 100, "aluguel"),
      lancamento(2, "despesa", 100, "estoque"),
      lancamento(3, "despesa", 200, "frete"),
    ];

    expect(resumoMes(lancamentos, mes).despesasPorCategoria).toEqual([
      { categoria: "frete", totalCentavos: 200 },
      { categoria: "estoque", totalCentavos: 100 },
      { categoria: "aluguel", totalCentavos: 100 },
    ]);
  });

  it("produz o mesmo resumo com os lançamentos em ordem inversa", () => {
    const lancamentos = [
      lancamento(1, "despesa", 100, "aluguel"),
      lancamento(2, "despesa", 100, "estoque"),
      lancamento(3, "receita", 123, "vendas"),
    ];

    expect(resumoMes([...lancamentos].reverse(), mes)).toEqual(resumoMes(lancamentos, mes));
  });

  it("preserva a lista e os objetos recebidos", () => {
    const lancamentos = Object.freeze([
      Object.freeze(lancamento(1, "despesa", 35, "frete", "2026-11-30")),
      Object.freeze(lancamento(2, "receita", 123, "vendas", "2026-11-01")),
    ]);
    const antes = lancamentos.map((item) => ({ ...item }));

    resumoMes(lancamentos, mes);

    expect(lancamentos).toEqual(antes);
  });

  it.each(["2026-00", "2026-13", "2026-1", ""])(
    "rejeita o mês inválido %j mesmo com lista vazia",
    (mesInvalido) => {
      expect(() => resumoMes([], mesInvalido)).toThrow(RangeError);
    },
  );

  // Nestes casos extremos, o primeiro valor sintético excede o teto individual
  // de Centavos para testar o acumulador sem criar milhões de lançamentos.
  it("preserva cada centavo até o maior inteiro seguro", () => {
    const lancamentos = [
      lancamento(1, "receita", Number.MAX_SAFE_INTEGER - 1, "vendas"),
      lancamento(2, "receita", 1, "vendas"),
      lancamento(3, "despesa", 1, "frete"),
    ];

    expect(resumoMes(lancamentos, mes)).toEqual({
      mes,
      receitaCentavos: Number.MAX_SAFE_INTEGER,
      despesaCentavos: 1,
      saldoCentavos: Number.MAX_SAFE_INTEGER - 1,
      despesasPorCategoria: [{ categoria: "frete", totalCentavos: 1 }],
    });
  });

  it.each(["receita", "despesa"] as const)("rejeita total de %s acima do maior inteiro seguro", (tipo) => {
    const categoria = tipo === "receita" ? "vendas" : "estoque";
    const lancamentos = [
      lancamento(1, tipo, Number.MAX_SAFE_INTEGER, categoria),
      lancamento(2, tipo, 1, categoria),
    ];

    expect(() => resumoMes(lancamentos, mes)).toThrow(RangeError);
  });
});
