// Guarda do modo mock: a flag só pode ser lida em lib/security/modo-mock.ts (que falha fechado fora de
// development/test). Qualquer outra leitura, ou import de USE_MOCKS, contorna a proteção de produção:
// o Next inlina NEXT_PUBLIC_* no build, então um `true` esquecido serviria o usuário falso em produção.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZES = ["app", "actions", "components", "lib", "proxy.ts"];
const LE_A_FLAG = ["lib/security/modo-mock.ts", "lib/contracts/mocks.ts"];
const DEFINE_USE_MOCKS = "lib/contracts/mocks.ts";

function fontes(raiz: string): string[] {
  const norm = (p: string) => p.replaceAll("\\", "/");
  if (/\.tsx?$/.test(raiz)) return [raiz];
  return readdirSync(raiz, { recursive: true, encoding: "utf8" })
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => norm(join(raiz, f)));
}

type Violacao = { arquivo: string; motivo: string };

const semComentarios = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

function violacoesDoModoMock(arquivo: string, fonte: string): Violacao[] {
  const src = semComentarios(fonte);
  const v: Violacao[] = [];
  if (src.includes("NEXT_PUBLIC_USE_MOCKS") && !LE_A_FLAG.includes(arquivo)) {
    v.push({ arquivo, motivo: "lê NEXT_PUBLIC_USE_MOCKS: use modoMock() de @/lib/security/modo-mock" });
  }
  if (/\bUSE_MOCKS\b/.test(src) && arquivo !== DEFINE_USE_MOCKS) {
    v.push({ arquivo, motivo: "usa USE_MOCKS (sem guarda de produção): use modoMock()" });
  }
  return v;
}

describe("modo mock: única porta é modoMock()", () => {
  it("nenhum arquivo de app, actions, components, lib ou proxy lê a flag por fora", () => {
    const violacoes = RAIZES.filter((r) => existsSync(r)).flatMap(fontes).flatMap((arq) => violacoesDoModoMock(arq, readFileSync(arq, "utf8")));
    expect(violacoes).toEqual([]);
  });

  it("o detector pega leitura direta da flag e uso de USE_MOCKS", () => {
    const leitura = 'const m = process.env.NEXT_PUBLIC_USE_MOCKS === "true";';
    const importa = 'import { USE_MOCKS } from "@/lib/contracts";';
    expect(violacoesDoModoMock("actions/x.ts", leitura)).toHaveLength(1);
    expect(violacoesDoModoMock("app/y.tsx", importa)).toHaveLength(1);
    expect(violacoesDoModoMock("actions/z.ts", "// usa NEXT_PUBLIC_USE_MOCKS\n/** USE_MOCKS */")).toEqual([]);
    expect(violacoesDoModoMock("lib/security/modo-mock.ts", leitura)).toEqual([]);
    expect(violacoesDoModoMock("lib/contracts/mocks.ts", `${leitura}\nexport const USE_MOCKS = 1;`)).toEqual([]);
  });
});
