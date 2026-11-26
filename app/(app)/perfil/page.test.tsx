import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFormularioAcao } from "@/components/auth/use-formulario-acao";
import { mockPerfil } from "@/lib/contracts/mocks";
import PaginaPerfil from "./page";

const { exigirAcesso, obterPerfil, redirect } = vi.hoisted(() => ({
  exigirAcesso: vi.fn(),
  obterPerfil: vi.fn(),
  redirect: vi.fn(() => { throw new Error("REDIRECIONADO"); }),
}));

vi.mock("@/actions/sessao", () => ({ exigirAcesso }));
vi.mock("@/actions/perfil", () => ({ obterPerfil }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/components/auth/use-formulario-acao", { spy: true });

const perfil = {
  ...mockPerfil,
  nomeNegocio: "Oficina Fictícia",
  atividade: "ambos" as const,
  uf: "SP",
  municipio: "Campinas",
  dataAbertura: "2024-03-15",
  receitaInicialCentavos: 123_456,
};
const sessao = { userId: perfil.userId, consentimentoVigente: true, demo: false };

async function renderizar() {
  return renderToStaticMarkup(await PaginaPerfil());
}

function estadoDoFormulario(estado: unknown, pendente = false) {
  vi.mocked(useFormularioAcao).mockReturnValue({
    estado,
    pendente,
    despachar: vi.fn(),
    aoEnviar: vi.fn(),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  exigirAcesso.mockResolvedValue(sessao);
  obterPerfil.mockResolvedValue({ ok: true, dados: perfil });
});

describe("/perfil", () => {
  it("preenche os seis campos com o perfil carregado", async () => {
    const html = await renderizar();

    expect(exigirAcesso).toHaveBeenCalledWith("consentimento");
    expect(obterPerfil).toHaveBeenCalledOnce();
    expect(html).toContain("<form");
    expect(html).toMatch(/<input\b(?=[^>]*\bname="nomeNegocio")(?=[^>]*\bvalue="Oficina Fictícia")[^>]*>/);
    expect(html).toMatch(/<input\b(?=[^>]*\bname="atividade")(?=[^>]*\bvalue="ambos")(?=[^>]*\bchecked="")[^>]*>/);
    expect(html).toMatch(/<select\b[^>]*\bname="uf"[^>]*>(?:(?!<\/select>)[\s\S])*<option\b[^>]*\bselected=""[^>]*>SP<\/option>/);
    expect(html).toMatch(/<input\b(?=[^>]*\bname="municipio")(?=[^>]*\bvalue="Campinas")[^>]*>/);
    expect(html).toMatch(/<input\b(?=[^>]*\bname="dataAbertura")(?=[^>]*\bvalue="2024-03-15")[^>]*>/);
    expect(html).toMatch(/<input\b(?=[^>]*\bname="receitaInicialCentavos")(?=[^>]*\bvalue="1\.?234,56")[^>]*>/);
    expect(html).toMatch(/<button\b[^>]*>Salvar<\/button>/);
  });

  it("mostra os seis dados e o aviso da demo sem formulário nem botão Salvar", async () => {
    exigirAcesso.mockResolvedValue({ ...sessao, demo: true });
    const html = await renderizar();

    for (const valor of ["Oficina Fictícia", "Comércio e serviços", "SP", "Campinas"]) {
      expect(html).toContain(valor);
    }
    expect(html).toMatch(/15\/03\/2024|2024-03-15/);
    expect(html).toMatch(/1\.?234,56/);
    expect(html).toMatch(/edição está disponível em uma conta própria|não é possível editar|somente leitura/i);
    expect(html).not.toMatch(/<form\b|<button\b[^>]*>Salvar/i);
  });

  it("redireciona ao onboarding quando a leitura retorna nao_encontrado", async () => {
    obterPerfil.mockResolvedValue({ ok: false, erro: { codigo: "nao_encontrado", mensagem: "Perfil não encontrado." } });

    await expect(PaginaPerfil()).rejects.toThrow("REDIRECIONADO");
    expect(redirect).toHaveBeenCalledWith("/onboarding");
  });

  it("encaminha uma falha de leitura ao estado de erro sem expor detalhes nem redirecionar", async () => {
    obterPerfil.mockResolvedValue({ ok: false, erro: { codigo: "interno", mensagem: "detalhe interno de teste" } });
    await expect(PaginaPerfil()).rejects.toThrow(/^Não foi possível carregar o perfil\.$/);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("anuncia o salvamento pendente e marca o formulário ocupado", async () => {
    estadoDoFormulario(null, true);
    const html = await renderizar();
    expect(html).toMatch(/<form\b[^>]*\baria-busy="true"/);
    expect(html).toMatch(/Salvando/i);
  });

  it("anuncia o sucesso do salvamento", async () => {
    const { nomeNegocio, atividade, uf, municipio, dataAbertura, receitaInicialCentavos } = perfil;
    estadoDoFormulario({
      status: "sucesso",
      dados: { nomeNegocio, atividade, uf, municipio, dataAbertura, receitaInicialCentavos },
    });
    const html = await renderizar();
    expect(html).toMatch(/role="status"|aria-live="polite"/);
    expect(html).toContain("Perfil salvo com sucesso");
  });

  it("exibe a falha do salvamento sem mensagem de sucesso", async () => {
    estadoDoFormulario({
      status: "erro",
      erro: { codigo: "interno", mensagem: "Algo deu errado. Tente de novo em instantes." },
    });
    const html = await renderizar();
    expect(html).toMatch(/role="alert"/);
    expect(html).toContain("Algo deu errado. Tente de novo em instantes.");
    expect(html).not.toContain("Perfil salvo com sucesso");
  });
});
