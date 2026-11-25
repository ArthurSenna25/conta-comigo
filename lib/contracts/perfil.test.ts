import { describe, expect, it } from "vitest";
import { perfilInputCom } from "./perfil";

const base = {
  nomeNegocio: "Loja da Ana",
  ehMei: true,
  atividade: "comercio",
  uf: "SP",
  municipio: "Sao Paulo",
  receitaInicialCentavos: 0,
} as const;
const schema = perfilInputCom(() => "2026-11-24");

describe("PerfilInput.dataAbertura", () => {
  it("aceita hoje", () => {
    expect(schema.safeParse({ ...base, dataAbertura: "2026-11-24" }).success).toBe(true);
  });
  it("aceita ontem", () => {
    expect(schema.safeParse({ ...base, dataAbertura: "2026-11-23" }).success).toBe(true);
  });
  it("recusa amanhã com a mensagem do contrato", () => {
    const r = schema.safeParse({ ...base, dataAbertura: "2026-11-25" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]).toMatchObject({
        message: "A data de abertura não pode ser futura",
        path: ["dataAbertura"],
      });
    }
  });
});
