// O portão (exigirAcesso) é opt-in por página: nada no proxy confere consentimento nem perfil, e layout
// não re-renderiza a cada navegação (docs do Next, "Layouts and auth checks"). Esta rede de segurança
// falha se alguém criar uma página nova sem chamar o portão e sem declará-la pública aqui.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Páginas públicas por desenho (espelham lib/security/rotas.ts). Mudou aqui, mude lá. */
const PUBLICAS = [
  /^app\/page\.tsx$/,
  /^app\/\(auth\)\/entrar\/page\.tsx$/,
  /^app\/\(auth\)\/cadastrar\/page\.tsx$/,
  /^app\/\(marketing\)\//,
  /^app\/legal\//,
];

const norm = (p: string) => p.replaceAll("\\", "/");

function paginas(): string[] {
  if (!existsSync("app")) return [];
  return readdirSync("app", { recursive: true, encoding: "utf8" })
    .map((f) => norm(join("app", f)))
    .filter((f) => /\/page\.tsx$/.test(f));
}

/** Páginas protegidas que não chamam exigirAcesso( — comentário não conta. */
function semPortao(arquivo: string, fonte: string): string | null {
  if (PUBLICAS.some((re) => re.test(arquivo))) return null;
  const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  return /\bexigirAcesso\s*\(/.test(codigo) ? null : arquivo;
}

/** Páginas protegidas que não renderizam <FaixaDemo — a conta de demo precisa do aviso em toda tela. */
function semFaixaDemo(arquivo: string, fonte: string): string | null {
  if (PUBLICAS.some((re) => re.test(arquivo))) return null;
  const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  return /<FaixaDemo\b/.test(codigo) ? null : arquivo;
}

describe("faixa da conta de demo em toda página protegida", () => {
  it("cada page.tsx fora da lista pública renderiza <FaixaDemo>", () => {
    const sem = paginas().flatMap((arq) => semFaixaDemo(arq, readFileSync(arq, "utf8")) ?? []);
    expect(sem).toEqual([]);
  });

  it("o detector pega página sem a faixa e ignora comentário", () => {
    expect(semFaixaDemo("app/(app)/x/page.tsx", "export default function P() { return null }")).not.toBeNull();
    expect(semFaixaDemo("app/(app)/x/page.tsx", "// <FaixaDemo demo />\nexport default function P() {}")).not.toBeNull();
    expect(semFaixaDemo("app/(app)/x/page.tsx", "return <FaixaDemo demo={demo} />;")).toBeNull();
    expect(semFaixaDemo("app/legal/termos/page.tsx", "export default function P() {}")).toBeNull();
  });
});

describe("portão de acesso em toda página protegida", () => {
  it("cada page.tsx fora da lista pública chama exigirAcesso()", () => {
    const sem = paginas().flatMap((arq) => semPortao(arq, readFileSync(arq, "utf8")) ?? []);
    expect(sem).toEqual([]);
  });

  it("existem páginas protegidas para verificar (o teste não passa no vazio)", () => {
    const protegidas = paginas().filter((p) => !PUBLICAS.some((re) => re.test(p)));
    expect(protegidas.length).toBeGreaterThanOrEqual(3);
  });

  it("o detector pega página protegida sem portão e ignora menção em comentário", () => {
    expect(semPortao("app/(app)/x/page.tsx", "export default function P() { return null }")).toBe("app/(app)/x/page.tsx");
    expect(semPortao("app/(app)/x/page.tsx", "// chama exigirAcesso()\nexport default function P() {}")).not.toBeNull();
    expect(semPortao("app/(app)/x/page.tsx", "await exigirAcesso();")).toBeNull();
    expect(semPortao("app/legal/termos/page.tsx", "export default function P() {}")).toBeNull();
  });
});
