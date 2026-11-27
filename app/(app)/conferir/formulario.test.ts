import { describe, expect, it } from "vitest";
import { LancamentoInput, VALOR_MAX_CENTAVOS, type Rascunho } from "@/lib/contracts";
import { centavosDoTextoColado, ERRO_COLAGEM, ERRO_COLAGEM_NEGATIVO } from "@/components/moeda";
import { mockIngest } from "@/lib/contracts/mocks";
import {
  centavosDigitados,
  erroDoValor,
  formDataDoLote,
  formularioDoRascunho,
  formularioManual,
  ORDEM_CATEGORIAS,
  validar,
  validarLote,
} from "./formulario";

const HOJE = "2026-11-25";
const rascunho = (parcial: Partial<Rascunho> = {}): Rascunho => ({ ...mockIngest.rascunhos[0], ...parcial });

describe("centavosDigitados (centavos entram primeiro)", () => {
  it("lê só dígitos como centavos", () => {
    expect(centavosDigitados("1")).toBe(1);
    expect(centavosDigitados("12000")).toBe(12_000);
    expect(centavosDigitados("120,00")).toBe(12_000);
    expect(centavosDigitados("1.234,56")).toBe(123_456);
  });

  it("vazio, só zeros ou lixo viram 0", () => {
    expect(centavosDigitados("")).toBe(0);
    expect(centavosDigitados("000")).toBe(0);
    expect(centavosDigitados("abc")).toBe(0);
  });

  it("ignora zeros à esquerda e NÃO corta dígitos", () => {
    expect(centavosDigitados("0012")).toBe(12);
    expect(centavosDigitados("1234567890")).toBe(1_234_567_890);
    expect(centavosDigitados("10.000.000,00")).toBe(1_000_000_000);
  });
});

describe("centavosDoTextoColado (só valor claro; resto não altera o campo)", () => {
  it.each([
    ["10.000.000,00", 1_000_000_000],
    ["10000000,00", 1_000_000_000],
    ["10000000.00", 1_000_000_000],
    ["1.000.000,00", 100_000_000],
    ["1,000,000.00", 100_000_000],
    ["1.234,56", 123_456],
    ["1,234.56", 123_456],
    ["10,5", 1_050],
    ["10.5", 1_050],
    ["10,50", 1_050],
    ["R$ 34.020,00", 3_402_000],
    ["1.000", 100_000],
    ["1,000", 100_000],
    ["12", 1_200],
    [" 99999999,99 ", 9_999_999_999],
  ])("aceita %s → %i centavos", (texto, esperado) => {
    expect(centavosDoTextoColado(texto)).toEqual({ ok: true, centavos: esperado });
  });

  it.each(["1,2345", "1.2345", "1.2.3,4", "abc", "12abc", "", "   ", "R$", "10,", ",50", "1.000.50"])(
    "recusa %j com a mensagem geral",
    (texto) => {
      expect(centavosDoTextoColado(texto)).toEqual({ ok: false, erro: ERRO_COLAGEM });
    },
  );

  it.each(["-10,50", "-10.5", "R$ -10,50"])("recusa negativo %s", (texto) => {
    expect(centavosDoTextoColado(texto)).toEqual({ ok: false, erro: ERRO_COLAGEM_NEGATIVO });
  });

  it("o teto passa e +1 centavo é decidido por erroDoValor, não pela colagem", () => {
    const teto = centavosDoTextoColado("10.000.000,00");
    expect(teto).toEqual({ ok: true, centavos: VALOR_MAX_CENTAVOS });
    expect(centavosDoTextoColado("10.000.000,01")).toEqual({ ok: true, centavos: VALOR_MAX_CENTAVOS + 1 });
  });

  it("rejeição não altera o valor anterior (o chamador só aplica quando ok)", () => {
    let valor = 12_345;
    const colar = (t: string) => {
      const r = centavosDoTextoColado(t);
      if (r.ok) valor = r.centavos;
    };
    colar("-10,50");
    colar("1,2345");
    colar("abc");
    expect(valor).toBe(12_345);
    colar("10,5");
    expect(valor).toBe(1_050);
  });
});

describe("teto do valor (contrato)", () => {
  const form = (valorCentavos: number) => ({ ...formularioManual(HOJE), valorCentavos, descricao: "x" });

  it("R$ 10.000.000,00 (o teto) é aceito", () => {
    expect(validar(form(VALOR_MAX_CENTAVOS), HOJE).ok).toBe(true);
    expect(erroDoValor(VALOR_MAX_CENTAVOS)).toBeUndefined();
  });

  it("acima do teto mantém o valor e bloqueia com erro claro citando o limite", () => {
    const r = validar(form(VALOR_MAX_CENTAVOS + 1), HOJE);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.valor).toMatch(/^Valor acima do limite permitido \(R\$\s10\.000\.000,00\)$/);
    expect(centavosDigitados("10.000.000,01")).toBe(VALOR_MAX_CENTAVOS + 1);
  });
});

describe("rascunho → formulário", () => {
  it("copia os campos lidos e mantém a origem do rascunho", () => {
    const f = formularioDoRascunho(rascunho({ origem: "texto" }));
    expect(f).toMatchObject({ tipo: "receita", data: "2026-11-23", valorCentavos: 120_000, categoria: "vendas", origem: "texto" });
    expect(f.dataDuvidosa).toBe(false);
    expect(f.valorDuvidoso).toBe(false);
  });

  it("campo null da IA fica vazio e marcado para conferir", () => {
    const f = formularioDoRascunho(rascunho({ data: null, valorCentavos: null, confianca: { data: 0, valor: 0, categoria: 1 } }));
    expect(f.data).toBe("");
    expect(f.valorCentavos).toBe(0);
    expect(f.dataDuvidosa).toBe(true);
    expect(f.valorDuvidoso).toBe(true);
  });

  it("data lida com confiança baixa fica em dúvida (âmbar)", () => {
    const f = formularioDoRascunho(rascunho({ confianca: { data: 0.4, valor: 0.95, categoria: 0.9 } }));
    expect(f.data).toBe("2026-11-23");
    expect(f.dataDuvidosa).toBe(true);
  });

  it("manual: origem do contrato para digitação, data de hoje e valor vazio", () => {
    expect(formularioManual(HOJE)).toMatchObject({ origem: "manual", data: HOJE, valorCentavos: 0, tipo: "receita" });
  });

  it("ordem das categorias: as 4 do handoff primeiro, depois as demais, sem faltar nenhuma", () => {
    expect(ORDEM_CATEGORIAS.slice(0, 4)).toEqual(["servicos_prestados", "vendas", "material_consumo", "outras"]);
    expect([...ORDEM_CATEGORIAS].sort()).toEqual([...LancamentoInput.shape.categoria.options].sort());
  });
});

describe("validar", () => {
  it("valor 0 → 'Digite um valor maior que zero'", () => {
    const r = validar({ ...formularioManual(HOJE), descricao: "Corte" }, HOJE);
    expect(r).toEqual({ ok: false, erros: { valor: "Digite um valor maior que zero" } });
  });

  it("data vazia ou futura é recusada", () => {
    const base = { ...formularioManual(HOJE), descricao: "Corte", valorCentavos: 100 };
    expect(validar({ ...base, data: "" }, HOJE)).toMatchObject({ ok: false, erros: { data: "Informe a data" } });
    expect(validar({ ...base, data: "2026-11-26" }, HOJE)).toMatchObject({ ok: false, erros: { data: "A data não pode ser no futuro" } });
  });

  it("descrição em branco é recusada", () => {
    const r = validar({ ...formularioManual(HOJE), valorCentavos: 100, descricao: "   " }, HOJE);
    expect(r).toMatchObject({ ok: false, erros: { descricao: "Descreva o lançamento" } });
  });

  it("válido vira LancamentoInput sem os campos de dúvida e com contraparte vazia como null", () => {
    const r = validar({ ...formularioDoRascunho(rascunho()), contraparte: "  ", dataDuvidosa: true }, HOJE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lancamento).toEqual({
      tipo: "receita",
      data: "2026-11-23",
      valorCentavos: 120_000,
      categoria: "vendas",
      descricao: "Vendas no cartão",
      contraparte: null,
      formaPgto: "cartao",
      origem: "audio",
    });
  });
});

describe("lote", () => {
  it("todos válidos: uma lista na ordem dos rascunhos", () => {
    const r = validarLote(mockIngest.rascunhos.map(formularioDoRascunho), HOJE);
    expect(r.ok && r.lancamentos.map((l) => l.descricao)).toEqual(["Vendas no cartão", "Frete"]);
  });

  it("para no primeiro inválido e diz qual", () => {
    const forms = mockIngest.rascunhos.map(formularioDoRascunho);
    const r = validarLote([forms[0], { ...forms[1], valorCentavos: 0 }], HOJE);
    expect(r).toEqual({ ok: false, indice: 1, erros: { valor: "Digite um valor maior que zero" } });
  });

  it("FormData leva o lote em JSON no campo `lancamentos`", () => {
    const r = validarLote(mockIngest.rascunhos.map(formularioDoRascunho), HOJE);
    if (!r.ok) throw new Error("lote deveria ser válido");
    const fd = formDataDoLote(r.lancamentos);
    expect(JSON.parse(String(fd.get("lancamentos")))).toEqual(r.lancamentos);
  });
});
