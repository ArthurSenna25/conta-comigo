import { describe, expect, it } from "vitest";
import { Alerta } from "@/lib/contracts";

describe("Alerta", () => {
  const alerta = {
    chave: "nota_faltando:2026",
    tipo: "nota_faltando",
    severidade: "info",
    titulo: "2 despesas de estoque ou frete sem comprovante",
    mensagem: "Guarde os comprovantes, se estiverem disponíveis.",
    vencimento: null,
    lancamentoId: null,
  } satisfies Alerta;

  it("preserva lancamentoIds ao validar o alerta", () => {
    const agregado = {
      ...alerta,
      lancamentoIds: [
        "00000000-0000-4000-8000-000000000001",
        "00000000-0000-4000-8000-000000000002",
      ],
    };

    expect(Alerta.parse(agregado)).toStrictEqual(agregado);
  });

  it("aceita um alerta sem lancamentoIds", () => {
    expect(Alerta.parse(alerta)).toStrictEqual(alerta);
  });
});
