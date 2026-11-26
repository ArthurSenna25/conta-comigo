import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPerfil } from "@/lib/contracts/mocks";
import { PerfilInput } from "@/lib/contracts/perfil";
import { atualizarPerfil } from "./atualizar-perfil";

const { exigirAcesso, obterPerfil, salvarPerfil, redirect, revalidatePath } = vi.hoisted(() => ({
  exigirAcesso: vi.fn(),
  obterPerfil: vi.fn(),
  salvarPerfil: vi.fn(),
  redirect: vi.fn<(destino: string) => never>(() => { throw new Error("REDIRECIONADO"); }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/actions/sessao", () => ({ exigirAcesso }));
vi.mock("@/actions/perfil", () => ({ obterPerfil, salvarPerfil }));
vi.mock("next/navigation", () => ({
  redirect,
  unstable_rethrow: (erro: unknown) => {
    if (erro instanceof Error && erro.message === "REDIRECIONADO") throw erro;
  },
}));
vi.mock("next/cache", () => ({ revalidatePath }));

const perfil = { ...mockPerfil, ehMei: false, receitaInicialCentavos: 87_654 };
const sessao = { userId: perfil.userId, consentimentoVigente: true, demo: false };

function formulario(receita?: string) {
  const dados = new FormData();
  dados.set("nomeNegocio", "Oficina Fictícia");
  dados.set("atividade", "ambos");
  dados.set("uf", "SP");
  dados.set("municipio", "Campinas");
  dados.set("dataAbertura", "2024-03-15");
  if (receita !== undefined) dados.set("receitaInicialCentavos", receita);
  return dados;
}

beforeEach(() => {
  vi.resetAllMocks();
  exigirAcesso.mockResolvedValue(sessao);
  obterPerfil.mockResolvedValue({ ok: true, dados: perfil });
  salvarPerfil.mockImplementation(async (entrada: unknown) => {
    const resultado = PerfilInput.safeParse(entrada);
    if (resultado.success) return { ok: true, dados: { ...perfil, ...resultado.data } };
    const campos = Object.fromEntries(
      resultado.error.issues.map((issue) => [issue.path.join("."), issue.message]),
    );
    return { ok: false, erro: { codigo: "invalido", mensagem: "Confira os dados.", campos } };
  });
});

describe("atualizar perfil", () => {
  it.each([["vazia", ""], ["ausente", undefined], ["apenas espaços", "   "]] as const)(
    "preserva a receita persistida quando a entrada está %s",
    async (_, entrada) => {
      const resultado = await atualizarPerfil(null, formulario(entrada));
      expect(resultado).toMatchObject({ status: "sucesso" });
      expect(salvarPerfil).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
        receitaInicialCentavos: 87_654,
      }));
    },
  );

  it.each([
    ["0", 0], ["0,00", 0], ["0.00", 0], ["1.234,56", 123_456],
    ["19.5", 1_950], ["0,01", 1], ["9.999.999,99", 999_999_999],
    ["10.000.000,00", 1_000_000_000],
  ])("converte %s em %i centavos exatos", async (entrada, centavos) => {
    const resultado = await atualizarPerfil(null, formulario(entrada));
    expect(resultado).toMatchObject({ status: "sucesso" });
    expect(salvarPerfil).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      receitaInicialCentavos: centavos,
    }));
  });

  it.each(["-1", "1e3", "0,001", "1.23,45", "10.000.000,01", "99999999999999999999999999999"])(
    "rejeita a receita %s e não invalida páginas",
    async (entrada) => {
      await expect(atualizarPerfil(null, formulario(entrada))).resolves.toMatchObject({
        status: "erro",
        erro: { codigo: "invalido", campos: { receitaInicialCentavos: expect.any(String) } },
      });
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it("bloqueia uma submissão direta de conta demo sem apresentar erro", async () => {
    exigirAcesso.mockResolvedValue({ ...sessao, demo: true });
    const dados = formulario("0");
    dados.set("demo", "false");
    await expect(atualizarPerfil(null, dados)).resolves.toBeNull();
    expect(salvarPerfil).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("usa os dados autenticados e descarta valores forjados fora dos campos editáveis", async () => {
    const dados = formulario("");
    dados.set("userId", "00000000-0000-4000-8000-000000000001");
    dados.set("criadoEm", "2000-01-01T00:00:00Z");
    dados.set("ehMei", "true");
    dados.set("receitaAnteriorCentavos", "0");

    await atualizarPerfil(null, dados);
    expect(exigirAcesso).toHaveBeenCalledWith("consentimento");
    expect(obterPerfil).toHaveBeenCalledOnce();
    expect(salvarPerfil).toHaveBeenCalledExactlyOnceWith({
      nomeNegocio: "Oficina Fictícia",
      atividade: "ambos",
      uf: "SP",
      municipio: "Campinas",
      dataAbertura: "2024-03-15",
      ehMei: false,
      receitaInicialCentavos: 87_654,
    });
  });

  it("interrompe o envio quando a releitura falha", async () => {
    obterPerfil.mockResolvedValue({ ok: false, erro: { codigo: "interno", mensagem: "Tente novamente." } });
    await expect(atualizarPerfil(null, formulario("0"))).resolves.toMatchObject({
      status: "erro", erro: { codigo: "interno" },
    });
    expect(salvarPerfil).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redireciona ao onboarding quando o perfil desaparece antes do envio", async () => {
    obterPerfil.mockResolvedValue({ ok: false, erro: { codigo: "nao_encontrado", mensagem: "Perfil não encontrado." } });
    await expect(atualizarPerfil(null, formulario("0"))).rejects.toThrow("REDIRECIONADO");
    expect(redirect).toHaveBeenCalledWith("/onboarding");
    expect(salvarPerfil).not.toHaveBeenCalled();
  });

  it("retorna sucesso com dados editáveis normalizados e revalida perfil e painel", async () => {
    const dados = formulario("19.5");
    dados.set("nomeNegocio", "  Oficina Fictícia  ");
    const resultado = await atualizarPerfil(null, dados);
    expect(resultado).toMatchObject({
      status: "sucesso",
      dados: {
        nomeNegocio: "Oficina Fictícia", atividade: "ambos", uf: "SP", municipio: "Campinas",
        dataAbertura: "2024-03-15", receitaInicialCentavos: 1_950,
      },
    });
    for (const campo of ["userId", "criadoEm", "ehMei"]) {
      expect(resultado).not.toHaveProperty(["dados", campo]);
    }
    expect(revalidatePath).toHaveBeenCalledWith("/perfil");
    expect(revalidatePath).toHaveBeenCalledWith("/painel");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("devolve validação por campo quando a data for futura", async () => {
    const dados = formulario("19.5");
    dados.set("dataAbertura", "9999-01-01");
    await expect(atualizarPerfil(null, dados)).resolves.toMatchObject({
      status: "erro",
      erro: { codigo: "invalido", campos: { dataAbertura: expect.any(String) } },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("devolve falha de salvamento sem anunciar sucesso nem redirecionar", async () => {
    const erro = { codigo: "interno", mensagem: "Algo deu errado. Tente de novo em instantes." };
    salvarPerfil.mockResolvedValue({ ok: false, erro });
    await expect(atualizarPerfil(null, formulario("19.5"))).resolves.toMatchObject({ status: "erro", erro });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("preserva a digitação após validação para o POST anterior à hidratação", async () => {
    const dados = formulario("  1,234  ");
    dados.set("nomeNegocio", "  Oficina Fictícia  ");
    await expect(atualizarPerfil(null, dados)).resolves.toMatchObject({
      status: "erro",
      rascunho: { nomeNegocio: "  Oficina Fictícia  ", receitaInicialCentavos: "  1,234  " },
    });
  });

  it("oculta detalhes de uma exceção no salvamento e devolve a digitação", async () => {
    salvarPerfil.mockRejectedValue(new Error("detalhe interno de teste"));
    const resultado = await atualizarPerfil(null, formulario("19.5"));
    expect(resultado).toMatchObject({
      status: "erro",
      erro: { codigo: "interno", mensagem: "Não foi possível concluir o salvamento. Tente novamente." },
      rascunho: { receitaInicialCentavos: "19.5" },
    });
    expect(JSON.stringify(resultado)).not.toContain("detalhe interno de teste");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("fronteira do envio", () => {
  it("verifica a sessão demo antes de acessar o envelope", async () => {
    exigirAcesso.mockResolvedValue({ ...sessao, demo: true });
    const dados = new FormData();
    const get = vi.spyOn(dados, "get");
    const getAll = vi.spyOn(dados, "getAll");
    await expect(atualizarPerfil(null, dados)).resolves.toBeNull();
    expect(get).not.toHaveBeenCalled();
    expect(getAll).not.toHaveBeenCalled();
    expect(obterPerfil).not.toHaveBeenCalled();
    expect(salvarPerfil).not.toHaveBeenCalled();
  });

  it.each([null, { receitaInicialCentavos: "0" }, "receita=0"])(
    "rejeita envelope incompatível sem consultar ou salvar o perfil (%j)",
    async (dados) => {
      await expect(atualizarPerfil(null, dados)).resolves.toMatchObject({
        status: "erro", erro: { codigo: "invalido", mensagem: expect.any(String) },
      });
      expect(exigirAcesso).toHaveBeenCalledWith("consentimento");
      expect(obterPerfil).not.toHaveBeenCalled();
      expect(salvarPerfil).not.toHaveBeenCalled();
    },
  );

  it("rejeita arquivo no campo de receita sem salvar", async () => {
    const dados = formulario();
    dados.set("receitaInicialCentavos", new File(["0"], "receita.txt"));
    await expect(atualizarPerfil(null, dados)).resolves.toMatchObject({
      status: "erro", erro: { codigo: "invalido", campos: { receitaInicialCentavos: expect.any(String) } },
    });
    expect(salvarPerfil).not.toHaveBeenCalled();
  });

  it.each([["receitaInicialCentavos", "0"], ["nomeNegocio", "Outro nome"]])(
    "rejeita chave duplicada em %s sem salvar",
    async (campo, valor) => {
      const dados = formulario("");
      dados.append(campo, valor);
      await expect(atualizarPerfil(null, dados)).resolves.toMatchObject({
        status: "erro", erro: { codigo: "invalido", campos: { [campo]: expect.any(String) } },
      });
      expect(salvarPerfil).not.toHaveBeenCalled();
    },
  );

  it("mantém o sucesso da gravação se revalidar o perfil falhar e ainda tenta atualizar o painel", async () => {
    revalidatePath.mockImplementationOnce(() => { throw new Error("falha interna de cache"); });
    const resultado = await atualizarPerfil(null, formulario("0"));
    expect(resultado).toMatchObject({
      status: "sucesso", dados: { receitaInicialCentavos: 0 }, aviso: expect.any(String),
    });
    expect(JSON.stringify(resultado)).not.toContain("falha interna de cache");
    expect(salvarPerfil).toHaveBeenCalledOnce();
    expect(revalidatePath).toHaveBeenNthCalledWith(2, "/painel");
  });

  it("preserva o controle de fluxo do Next durante a invalidação", async () => {
    revalidatePath.mockImplementationOnce(() => redirect("/entrar"));
    await expect(atualizarPerfil(null, formulario("0"))).rejects.toThrow("REDIRECIONADO");
  });
});
