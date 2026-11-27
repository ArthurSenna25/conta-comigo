import { describe, expect, it } from "vitest";
import { mockIngest } from "@/lib/contracts/mocks";
import { FLUXO_INICIAL, fluxo } from "./fluxo-lancamento";

describe("estado entre /adicionar, /conferir e /painel", () => {
  it("guardar leva os rascunhos para o /conferir e apaga aviso antigo", () => {
    const e = fluxo({ ...FLUXO_INICIAL, aviso: { titulo: "velho" } }, { tipo: "guardar", rascunhos: mockIngest.rascunhos });
    expect(e).toEqual({ rascunhos: mockIngest.rascunhos, aviso: null });
  });

  it("lista vazia não conta como rascunho (o /conferir redireciona)", () => {
    expect(fluxo(FLUXO_INICIAL, { tipo: "guardar", rascunhos: [] }).rascunhos).toBeNull();
  });

  it("concluir limpa os rascunhos (não reconfirma) e deixa o aviso para o painel", () => {
    const comRascunhos = fluxo(FLUXO_INICIAL, { tipo: "guardar", rascunhos: mockIngest.rascunhos });
    expect(fluxo(comRascunhos, { tipo: "concluir", aviso: { titulo: "Lançamento salvo" } })).toEqual({
      rascunhos: null,
      aviso: { titulo: "Lançamento salvo" },
    });
  });

  it("avisoVisto some com o aviso e não troca o estado à toa", () => {
    const comAviso = fluxo(FLUXO_INICIAL, { tipo: "concluir", aviso: { titulo: "Lançamento salvo" } });
    expect(fluxo(comAviso, { tipo: "avisoVisto" }).aviso).toBeNull();
    expect(fluxo(FLUXO_INICIAL, { tipo: "avisoVisto" })).toBe(FLUXO_INICIAL);
  });
});
