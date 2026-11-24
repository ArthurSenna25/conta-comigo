/**
 * Teste de RLS contra o projeto Supabase linkado (rede + segredos): NÃO roda no `pnpm check`.
 * Uso: `pnpm test:rls` (o Node carrega .env.local; este arquivo só lê process.env).
 * Cria 2 usuários descartáveis (A e B) e apaga tudo no fim, mesmo se um teste falhar.
 */
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishableKey || !secretKey) {
  throw new Error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou SUPABASE_SECRET_KEY. Rode com `pnpm test:rls`.",
  );
}

const SEM_SESSAO = { auth: { persistSession: false, autoRefreshToken: false } } as const;
const BUCKET = "documentos";
const MIB = 1024 * 1024;
const PERMISSAO_NEGADA = "42501"; // RLS (with check) ou GRANT ausente
const VIOLACAO_FK = "23503";
const VIOLACAO_CHECK = "23514";

const admin = createClient(url, secretKey, SEM_SESSAO);
const anon = createClient(url, publishableKey, SEM_SESSAO);
const criados: string[] = [];

type Usuario = { id: string; db: SupabaseClient };

async function criarUsuario(): Promise<Usuario> {
  const senha = `${randomUUID()}${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email: `rls-${randomUUID()}@example.com`,
    password: senha,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser falhou: ${error?.message}`);
  criados.push(data.user.id); // registra antes do login: o afterAll apaga mesmo se algo falhar depois
  const db = createClient(url!, publishableKey!, SEM_SESSAO);
  const login = await db.auth.signInWithPassword({ email: data.user.email!, password: senha });
  if (login.error) throw new Error(`login falhou: ${login.error.message}`);
  return { id: data.user.id, db };
}

const perfil = (userId: string) => ({
  user_id: userId,
  nome_negocio: "Negocio de teste",
  eh_mei: true,
  atividade: "servicos",
  uf: "SP",
  municipio: "Sao Paulo",
  data_abertura: "2024-01-15",
  receita_inicial_centavos: 0,
});

const lancamento = (userId: string, extra: Record<string, unknown> = {}) => ({
  user_id: userId,
  tipo: "receita",
  data: "2026-11-01",
  valor_centavos: 10000,
  categoria: "vendas",
  descricao: "Teste RLS",
  origem: "manual",
  ...extra,
});

const documento = (userId: string, extra: Record<string, unknown> = {}) => {
  const id = randomUUID();
  return { id, user_id: userId, storage_path: `${userId}/${id}.png`, mime: "image/png", tamanho_bytes: 10, ...extra };
};

const bytes = (n: number) => Buffer.alloc(n, 1);

/** RPC negada: 42501 (sem EXECUTE) ou PGRST202 (função nem aparece para o role). Outro erro = função executável. */
const semPermissao = (error: { code?: string } | null): boolean =>
  error?.code === PERMISSAO_NEGADA || error?.code === "PGRST202";

let A: Usuario;
let B: Usuario;
let lancB: string;
let docB: string;
let arquivoB: string;

beforeAll(async () => {
  A = await criarUsuario();
  B = await criarUsuario();

  const insB = await B.db.from("perfis").insert(perfil(B.id));
  expect(insB.error).toBeNull();
  const lan = await B.db.from("lancamentos").insert(lancamento(B.id, { descricao: "do B" })).select("id").single();
  expect(lan.error).toBeNull();
  lancB = lan.data!.id;
  const doc = documento(B.id);
  const insDoc = await B.db.from("documentos").insert(doc);
  expect(insDoc.error).toBeNull();
  docB = doc.id;
  arquivoB = `${B.id}/${randomUUID()}.png`;
  const up = await B.db.storage.from(BUCKET).upload(arquivoB, bytes(10), { contentType: "image/png" });
  expect(up.error).toBeNull();
});

afterAll(async () => {
  const falhas: string[] = [];
  for (const id of criados) {
    try {
      const { data: arquivos } = await admin.storage.from(BUCKET).list(id);
      if (arquivos?.length) await admin.storage.from(BUCKET).remove(arquivos.map((f) => `${id}/${f.name}`));
      const { error } = await admin.auth.admin.deleteUser(id); // cascade apaga as linhas
      if (error) falhas.push(`deleteUser ${id}: ${error.message}`);
    } catch (e) {
      falhas.push(`limpeza ${id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (falhas.length) throw new Error(`Usuários de teste podem ter sobrado:\n${falhas.join("\n")}`);
});

describe("A no que é dele", () => {
  it("insere e lê o próprio perfil", async () => {
    expect((await A.db.from("perfis").insert(perfil(A.id))).error).toBeNull();
    const { data } = await A.db.from("perfis").select("user_id");
    expect(data).toEqual([{ user_id: A.id }]);
  });

  it("insere e lê o próprio lançamento; update atualiza atualizado_em (trigger)", async () => {
    const ins = await A.db.from("lancamentos").insert(lancamento(A.id)).select("id, criado_em").single();
    expect(ins.error).toBeNull();
    const upd = await A.db
      .from("lancamentos")
      .update({ descricao: "editado" })
      .eq("id", ins.data!.id)
      .select("descricao, atualizado_em")
      .single();
    expect(upd.data?.descricao).toBe("editado");
    expect(new Date(upd.data!.atualizado_em).getTime()).toBeGreaterThan(new Date(ins.data!.criado_em).getTime());
    const { data } = await A.db.from("lancamentos").select("id");
    expect(data).toHaveLength(1);
  });

  it("não troca o dono do próprio lançamento", async () => {
    const { error } = await A.db.from("lancamentos").update({ user_id: B.id }).eq("user_id", A.id);
    expect(error?.code).toBe(PERMISSAO_NEGADA);
  });

  it("rejeita valor <= 0 e categoria fora da lista", async () => {
    const zero = await A.db.from("lancamentos").insert(lancamento(A.id, { valor_centavos: 0 }));
    expect(zero.error?.code).toBe(VIOLACAO_CHECK);
    const cat = await A.db.from("lancamentos").insert(lancamento(A.id, { categoria: "inventada" }));
    expect(cat.error?.code).toBe(VIOLACAO_CHECK);
  });

  it("consentimento: insere, revoga, mas não altera a versão", async () => {
    const ins = await A.db
      .from("consentimentos")
      .insert({ user_id: A.id, finalidade: "termos_uso", versao: "2026-11-23" })
      .select("id")
      .single();
    expect(ins.error).toBeNull();
    const revoga = await A.db
      .from("consentimentos")
      .update({ revogado_em: new Date().toISOString() })
      .eq("id", ins.data!.id);
    expect(revoga.error).toBeNull();
    const versao = await A.db.from("consentimentos").update({ versao: "x" }).eq("id", ins.data!.id);
    expect(versao.error?.code).toBe(PERMISSAO_NEGADA);
  });

  it("excluir o documento zera documento_id sem apagar o lançamento", async () => {
    const doc = documento(A.id);
    expect((await A.db.from("documentos").insert(doc)).error).toBeNull();
    const lan = await A.db.from("lancamentos").insert(lancamento(A.id, { documento_id: doc.id })).select("id").single();
    expect(lan.error).toBeNull();
    expect((await A.db.from("documentos").delete().eq("id", doc.id)).error).toBeNull();
    const { data } = await A.db.from("lancamentos").select("documento_id, user_id").eq("id", lan.data!.id).single();
    expect(data).toEqual({ documento_id: null, user_id: A.id });
  });

  it("documentos: rejeita caminho em pasta alheia, mime fora da lista e > 5 MiB", async () => {
    const alheio = await A.db.from("documentos").insert(documento(A.id, { storage_path: `${B.id}/${randomUUID()}.png` }));
    expect(alheio.error?.code).toBe(VIOLACAO_CHECK);
    const pdf = await A.db.from("documentos").insert(documento(A.id, { mime: "application/pdf" }));
    expect(pdf.error?.code).toBe(VIOLACAO_CHECK);
    const grande = await A.db.from("documentos").insert(documento(A.id, { tamanho_bytes: 5 * MIB + 1 }));
    expect(grande.error?.code).toBe(VIOLACAO_CHECK);
  });
});

describe("A não alcança os dados de B", () => {
  it("não lê perfil, lançamentos, documentos nem consentimentos de B", async () => {
    for (const tabela of ["perfis", "lancamentos", "documentos", "consentimentos", "ai_usage"]) {
      const { data, error } = await A.db.from(tabela).select("user_id").eq("user_id", B.id);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    }
  });

  it("não insere perfil, lançamento, documento nem consentimento em nome de B", async () => {
    const r = await Promise.all([
      A.db.from("perfis").insert(perfil(B.id)),
      A.db.from("lancamentos").insert(lancamento(B.id)),
      A.db.from("documentos").insert(documento(B.id)),
      A.db.from("consentimentos").insert({ user_id: B.id, finalidade: "privacidade", versao: "v1" }),
    ]);
    for (const { error } of r) expect(error?.code).toBe(PERMISSAO_NEGADA);
  });

  it("não atualiza nem apaga lançamento de B (0 linhas) e o dado de B segue intacto", async () => {
    const upd = await A.db.from("lancamentos").update({ descricao: "hackeado" }).eq("id", lancB).select("id");
    expect(upd.data).toEqual([]);
    const del = await A.db.from("lancamentos").delete().eq("id", lancB).select("id");
    expect(del.data).toEqual([]);
    // service_role não tem GRANT de tabela (acesso automático desligado): confere pelo próprio dono
    const { data } = await B.db.from("lancamentos").select("descricao").eq("id", lancB).single();
    expect(data?.descricao).toBe("do B");
  });

  it("não apaga documento de B", async () => {
    const del = await A.db.from("documentos").delete().eq("id", docB).select("id");
    expect(del.data).toEqual([]);
    const { data } = await B.db.from("documentos").select("id").eq("id", docB);
    expect(data).toHaveLength(1);
  });

  it("não aponta o próprio lançamento para documento de B (FK composta)", async () => {
    const { error } = await A.db.from("lancamentos").insert(lancamento(A.id, { documento_id: docB }));
    expect(error?.code).toBe(VIOLACAO_FK);
  });
});

describe("anon não lê nem escreve nada", () => {
  it.each(["perfis", "documentos", "lancamentos", "consentimentos", "ai_usage"])("tabela %s", async (tabela) => {
    const sel = await anon.from(tabela).select("*");
    expect(sel.error?.code).toBe(PERMISSAO_NEGADA);
    const ins = await anon.from(tabela).insert({ user_id: A.id });
    expect(ins.error?.code).toBe(PERMISSAO_NEGADA);
  });
});

describe("ai_usage e funções", () => {
  it("usuário comum não escreve em ai_usage", async () => {
    const { error } = await A.db.from("ai_usage").insert({ user_id: A.id, dia: "2026-11-24", chamadas: 0 });
    expect(error?.code).toBe(PERMISSAO_NEGADA);
  });

  it("usuário comum e anon não executam registrar_uso_ia", async () => {
    const args = { p_user_id: A.id, p_custo_centavos: 1 };
    expect(semPermissao((await A.db.rpc("registrar_uso_ia", args)).error)).toBe(true);
    expect(semPermissao((await anon.rpc("registrar_uso_ia", args)).error)).toBe(true);
  });

  it("service_role registra uso; A lê o seu, B não vê; custo negativo é recusado", async () => {
    expect((await admin.rpc("registrar_uso_ia", { p_user_id: A.id, p_custo_centavos: 5 })).error).toBeNull();
    expect((await admin.rpc("registrar_uso_ia", { p_user_id: A.id, p_custo_centavos: 7 })).error).toBeNull();
    const a = await A.db.from("ai_usage").select("chamadas, custo_centavos");
    expect(a.data).toEqual([{ chamadas: 2, custo_centavos: 12 }]);
    const b = await B.db.from("ai_usage").select("chamadas");
    expect(b.data).toEqual([]);
    expect((await admin.rpc("registrar_uso_ia", { p_user_id: A.id, p_custo_centavos: -1 })).error).not.toBeNull();
  });

  it("anon e usuário comum não executam rls_auto_enable (advisor 0028/0029)", async () => {
    expect(semPermissao((await anon.rpc("rls_auto_enable")).error)).toBe(true);
    expect(semPermissao((await A.db.rpc("rls_auto_enable")).error)).toBe(true);
  });
});

describe("Storage: bucket documentos", () => {
  const up = (u: Usuario | null, path: string, tipo: string, tamanho = 10) =>
    (u?.db ?? anon).storage.from(BUCKET).upload(path, bytes(tamanho), { contentType: tipo });

  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ])("A envia %s para a própria pasta", async (tipo, ext) => {
    expect((await up(A, `${A.id}/${randomUUID()}.${ext}`, tipo)).error).toBeNull();
  });

  it("A envia exatamente 5 MiB, mas não 5 MiB + 1 byte", async () => {
    expect((await up(A, `${A.id}/${randomUUID()}.jpg`, "image/jpeg", 5 * MIB)).error).toBeNull();
    expect((await up(A, `${A.id}/${randomUUID()}.jpg`, "image/jpeg", 5 * MIB + 1)).error).not.toBeNull();
  });

  it("A não envia gif, pdf nem áudio", async () => {
    for (const [tipo, ext] of [["image/gif", "gif"], ["application/pdf", "pdf"], ["audio/mpeg", "mp3"]]) {
      expect((await up(A, `${A.id}/${randomUUID()}.${ext}`, tipo)).error).not.toBeNull();
    }
  });

  it("A não envia para a pasta de B nem na raiz; anon não envia", async () => {
    expect((await up(A, `${B.id}/${randomUUID()}.png`, "image/png")).error).not.toBeNull();
    expect((await up(A, `${randomUUID()}.png`, "image/png")).error).not.toBeNull();
    expect((await up(null, `${A.id}/${randomUUID()}.png`, "image/png")).error).not.toBeNull();
  });

  it("A gera URL assinada do próprio arquivo, mas não do de B; anon não gera", async () => {
    const proprio = `${A.id}/${randomUUID()}.png`;
    expect((await up(A, proprio, "image/png")).error).toBeNull();
    expect((await A.db.storage.from(BUCKET).createSignedUrl(proprio, 60)).error).toBeNull();
    expect((await A.db.storage.from(BUCKET).createSignedUrl(arquivoB, 60)).error).not.toBeNull();
    expect((await anon.storage.from(BUCKET).createSignedUrl(proprio, 60)).error).not.toBeNull();
  });

  it("A não baixa nem apaga o arquivo de B", async () => {
    expect((await A.db.storage.from(BUCKET).download(arquivoB)).error).not.toBeNull();
    const rm = await A.db.storage.from(BUCKET).remove([arquivoB]);
    expect(rm.data ?? []).toEqual([]);
    const { data } = await admin.storage.from(BUCKET).list(B.id);
    expect(data?.map((f) => `${B.id}/${f.name}`)).toContain(arquivoB);
  });

  it("ninguém sobrescreve (sem policy de update)", async () => {
    const path = `${A.id}/${randomUUID()}.png`;
    expect((await up(A, path, "image/png")).error).toBeNull();
    const sobrescreve = await A.db.storage.from(BUCKET).upload(path, bytes(20), { contentType: "image/png", upsert: true });
    expect(sobrescreve.error).not.toBeNull();
  });
});
