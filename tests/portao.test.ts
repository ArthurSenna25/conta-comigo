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

const ehRoute = (f: string) => /\/route\.ts$/.test(f);

/** route.ts de app/api: o proxy só barra quem não tem sessão; consentimento, Origin e perfil são do portão de API. */
function rotas(): string[] {
  if (!existsSync("app")) return [];
  return readdirSync("app", { recursive: true, encoding: "utf8" })
    .map((f) => norm(join("app", f)))
    .filter(ehRoute);
}

/**
 * Rotas com portão PRÓPRIO, fora do exigirAcessoApi. /api/ingest (Gui, PR #10) faz Origin em processar.ts e sessão,
 * consentimento, perfil e teto de IA em acesso.ts (autorizarIngestao). TODO: extrair a parte comum com exigirAcessoApi
 * (commit separado) e remover esta exceção.
 */
const PORTAO_PROPRIO = new Set(["app/api/ingest/route.ts"]);

const METODO = "(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)";
const semComentarios = (fonte: string) => fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/**
 * Problema do route.ts, ou null. Cada handler exportado precisa de uma chamada a exigirAcessoApi( (por contagem,
 * sem AST); `export const POST =` e reexport são proibidos porque escapam da contagem; rota que importa lib/ai
 * precisa de `ia: true`. Heurística: não prova que o Response é devolvido; o code review cobre isso.
 */
function problemaDeRota(arquivo: string, fonte: string): string | null {
  if (PORTAO_PROPRIO.has(arquivo)) return null;
  const codigo = semComentarios(fonte);
  if (new RegExp(String.raw`export\s+const\s+${METODO}\b|export\s*\{[^}]*\b${METODO}\b`).test(codigo)) {
    return `${arquivo}: use "export async function METODO", nunca const nem reexport`;
  }
  const handlers = codigo.match(new RegExp(String.raw`export\s+(?:async\s+)?function\s+${METODO}\b`, "g"))?.length ?? 0;
  const chamadas = codigo.match(/\bexigirAcessoApi\s*\(/g)?.length ?? 0;
  if (chamadas < Math.max(handlers, 1)) return `${arquivo}: cada handler chama exigirAcessoApi(`;
  if (/@\/lib\/ai\b/.test(codigo) && !/\bia\s*:\s*true\b/.test(codigo)) {
    return `${arquivo}: rota de IA usa exigirAcessoApi(req, { ia: true })`;
  }
  return null;
}

describe("portão de API em todo route.ts", () => {
  it("cada route.ts passa pelo portão", () => {
    const problemas = rotas().flatMap((arq) => problemaDeRota(arq, readFileSync(arq, "utf8")) ?? []);
    expect(problemas).toEqual([]);
  });

  it("pega route.ts sem portão e ignora menção em comentário", () => {
    expect(problemaDeRota("r.ts", "export async function POST() {}")).not.toBeNull();
    expect(problemaDeRota("r.ts", "// exigirAcessoApi(req)\nexport async function POST() {}")).not.toBeNull();
    expect(problemaDeRota("r.ts", "export async function POST(r) { await exigirAcessoApi(r); }")).toBeNull();
  });

  it("pega handler sem portão quando outro tem, const e reexport", () => {
    const dois = "export async function GET(r) { await exigirAcessoApi(r) }\nexport async function POST() {}";
    expect(problemaDeRota("r.ts", dois)).not.toBeNull();
    expect(problemaDeRota("r.ts", "export const POST = async () => { exigirAcessoApi() }")).not.toBeNull();
    expect(problemaDeRota("r.ts", "export { POST } from './x'")).not.toBeNull();
  });

  it("rota que importa lib/ai exige ia: true", () => {
    const base = 'import { x } from "@/lib/ai/y";\nexport async function POST(r) { await exigirAcessoApi(r%S) }';
    expect(problemaDeRota("r.ts", base.replace("%S", ""))).not.toBeNull();
    expect(problemaDeRota("r.ts", base.replace("%S", ", { ia: true }"))).toBeNull();
  });

  it("ehRoute enxerga subpastas e ignora route.test.ts", () => {
    expect(ehRoute("app/api/ingest/route.ts")).toBe(true);
    expect(ehRoute("app/api/ingest/route.test.ts")).toBe(false);
  });
});

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
