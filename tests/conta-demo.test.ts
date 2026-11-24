// A conta de demo é compartilhada: trocar e-mail/senha e excluir conta NÃO valem para ela. Hoje nenhuma
// action faz isso; esta rede de segurança falha no dia em que alguém criar uma sem chamar o bloqueio.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZES = ["app", "actions", "components", "lib"];
// Operações de conta do Supabase Auth (admin ou do usuário): trocar e-mail/senha, excluir, redefinir senha.
const OPERACAO_DE_CONTA = /\.(updateUser|deleteUser|resetPasswordForEmail)\s*\(/;

const norm = (p: string) => p.replaceAll("\\", "/");
const semComentarios = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

function fontes(raiz: string): string[] {
  return readdirSync(raiz, { recursive: true, encoding: "utf8" })
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => norm(join(raiz, f)));
}

/** Arquivo que mexe na conta do usuário sem chamar bloqueioDaContaDemo(). */
function semBloqueio(fonte: string): boolean {
  const codigo = semComentarios(fonte);
  return OPERACAO_DE_CONTA.test(codigo) && !/\bbloqueioDaContaDemo\s*\(/.test(codigo);
}

describe("conta de demo: operações de conta exigem bloqueioDaContaDemo()", () => {
  it("nenhum arquivo troca e-mail/senha ou exclui conta sem chamar o bloqueio", () => {
    const violacoes = RAIZES.filter((r) => existsSync(r))
      .flatMap(fontes)
      .filter((arq) => semBloqueio(readFileSync(arq, "utf8")));
    expect(violacoes).toEqual([]);
  });

  it("o detector pega operação de conta sem bloqueio e aceita com bloqueio ou só em comentário", () => {
    expect(semBloqueio("await db.auth.updateUser({ password: nova });")).toBe(true);
    expect(semBloqueio("await admin.auth.admin.deleteUser(id);")).toBe(true);
    expect(semBloqueio("await db.auth.resetPasswordForEmail(email);")).toBe(true);
    expect(semBloqueio("const b = bloqueioDaContaDemo(demo);\nawait db.auth.updateUser({ password: nova });")).toBe(false);
    expect(semBloqueio("// depois chame auth.updateUser(\nexport const x = 1;")).toBe(false);
    expect(semBloqueio("await db.auth.signOut();")).toBe(false);
  });
});
