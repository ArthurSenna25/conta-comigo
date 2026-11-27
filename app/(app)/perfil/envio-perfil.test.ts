import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { comRecuperacaoDeTransporte, enviarPerfilHidratado, iniciarEnvio } from "./envio-perfil";

describe("envio hidratado do perfil", () => {
  it("aceita apenas um evento enquanto a trava estiver ativa e permite tentar novamente", () => {
    const trava = { current: false };
    const despachar = vi.fn();
    iniciarEnvio(trava, false, despachar);
    iniciarEnvio(trava, false, despachar);
    trava.current = false;
    iniciarEnvio(trava, true, despachar);
    expect(despachar).toHaveBeenCalledOnce();
    iniciarEnvio(trava, false, despachar);
    expect(despachar).toHaveBeenCalledTimes(2);
  });

  it("converte rejeição de transporte em erro amigável e permite reenviar os mesmos dados", async () => {
    const dados = new FormData();
    dados.set("receitaInicialCentavos", "17,50");
    const acao = vi.fn()
      .mockRejectedValueOnce(new TypeError("detalhe interno de transporte"))
      .mockResolvedValueOnce(null);
    const resultado = await comRecuperacaoDeTransporte(acao, dados);
    expect(resultado).toMatchObject({
      status: "erro", erro: { mensagem: expect.stringMatching(/tente novamente/i) },
    });
    expect(JSON.stringify(resultado)).not.toContain("detalhe interno");
    await expect(comRecuperacaoDeTransporte(acao, dados)).resolves.toBeNull();
    expect(acao.mock.calls.map(([, formulario]) => formulario.get("receitaInicialCentavos")))
      .toEqual(["17,50", "17,50"]);
  });

  it.each(["preparação", "despacho"])("libera a trava após exceção síncrona na etapa de %s", (etapa) => {
    const trava = { current: false };
    const erro = new Error(etapa);
    const despachar = vi.fn();
    expect(() => iniciarEnvio(trava, false, () => { throw erro; })).toThrow(erro);
    expect(trava.current).toBe(false);
    iniciarEnvio(trava, false, despachar);
    expect(despachar).toHaveBeenCalledOnce();
  });

  it("mantém a última gravação e o rascunho efetivamente enviado após falha de transporte", async () => {
    const salvos = {
      nomeNegocio: "Negócio salvo", atividade: "ambos" as const, uf: "ZZ",
      municipio: "Município salvo", dataAbertura: "2024-02-20", receitaInicialCentavos: 1750,
    };
    const digitados = {
      nomeNegocio: "  Negócio editado  ", atividade: "ambos", uf: "ZZ",
      municipio: "Outro município", dataAbertura: "2024-02-20", receitaInicialCentavos: "",
    };
    const dados = new FormData();
    for (const [campo, valor] of Object.entries(digitados)) dados.set(campo, valor);
    const acao = vi.fn()
      .mockResolvedValueOnce({ status: "sucesso", dados: salvos, aviso: "Atualização pendente." })
      .mockRejectedValueOnce(new TypeError("Rede indisponível"));
    const sucesso = await enviarPerfilHidratado(acao, new FormData());
    const falha = await enviarPerfilHidratado(acao, dados, sucesso.salvos);
    expect(falha).toMatchObject({
      salvos,
      estado: { status: "erro", rascunho: digitados },
    });
  });

  it("propaga o redirecionamento real do Next", async () => {
    const acao = async () => redirect("/onboarding");
    await expect(comRecuperacaoDeTransporte(acao, new FormData())).rejects.toThrow("NEXT_REDIRECT");
  });
});
