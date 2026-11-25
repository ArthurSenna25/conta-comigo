import { describe, expect, it } from "vitest";
import { gravarLeve, lerLeve } from "./preferencias";

const quebrado = () => {
  throw new DOMException("bloqueado", "SecurityError");
};

function memoria() {
  const dados = new Map<string, string>();
  return {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, v),
  };
}

describe("modo leve no localStorage", () => {
  it("grava e lê a escolha", () => {
    const m = memoria();
    expect(lerLeve(() => m)).toBe(false);
    expect(gravarLeve(() => m, true)).toBe(true);
    expect(lerLeve(() => m)).toBe(true);
    gravarLeve(() => m, false);
    expect(lerLeve(() => m)).toBe(false);
  });

  it("não quebra se o localStorage lançar erro (acesso ou escrita)", () => {
    expect(lerLeve(quebrado)).toBe(false);
    expect(gravarLeve(quebrado, true)).toBe(false);
    const cheio = { getItem: quebrado, setItem: quebrado };
    expect(lerLeve(() => cheio)).toBe(false);
    expect(gravarLeve(() => cheio, true)).toBe(false);
  });
});
