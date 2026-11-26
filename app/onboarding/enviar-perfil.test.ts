import { beforeEach, describe, expect, it, vi } from "vitest";
import { enviarPerfil } from "@/app/onboarding/enviar-perfil";
import { PerfilInput } from "@/lib/contracts/perfil";

const { salvarPerfil, redirect, revalidatePath } = vi.hoisted(() => ({
  salvarPerfil: vi.fn(),
  redirect: vi.fn(() => { throw new Error("REDIRECIONADO"); }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/actions/perfil", () => ({ salvarPerfil }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect, RedirectType: { replace: "replace" } }));

function formulario(receita: string) {
  const dados = new FormData();
  dados.set("nomeNegocio", "Negócio Fictício");
  dados.set("atividade", "servicos");
  dados.set("uf", "SP");
  dados.set("municipio", "São Paulo");
  dados.set("dataAbertura", "2024-01-15");
  dados.set("receitaInicialCentavos", receita);
  return dados;
}

beforeEach(() => {
  vi.clearAllMocks();
  salvarPerfil.mockImplementation(async (entrada: unknown) => {
    const perfil = PerfilInput.safeParse(entrada);
    if (perfil.success) return { ok: true, dados: perfil.data };
    const campos = Object.fromEntries(perfil.error.issues.map((issue) => [issue.path.join("."), issue.message]));
    return { ok: false, erro: { codigo: "invalido", mensagem: "Confira os dados.", campos } };
  });
});

describe("envio do onboarding", () => {
  it.each([["", 0], ["1.234,56", 123456], ["19.5", 1950], ["0,01", 1]])(
    "converte %s em %d centavos e vai ao painel quando a action aceita",
    async (receita, centavos) => {
      const dados = formulario(receita);
      dados.set("ehMei", "false");
      await expect(enviarPerfil(null, dados)).rejects.toThrow("REDIRECIONADO");
      expect(salvarPerfil).toHaveBeenCalledWith(expect.objectContaining({ ehMei: true, receitaInicialCentavos: centavos }));
      expect(revalidatePath).toHaveBeenCalledWith("/painel");
      expect(redirect).toHaveBeenCalledWith("/painel", "replace");
    },
  );

  it.each(["-10", "1,234", "1e3", "10.000.000,01"])(
    "rejeita receita %s em vez de salvar um valor diferente", async (receita) => {
      await expect(enviarPerfil(null, formulario(receita))).resolves.toMatchObject({
        codigo: "invalido", campos: { receitaInicialCentavos: expect.any(String) },
      });
      expect(redirect).not.toHaveBeenCalled();
    },
  );

  it("mostra erro da action para data futura e rejeita UF fora da lista", async () => {
    const dados = formulario("0");
    dados.set("dataAbertura", "9999-01-01");
    dados.set("uf", "ZZ");
    await expect(enviarPerfil(null, dados)).resolves.toMatchObject({
      campos: { dataAbertura: "A data de abertura não pode ser futura", uf: "UF inválida" },
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
