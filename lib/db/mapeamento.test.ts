import { describe, expect, it } from "vitest";
import type { LancamentoInput, PerfilInput } from "@/lib/contracts";
import { extensaoDoMime, lancamentoParaLinha, linhaParaLancamento, linhaParaPerfil, perfilParaLinha } from "./mapeamento";

const USER = "0b0c7f0e-8f5e-4d6f-9d8e-1a2b3c4d5e6f";
const ID = "5d1f1a0e-3b7a-4a55-8f0a-6f3f0f6a9c11";

const input: LancamentoInput = {
  tipo: "despesa",
  data: "2026-11-10",
  valorCentavos: 12345,
  categoria: "aluguel",
  descricao: "Aluguel",
  contraparte: null,
  formaPgto: "pix",
  origem: "manual",
};

describe("lancamento ↔ linha", () => {
  it("vai para snake_case com user_id e documento_id, sem campos de sistema", () => {
    expect(lancamentoParaLinha(USER, input, null)).toEqual({
      user_id: USER,
      documento_id: null,
      tipo: "despesa",
      data: "2026-11-10",
      valor_centavos: 12345,
      categoria: "aluguel",
      descricao: "Aluguel",
      contraparte: null,
      forma_pgto: "pix",
      origem: "manual",
    });
  });

  it("volta para o contrato (camelCase) e valida a linha", () => {
    const linha = {
      id: ID,
      user_id: USER,
      documento_id: null,
      tipo: "despesa",
      data: "2026-11-10",
      valor_centavos: 12345,
      categoria: "aluguel",
      descricao: "Aluguel",
      contraparte: null,
      forma_pgto: "pix",
      origem: "manual",
      criado_em: "2026-11-24T13:30:00.123456+00:00",
      atualizado_em: "2026-11-24T13:30:00.123456+00:00",
    };
    expect(linhaParaLancamento(linha)).toMatchObject({ id: ID, valorCentavos: 12345, formaPgto: "pix", documentoId: null });
  });

  it("linha fora do contrato (categoria inventada) não passa em silêncio", () => {
    expect(() => linhaParaLancamento({ id: ID, categoria: "inventada" })).toThrow();
  });
});

describe("perfil ↔ linha", () => {
  const perfil: PerfilInput = {
    nomeNegocio: "Loja",
    ehMei: true,
    atividade: "comercio",
    uf: "SP",
    municipio: "Sao Paulo",
    dataAbertura: "2024-01-15",
    receitaInicialCentavos: 5000,
  };

  it("ida e volta preservam os campos", () => {
    const linha = perfilParaLinha(USER, perfil);
    expect(linha).toMatchObject({ user_id: USER, nome_negocio: "Loja", eh_mei: true, receita_inicial_centavos: 5000 });
    expect(linhaParaPerfil({ ...linha, criado_em: "2026-11-24T13:30:00+00:00", atualizado_em: "2026-11-24T13:30:00+00:00" })).toEqual({
      ...perfil,
      userId: USER,
      criadoEm: "2026-11-24T13:30:00+00:00",
    });
  });
});

describe("extensaoDoMime", () => {
  it("cobre só os três tipos aceitos", () => {
    expect(extensaoDoMime("image/jpeg")).toBe("jpg");
    expect(extensaoDoMime("image/png")).toBe("png");
    expect(extensaoDoMime("image/webp")).toBe("webp");
    expect(() => extensaoDoMime("image/gif")).toThrow();
  });
});
