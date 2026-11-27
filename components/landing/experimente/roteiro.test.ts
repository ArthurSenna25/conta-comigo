import { describe, expect, it } from "vitest";
import { type AcaoSimulacao, ESTADO_INICIAL, PAINEL_FICTICIO, RASCUNHO_FAKE, roteiro } from "./roteiro";

const rodar = (...acoes: AcaoSimulacao[]) => acoes.reduce(roteiro, ESTADO_INICIAL);

describe("roteiro da simulação", () => {
  it("o roteiro completo soma o rascunho ao faturado", () => {
    const fim = rodar("escrever", "enviar", "rascunhoPronto", "confirmar");
    expect(fim.etapa).toBe("confirmado");
    expect(fim.faturadoCentavos).toBe(PAINEL_FICTICIO.faturadoCentavos + RASCUNHO_FAKE.valorCentavos);
  });

  it("confirmar duas vezes não soma duas vezes", () => {
    const fim = rodar("escrever", "enviar", "rascunhoPronto", "confirmar", "confirmar");
    expect(fim.faturadoCentavos).toBe(PAINEL_FICTICIO.faturadoCentavos + RASCUNHO_FAKE.valorCentavos);
  });

  it("ação fora de ordem não muda nada", () => {
    expect(rodar("confirmar")).toBe(ESTADO_INICIAL);
    expect(rodar("rascunhoPronto")).toBe(ESTADO_INICIAL);
    expect(rodar("escrever", "confirmar").etapa).toBe("escrever");
  });

  it("recomeçar volta ao painel inicial", () => {
    expect(rodar("escrever", "enviar", "rascunhoPronto", "confirmar", "recomecar")).toEqual(ESTADO_INICIAL);
  });
});
