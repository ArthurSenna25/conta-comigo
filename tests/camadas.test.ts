// Rede de segurança da regra de camadas (o ESLint é a primeira).
// Allowlist: lib/contracts e lib/engine só importam o que está aqui.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PERMITIDOS: Record<string, (spec: string) => boolean> = {
  "lib/contracts": (s) => s === "zod" || s.startsWith("./"),
  "lib/engine": (s) =>
    s === "zod" || s.startsWith("./") || s === "@/lib/contracts" || s.startsWith("@/lib/contracts/"),
};

const IMPORT = /(?:from\s*|import\s*\(\s*|import\s+|require\s*\(\s*)["']([^"']+)["']/g;

function arquivos(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => join(dir, f));
}

describe("camadas puras", () => {
  for (const [dir, permitido] of Object.entries(PERMITIDOS)) {
    it(`${dir} só importa o permitido`, () => {
      const violacoes = arquivos(dir).flatMap((arq) =>
        [...readFileSync(arq, "utf8").matchAll(IMPORT)]
          .map((m) => m[1])
          .filter((spec) => !permitido(spec))
          .map((spec) => `${arq} -> ${spec}`),
      );
      expect(violacoes).toEqual([]);
    });
  }

  it("o detector pega import proibido", () => {
    const src = 'import { x } from "next/server";\nimport type { Y } from "./ok";';
    const specs = [...src.matchAll(IMPORT)].map((m) => m[1]);
    expect(specs.filter((s) => !PERMITIDOS["lib/engine"](s))).toEqual(["next/server"]);
  });
});
