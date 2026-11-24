/**
 * RLS real dos repositórios de lib/db (perfil, lancamento, documento). Só `pnpm test:rls`.
 * Cada caso confere o que A consegue no que é dele e o que A NÃO consegue no que é de B.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { LancamentoInput, PerfilInput } from "@/lib/contracts";
import {
  contarLancamentosDoDocumento,
  criarLancamentos,
  editarLancamento,
  excluirLancamento,
  listarLancamentos,
} from "@/lib/db/lancamento";
import { criarPerfil, atualizarPerfil, lerPerfil } from "@/lib/db/perfil";
import { enviarDocumento, removerDocumento, urlAssinadaDocumento } from "@/lib/db/documento";
import { admin, BUCKET, criarUsuario, limparUsuarios, type Usuario } from "./ajuda";

const MIB = 1024 * 1024;

const PERFIL: PerfilInput = {
  nomeNegocio: "Negocio de teste",
  ehMei: true,
  atividade: "servicos",
  uf: "SP",
  municipio: "Sao Paulo",
  dataAbertura: "2024-01-15",
  receitaInicialCentavos: 0,
};

const lanc = (extra: Partial<LancamentoInput> = {}): LancamentoInput => ({
  tipo: "receita",
  data: "2026-11-10",
  valorCentavos: 12345,
  categoria: "vendas",
  descricao: "Venda de teste",
  contraparte: null,
  formaPgto: "pix",
  origem: "manual",
  ...extra,
});

const png = (n = 16) => new File([new Uint8Array(n).fill(1)], "nota.png", { type: "image/png" });

let A: Usuario;
let B: Usuario;
let lancB: string;
let docB: string;

beforeAll(async () => {
  A = await criarUsuario();
  B = await criarUsuario();
  await criarPerfil(B.db, B.id, PERFIL);
  docB = (await enviarDocumento(B.db, B.id, png())).id;
  lancB = (await criarLancamentos(B.db, B.id, [lanc({ descricao: "do B" })], docB))[0]!.id;
});

afterAll(limparUsuarios);

describe("perfil", () => {
  it("A cria, lê e atualiza o próprio perfil", async () => {
    const criado = await criarPerfil(A.db, A.id, PERFIL);
    expect(criado).toMatchObject({ userId: A.id, nomeNegocio: "Negocio de teste", receitaInicialCentavos: 0 });
    expect(await lerPerfil(A.db, A.id)).toEqual(criado);
    const novo = await atualizarPerfil(A.db, A.id, { ...PERFIL, nomeNegocio: "Renomeado", receitaInicialCentavos: 500000 });
    expect(novo).toMatchObject({ nomeNegocio: "Renomeado", receitaInicialCentavos: 500000 });
  });

  it("não cria duas vezes o perfil do mesmo usuário", async () => {
    await expect(criarPerfil(A.db, A.id, PERFIL)).rejects.toThrow();
  });

  it("A não lê, não cria e não atualiza o perfil de B", async () => {
    expect(await lerPerfil(A.db, B.id)).toBeNull();
    await expect(criarPerfil(A.db, B.id, PERFIL)).rejects.toThrow();
    expect(await atualizarPerfil(A.db, B.id, { ...PERFIL, nomeNegocio: "hackeado" })).toBeNull();
    expect((await lerPerfil(B.db, B.id))?.nomeNegocio).toBe("Negocio de teste");
  });
});

describe("lancamento", () => {
  it("A cria em lote, lista só o período pedido (fim exclusivo), do mais novo ao mais antigo", async () => {
    await criarLancamentos(
      A.db,
      A.id,
      [
        lanc({ data: "2026-10-31", descricao: "outubro" }),
        lanc({ data: "2026-11-01", descricao: "início" }),
        lanc({ data: "2026-11-20", descricao: "meio", tipo: "despesa", categoria: "aluguel" }),
        lanc({ data: "2026-12-01", descricao: "dezembro" }),
      ],
      null,
    );
    const nov = await listarLancamentos(A.db, A.id, { de: "2026-11-01", ate: "2026-12-01" });
    expect(nov.map((l) => l.descricao)).toEqual(["meio", "início"]);
    expect(nov[0]).toMatchObject({ valorCentavos: 12345, tipo: "despesa", categoria: "aluguel", documentoId: null });
  });

  it("A edita o próprio lançamento e o dado muda", async () => {
    const [novo] = await criarLancamentos(A.db, A.id, [lanc({ descricao: "antes" })], null);
    const editado = await editarLancamento(A.db, A.id, novo!.id, lanc({ descricao: "depois", valorCentavos: 999 }));
    expect(editado).toMatchObject({ id: novo!.id, descricao: "depois", valorCentavos: 999 });
  });

  it("A não vê, não edita nem exclui lançamento de B, e o de B segue intacto", async () => {
    const lista = await listarLancamentos(A.db, B.id, { de: "2000-01-01", ate: "2100-01-01" });
    expect(lista).toEqual([]);
    expect(await editarLancamento(A.db, B.id, lancB, lanc({ descricao: "hackeado" }))).toBeNull();
    expect(await excluirLancamento(A.db, B.id, lancB)).toBeNull();
    const deB = await listarLancamentos(B.db, B.id, { de: "2000-01-01", ate: "2100-01-01" });
    expect(deB.map((l) => l.descricao)).toEqual(["do B"]);
  });

  it("editar mantém o documento anexado; id inexistente do próprio usuário dá null; lote vazio não grava", async () => {
    const doc = await enviarDocumento(A.db, A.id, png());
    const [l] = await criarLancamentos(A.db, A.id, [lanc()], doc.id);
    const editado = await editarLancamento(A.db, A.id, l!.id, lanc({ descricao: "mudou" }));
    expect(editado?.documentoId).toBe(doc.id);
    const inexistente = "00000000-0000-4000-8000-000000000000";
    expect(await editarLancamento(A.db, A.id, inexistente, lanc())).toBeNull();
    expect(await excluirLancamento(A.db, A.id, inexistente)).toBeNull();
    expect(await criarLancamentos(A.db, A.id, [], null)).toEqual([]);
  });

  it("A não grava lançamento em nome de B nem aponta para documento de B", async () => {
    await expect(criarLancamentos(A.db, B.id, [lanc()], null)).rejects.toThrow();
    await expect(criarLancamentos(A.db, A.id, [lanc()], docB)).rejects.toThrow();
  });

  it("excluir devolve o documento do lançamento; o lote é tudo ou nada", async () => {
    const doc = await enviarDocumento(A.db, A.id, png());
    const [x, y] = await criarLancamentos(A.db, A.id, [lanc({ descricao: "x" }), lanc({ descricao: "y" })], doc.id);
    expect(await contarLancamentosDoDocumento(A.db, A.id, doc.id)).toBe(2);
    expect(await excluirLancamento(A.db, A.id, x!.id)).toEqual({ documentoId: doc.id });
    expect(await contarLancamentosDoDocumento(A.db, A.id, doc.id)).toBe(1);
    expect(await excluirLancamento(A.db, A.id, y!.id)).toEqual({ documentoId: doc.id });
    expect(await contarLancamentosDoDocumento(A.db, A.id, doc.id)).toBe(0);

    const antes = (await listarLancamentos(A.db, A.id, { de: "2000-01-01", ate: "2100-01-01" })).length;
    await expect(
      criarLancamentos(A.db, A.id, [lanc(), lanc({ valorCentavos: 0 })], null), // o segundo viola o CHECK
    ).rejects.toThrow();
    expect((await listarLancamentos(A.db, A.id, { de: "2000-01-01", ate: "2100-01-01" })).length).toBe(antes);
  });
});

describe("fluxo ponta a ponta (a ordem que as actions executam)", () => {
  it("perfil → confirmar com comprovante → listar → excluir o último lançamento limpa o documento", async () => {
    const U = await criarUsuario();
    await criarPerfil(U.db, U.id, PERFIL);

    const doc = await enviarDocumento(U.db, U.id, png());
    const criados = await criarLancamentos(U.db, U.id, [lanc({ descricao: "a" }), lanc({ descricao: "b" })], doc.id);
    const lista = await listarLancamentos(U.db, U.id, { de: "2026-11-01", ate: "2026-12-01" });
    expect(lista.map((l) => l.descricao).sort()).toEqual(["a", "b"]);
    expect(lista.every((l) => l.documentoId === doc.id)).toBe(true);
    expect(await urlAssinadaDocumento(U.db, U.id, doc.id)).not.toBeNull();

    for (const l of criados) {
      const { documentoId } = (await excluirLancamento(U.db, U.id, l.id))!;
      if (documentoId && (await contarLancamentosDoDocumento(U.db, U.id, documentoId)) === 0) {
        await removerDocumento(U.db, U.id, documentoId);
      }
    }
    expect(await listarLancamentos(U.db, U.id, { de: "2026-11-01", ate: "2026-12-01" })).toEqual([]);
    expect(await urlAssinadaDocumento(U.db, U.id, doc.id)).toBeNull();
    const { data: arquivos } = await admin.storage.from(BUCKET).list(U.id);
    expect(arquivos ?? []).toEqual([]);
  });
});

describe("documento", () => {
  it("A envia imagem: path {user_id}/{uuid}.ext, linha em documentos, URL assinada curta", async () => {
    const { id } = await enviarDocumento(A.db, A.id, png(2048));
    const { data: linha } = await A.db.from("documentos").select("storage_path, mime, tamanho_bytes").eq("id", id).single();
    expect(linha?.storage_path).toMatch(new RegExp(`^${A.id}/${id}\\.png$`));
    expect(linha).toMatchObject({ mime: "image/png", tamanho_bytes: 2048 });
    const url = await urlAssinadaDocumento(A.db, A.id, id);
    expect(url).toMatch(/^https:\/\/.+token=/);
    const { data: arquivos } = await admin.storage.from(BUCKET).list(A.id);
    expect(arquivos?.map((f) => f.name)).toContain(`${id}.png`);
  });

  it("aceita exatamente 5 MiB; recusa 5 MiB + 1, mime fora da lista e arquivo vazio", async () => {
    await expect(enviarDocumento(A.db, A.id, png(5 * MIB))).resolves.toHaveProperty("id");
    await expect(enviarDocumento(A.db, A.id, png(5 * MIB + 1))).rejects.toThrow();
    await expect(enviarDocumento(A.db, A.id, new File([new Uint8Array(8)], "a.gif", { type: "image/gif" }))).rejects.toThrow();
    await expect(enviarDocumento(A.db, A.id, new File([], "a.png", { type: "image/png" }))).rejects.toThrow();
  });

  it("upload só no próprio path: A não envia para a pasta de B e não deixa linha órfã", async () => {
    await expect(enviarDocumento(A.db, B.id, png())).rejects.toThrow();
    const { data } = await B.db.from("documentos").select("id");
    expect(data).toHaveLength(1); // só o doc do B original
  });

  it("A não gera URL assinada nem remove documento de B", async () => {
    expect(await urlAssinadaDocumento(A.db, B.id, docB)).toBeNull();
    expect(await removerDocumento(A.db, B.id, docB)).toBe(false);
    expect(await urlAssinadaDocumento(B.db, B.id, docB)).not.toBeNull();
  });

  it("remover apaga linha e arquivo; lançamento fica sem documento", async () => {
    const doc = await enviarDocumento(A.db, A.id, png());
    const [l] = await criarLancamentos(A.db, A.id, [lanc()], doc.id);
    expect(await removerDocumento(A.db, A.id, doc.id)).toBe(true);
    const { data: arquivos } = await admin.storage.from(BUCKET).list(A.id);
    expect(arquivos?.map((f) => f.name)).not.toContain(`${doc.id}.png`);
    const [depois] = (await listarLancamentos(A.db, A.id, { de: "2000-01-01", ate: "2100-01-01" })).filter((x) => x.id === l!.id);
    expect(depois?.documentoId).toBeNull();
  });
});
