import { describe, expect, it } from "vitest";
import { modoMock } from "./modo-mock";

describe("modoMock", () => {
  it.each(["development", "test", undefined])("liga com a flag em true fora de produção (NODE_ENV=%s)", (nodeEnv) => {
    expect(modoMock({ NEXT_PUBLIC_USE_MOCKS: "true", NODE_ENV: nodeEnv })).toBe(true);
  });

  it("fica desligado sem a flag, em qualquer ambiente", () => {
    expect(modoMock({ NODE_ENV: "development" })).toBe(false);
    expect(modoMock({ NODE_ENV: "production" })).toBe(false);
    expect(modoMock({})).toBe(false);
  });

  it.each(["false", "1", "TRUE", "True", "yes", " true", ""])("só o texto exato 'true' liga (%j)", (valor) => {
    expect(modoMock({ NEXT_PUBLIC_USE_MOCKS: valor, NODE_ENV: "development" })).toBe(false);
  });

  it("em produção com a flag ligada, falha alto e claro (nunca devolve true)", () => {
    expect(() => modoMock({ NEXT_PUBLIC_USE_MOCKS: "true", NODE_ENV: "production" })).toThrow(
      /NEXT_PUBLIC_USE_MOCKS.*produ/i,
    );
  });

  it("em produção a flag com valor diferente de 'true' não derruba o app", () => {
    expect(modoMock({ NEXT_PUBLIC_USE_MOCKS: "false", NODE_ENV: "production" })).toBe(false);
  });
});
