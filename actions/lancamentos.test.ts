import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockLancamentos } from "@/lib/contracts/mocks";
import type { LancamentoInput } from "@/lib/contracts";
import { hojeBrasil } from "@/lib/security/datas";
import { confirmarLancamento, editar, excluir, listar } from "./lancamentos";

const m = vi.hoisted(() => ({
  exigirAcesso: vi.fn(),
  criarLancamentos: vi.fn(),
  listarLancamentos: vi.fn(),
  editarLancamento: vi.fn(),
  excluirLancamento: vi.fn(),
  contarLancamentosDoDocumento: vi.fn(),
  enviarDocumento: vi.fn(),
  removerDocumento: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("./sessao", () => ({ exigirAcesso: m.exigirAcesso }));
vi.mock("@/lib/db/cliente-servidor", () => ({ criarClienteServidor: async () => ({}) }));
vi.mock("@/lib/db/lancamento", () => ({
  criarLancamentos: m.criarLancamentos,
  listarLancamentos: m.listarLancamentos,
  editarLancamento: m.editarLancamento,
  excluirLancamento: m.excluirLancamento,
  contarLancamentosDoDocumento: m.contarLancamentosDoDocumento,
}));
vi.mock("@/lib/db/documento", () => ({ enviarDocumento: m.enviarDocumento, removerDocumento: m.removerDocumento }));

const ID = "5d1f1a0e-3b7a-4a55-8f0a-6f3f0f6a9c11";
const DOC = "7a1f1a0e-3b7a-4a55-8f0a-6f3f0f6a9c22";
const item: LancamentoInput = {
  tipo: "receita",
  data: "2026-11-10",
  valorCentavos: 5000,
  categoria: "vendas",
  descricao: "Venda",
  contraparte: null,
  formaPgto: "pix",
  origem: "manual",
};
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);

function form(lancamentos: unknown, imagem?: File): FormData {
  const fd = new FormData();
  fd.set("lancamentos", typeof lancamentos === "string" ? lancamentos : JSON.stringify(lancamentos));
  if (imagem) fd.set("imagem", imagem);
  return fd;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.exigirAcesso.mockResolvedValue({ userId: "u1", demo: false, consentimentoVigente: true });
  m.removerDocumento.mockResolvedValue(true);
  m.criarLancamentos.mockImplementation(async (_db: unknown, _u: string, itens: LancamentoInput[], documentoId: string | null) =>
    itens.map((i) => ({ ...i, id: ID, documentoId, criadoEm: "2026-11-24T10:00:00+00:00", atualizadoEm: "2026-11-24T10:00:00+00:00" })),
  );
});

describe("confirmarLancamento", () => {
  it.each([
    ["JSON quebrado", () => form("{nao-e-json")],
    ["lista vazia", () => form([])],
    ["categoria fora da lista", () => form([{ ...item, categoria: "inventada" }])],
    ["valor zero", () => form([{ ...item, valorCentavos: 0 }])],
  ])("%s: erro de validação, sem gravar nada", async (_nome, montar) => {
    expect(await confirmarLancamento(montar())).toMatchObject({ ok: false, erro: { codigo: "invalido" } });
    expect(m.criarLancamentos).not.toHaveBeenCalled();
  });

  it("recusa data futura (Brasília)", async () => {
    const ano = Number(hojeBrasil().slice(0, 4));
    const r = await confirmarLancamento(form([{ ...item, data: `${ano + 1}-01-01` }]));
    expect(r).toMatchObject({ ok: false, erro: { codigo: "invalido" } });
    expect(m.criarLancamentos).not.toHaveBeenCalled();
  });

  it("sem imagem: grava com o usuário da sessão e documento null", async () => {
    const r = await confirmarLancamento(form([item]));
    expect(r.ok).toBe(true);
    expect(m.criarLancamentos).toHaveBeenCalledWith(expect.anything(), "u1", [item], null);
    expect(m.enviarDocumento).not.toHaveBeenCalled();
  });

  it("com imagem válida: sobe o arquivo e anexa o documento aos lançamentos", async () => {
    m.enviarDocumento.mockResolvedValue({ id: DOC });
    const r = await confirmarLancamento(form([{ ...item, origem: "foto" }], new File([PNG], "n.png", { type: "image/png" })));
    expect(r.ok).toBe(true);
    expect(m.criarLancamentos).toHaveBeenCalledWith(expect.anything(), "u1", expect.any(Array), DOC);
  });

  it("imagem que declara PNG mas tem conteúdo de HTML: recusa antes de subir", async () => {
    const falso = new File([new TextEncoder().encode("<html><script>x</script></html>")], "n.png", { type: "image/png" });
    const r = await confirmarLancamento(form([item], falso));
    expect(r).toMatchObject({ ok: false, erro: { codigo: "invalido" } });
    expect(m.enviarDocumento).not.toHaveBeenCalled();
  });

  it("imagem grande demais: recusa antes de subir", async () => {
    const grande = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "n.png", { type: "image/png" });
    expect(await confirmarLancamento(form([item], grande))).toMatchObject({ ok: false, erro: { codigo: "invalido" } });
    expect(m.enviarDocumento).not.toHaveBeenCalled();
  });

  it("falha ao gravar os lançamentos depois do upload: desfaz o documento e devolve erro genérico", async () => {
    m.enviarDocumento.mockResolvedValue({ id: DOC });
    m.criarLancamentos.mockRejectedValue(new Error("falha ao criar lançamento (23514) detalhe-interno"));
    m.removerDocumento.mockResolvedValue(true);
    const r = await confirmarLancamento(form([item], new File([PNG], "n.png", { type: "image/png" })));
    expect(r).toMatchObject({ ok: false, erro: { codigo: "interno" } });
    expect(JSON.stringify(r)).not.toContain("detalhe-interno");
    expect(m.removerDocumento).toHaveBeenCalledWith(expect.anything(), "u1", DOC);
  });

  it("modo mock: devolve os lançamentos sem banco", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    const r = await confirmarLancamento(form([item]));
    expect(r).toMatchObject({ ok: true, dados: { lancamentos: [{ descricao: "Venda" }] } });
    expect(m.criarLancamentos).not.toHaveBeenCalled();
  });
});

describe("listar", () => {
  it("valida o período e lista só do usuário da sessão", async () => {
    m.listarLancamentos.mockResolvedValue([]);
    expect((await listar({ de: "2026-11-01", ate: "2026-12-01" })).ok).toBe(true);
    expect(m.listarLancamentos).toHaveBeenCalledWith(expect.anything(), "u1", { de: "2026-11-01", ate: "2026-12-01" });
  });

  it.each([
    ["fim antes do início", { de: "2026-12-01", ate: "2026-11-01" }],
    ["período de mais de 2 anos", { de: "2020-01-01", ate: "2026-01-01" }],
    ["data inválida", { de: "ontem", ate: "2026-01-01" }],
  ])("recusa %s", async (_n, periodo) => {
    expect(await listar(periodo)).toMatchObject({ ok: false, erro: { codigo: "invalido" } });
    expect(m.listarLancamentos).not.toHaveBeenCalled();
  });

  it("modo mock: filtra os mocks pelo período", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    const r = await listar({ de: "2026-11-01", ate: "2026-12-01" });
    const esperados = mockLancamentos.filter((l) => l.data >= "2026-11-01" && l.data < "2026-12-01");
    expect(r.ok && r.dados.length).toBe(esperados.length);
  });
});

describe("editar", () => {
  it("id que não é uuid: inválido; lançamento de outro usuário: não encontrado", async () => {
    expect(await editar({ id: "1", lancamento: item })).toMatchObject({ ok: false, erro: { codigo: "invalido" } });
    m.editarLancamento.mockResolvedValue(null);
    expect(await editar({ id: ID, lancamento: item })).toMatchObject({ ok: false, erro: { codigo: "nao_encontrado" } });
  });

  it("edita com o usuário da sessão", async () => {
    m.editarLancamento.mockResolvedValue({ ...item, id: ID });
    expect((await editar({ id: ID, lancamento: item })).ok).toBe(true);
    expect(m.editarLancamento).toHaveBeenCalledWith(expect.anything(), "u1", ID, item);
  });

  it("data futura é recusada na edição também", async () => {
    const r = await editar({ id: ID, lancamento: { ...item, data: "2999-01-01" } });
    expect(r).toMatchObject({ ok: false, erro: { codigo: "invalido" } });
    expect(m.editarLancamento).not.toHaveBeenCalled();
  });
});

describe("excluir", () => {
  it("não encontrado: erro; id inválido: erro sem banco", async () => {
    expect(await excluir("x")).toMatchObject({ ok: false, erro: { codigo: "invalido" } });
    m.excluirLancamento.mockResolvedValue(null);
    expect(await excluir(ID)).toMatchObject({ ok: false, erro: { codigo: "nao_encontrado" } });
  });

  it("último lançamento do documento: apaga o documento (arquivo e linha)", async () => {
    m.excluirLancamento.mockResolvedValue({ documentoId: DOC });
    m.contarLancamentosDoDocumento.mockResolvedValue(0);
    expect((await excluir(ID)).ok).toBe(true);
    expect(m.removerDocumento).toHaveBeenCalledWith(expect.anything(), "u1", DOC);
  });

  it("ainda há outro lançamento usando o documento: mantém", async () => {
    m.excluirLancamento.mockResolvedValue({ documentoId: DOC });
    m.contarLancamentosDoDocumento.mockResolvedValue(1);
    expect((await excluir(ID)).ok).toBe(true);
    expect(m.removerDocumento).not.toHaveBeenCalled();
  });

  it("sem documento: não mexe em documentos", async () => {
    m.excluirLancamento.mockResolvedValue({ documentoId: null });
    expect((await excluir(ID)).ok).toBe(true);
    expect(m.contarLancamentosDoDocumento).not.toHaveBeenCalled();
  });

  it("falha ao limpar o documento não desfaz a exclusão (só registra)", async () => {
    m.excluirLancamento.mockResolvedValue({ documentoId: DOC });
    m.contarLancamentosDoDocumento.mockResolvedValue(0);
    m.removerDocumento.mockRejectedValue(new Error("falha ao remover documento (500)"));
    expect((await excluir(ID)).ok).toBe(true);
  });
});
