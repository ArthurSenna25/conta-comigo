import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPerfil } from "@/lib/contracts/mocks";
import type { PerfilInput } from "@/lib/contracts";
import { salvarPerfil } from "./perfil";

const { exigirAcesso, lerPerfil, criarPerfil, atualizarPerfil } = vi.hoisted(() => ({
  exigirAcesso: vi.fn(),
  lerPerfil: vi.fn(),
  criarPerfil: vi.fn(),
  atualizarPerfil: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("./sessao", () => ({ exigirAcesso }));
vi.mock("@/lib/db/cliente-servidor", () => ({ criarClienteServidor: async () => ({}) }));
vi.mock("@/lib/db/perfil", () => ({ lerPerfil, criarPerfil, atualizarPerfil }));

const entrada: PerfilInput = {
  nomeNegocio: "Loja da Ana",
  ehMei: true,
  atividade: "comercio",
  uf: "SP",
  municipio: "Sao Paulo",
  dataAbertura: "2024-01-15",
  receitaInicialCentavos: 0,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false");
  exigirAcesso.mockResolvedValue({ userId: "u1", demo: false, consentimentoVigente: true });
});

describe("salvarPerfil", () => {
  it("entrada inválida: erro de campos, sem tocar no banco", async () => {
    const r = await salvarPerfil({ ...entrada, uf: "sp", nomeNegocio: "" });
    expect(r).toMatchObject({ ok: false, erro: { codigo: "invalido" } });
    if (!r.ok) expect(Object.keys(r.erro.campos ?? {})).toEqual(expect.arrayContaining(["uf", "nomeNegocio"]));
    expect(lerPerfil).not.toHaveBeenCalled();
  });

  it("autoriza só até o consentimento (o perfil é criado aqui, no onboarding)", async () => {
    lerPerfil.mockResolvedValue(null);
    criarPerfil.mockResolvedValue({ ...mockPerfil, userId: "u1" });
    await salvarPerfil(entrada);
    expect(exigirAcesso).toHaveBeenCalledWith("consentimento");
  });

  it("sem perfil: cria para o usuário da SESSÃO (nunca um id vindo do cliente)", async () => {
    lerPerfil.mockResolvedValue(null);
    criarPerfil.mockResolvedValue({ ...mockPerfil, userId: "u1" });
    const r = await salvarPerfil({ ...entrada, userId: "outro" });
    expect(r.ok).toBe(true);
    expect(criarPerfil).toHaveBeenCalledWith(expect.anything(), "u1", entrada);
    expect(atualizarPerfil).not.toHaveBeenCalled();
  });

  it("com perfil: atualiza", async () => {
    lerPerfil.mockResolvedValue(mockPerfil);
    atualizarPerfil.mockResolvedValue(mockPerfil);
    expect((await salvarPerfil(entrada)).ok).toBe(true);
    expect(atualizarPerfil).toHaveBeenCalledWith(expect.anything(), "u1", entrada);
    expect(criarPerfil).not.toHaveBeenCalled();
  });

  it("falha do banco: erro genérico, sem a mensagem interna", async () => {
    lerPerfil.mockRejectedValue(new Error("falha ao ler perfil (XX000) segredo-interno"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await salvarPerfil(entrada);
    expect(r).toMatchObject({ ok: false, erro: { codigo: "interno" } });
    expect(JSON.stringify(r)).not.toContain("segredo-interno");
  });

  it("modo mock: devolve o perfil sem banco nem portão", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    const r = await salvarPerfil(entrada);
    expect(r).toMatchObject({ ok: true, dados: { nomeNegocio: "Loja da Ana" } });
    expect(lerPerfil).not.toHaveBeenCalled();
  });
});
