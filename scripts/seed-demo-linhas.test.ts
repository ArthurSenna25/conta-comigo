import { describe, expect, it } from "vitest";
import { LancamentoInput, PerfilInput, VERSAO_CONSENTIMENTO } from "@/lib/contracts";
import { mockLancamentos, mockPerfil } from "@/lib/contracts/mocks";
import { montarLinhasDoSeed } from "./seed-demo-linhas";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const linhas = () =>
  montarLinhasDoSeed({ userId: USER_ID, perfil: mockPerfil, lancamentos: mockLancamentos, versao: VERSAO_CONSENTIMENTO });

describe("montarLinhasDoSeed: linhas da conta de demo (sem rede)", () => {
  it("perfil: dono é o usuário da demo e os campos casam com as colunas do banco", () => {
    const { perfil } = linhas();
    expect(perfil).toEqual({
      user_id: USER_ID,
      nome_negocio: mockPerfil.nomeNegocio,
      eh_mei: mockPerfil.ehMei,
      atividade: mockPerfil.atividade,
      uf: mockPerfil.uf,
      municipio: mockPerfil.municipio,
      data_abertura: mockPerfil.dataAbertura,
      receita_inicial_centavos: mockPerfil.receitaInicialCentavos,
    });
  });

  it("lançamentos: um por mock, todos do usuário da demo, sem id nem documento dos mocks", () => {
    const { lancamentos } = linhas();
    expect(lancamentos).toHaveLength(mockLancamentos.length);
    expect(lancamentos.every((l) => l.user_id === USER_ID)).toBe(true);
    // os documentos dos mocks não existem no banco: a FK composta recusaria
    expect(lancamentos.every((l) => l.documento_id === null)).toBe(true);
    expect(lancamentos.every((l) => !("id" in l))).toBe(true);
  });

  it("lançamentos: valores e datas dos mocks passam nos schemas Zod e nos limites do banco", () => {
    for (const l of linhas().lancamentos) {
      expect(l.valor_centavos).toBeGreaterThan(0);
      expect(l.valor_centavos).toBeLessThanOrEqual(1_000_000_000);
      expect(
        LancamentoInput.safeParse({
          tipo: l.tipo,
          data: l.data,
          valorCentavos: l.valor_centavos,
          categoria: l.categoria,
          descricao: l.descricao,
          contraparte: l.contraparte,
          formaPgto: l.forma_pgto,
          origem: l.origem,
        }).success,
      ).toBe(true);
    }
  });

  it("os mocks usados no seed são um perfil válido (PerfilInput)", () => {
    expect(PerfilInput.safeParse(mockPerfil).success).toBe(true);
  });

  it("consentimentos: as 3 finalidades vigentes, na versão atual", () => {
    const { consentimentos } = linhas();
    expect(consentimentos.map((c) => c.finalidade).sort()).toEqual(["envio_ia", "privacidade", "termos_uso"]);
    expect(consentimentos.every((c) => c.versao === VERSAO_CONSENTIMENTO && c.user_id === USER_ID)).toBe(true);
    expect(consentimentos.every((c) => !("revogado_em" in c))).toBe(true);
  });
});
