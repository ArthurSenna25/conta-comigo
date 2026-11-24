import { describe, expect, it } from "vitest";
import { VERSAO_CONSENTIMENTO } from "@/lib/contracts";
import { consentimentoVigente, destinoDoAcesso, finalidadesDoAceite, type AceiteRegistrado } from "./acesso";

describe("finalidadesDoAceite: o que o cadastro grava em consentimentos", () => {
  it("caixa de termos grava as DUAS finalidades obrigatórias (termos_uso e privacidade)", () => {
    expect(finalidadesDoAceite({ aceiteTermos: true, aceiteEnvioIa: false })).toEqual(["termos_uso", "privacidade"]);
  });

  it("envio_ia só entra se a caixa opcional estiver marcada", () => {
    expect(finalidadesDoAceite({ aceiteTermos: true, aceiteEnvioIa: true })).toEqual([
      "termos_uso",
      "privacidade",
      "envio_ia",
    ]);
  });

  it("o que o cadastro grava torna o consentimento vigente (sem deixar o usuário trancado)", () => {
    const gravado = finalidadesDoAceite({ aceiteTermos: true, aceiteEnvioIa: false }).map((finalidade) => ({
      finalidade,
      versao: VERSAO_CONSENTIMENTO,
      revogadoEm: null,
    }));
    expect(consentimentoVigente(gravado)).toBe(true);
  });
});

const aceite = (finalidade: AceiteRegistrado["finalidade"], extra: Partial<AceiteRegistrado> = {}): AceiteRegistrado => ({
  finalidade,
  versao: VERSAO_CONSENTIMENTO,
  revogadoEm: null,
  ...extra,
});

describe("consentimentoVigente: termos e privacidade da versão atual, não revogados", () => {
  it("vigente com termos_uso e privacidade da versão atual", () => {
    expect(consentimentoVigente([aceite("termos_uso"), aceite("privacidade")])).toBe(true);
  });

  it("envio_ia é opcional: não é exigido nem basta", () => {
    expect(consentimentoVigente([aceite("termos_uso"), aceite("privacidade"), aceite("envio_ia")])).toBe(true);
    expect(consentimentoVigente([aceite("envio_ia")])).toBe(false);
  });

  it("falta privacidade ou termos_uso: não vigente", () => {
    expect(consentimentoVigente([aceite("termos_uso")])).toBe(false);
    expect(consentimentoVigente([aceite("privacidade")])).toBe(false);
    expect(consentimentoVigente([])).toBe(false);
  });

  it("aceite de versão antiga não vale: exige aceitar o texto novo", () => {
    expect(consentimentoVigente([aceite("termos_uso", { versao: "2020-01-01" }), aceite("privacidade")])).toBe(false);
  });

  it("aceite revogado não vale", () => {
    expect(
      consentimentoVigente([aceite("termos_uso", { revogadoEm: "2026-11-24T10:00:00Z" }), aceite("privacidade")]),
    ).toBe(false);
  });
});

describe("destinoDoAcesso: ordem do portão (sessão, consentimento, perfil)", () => {
  const ok = { logado: true, consentimentoVigente: true, temPerfil: true };

  it("sem sessão: /entrar, mesmo que o resto esteja 'ok'", () => {
    expect(destinoDoAcesso({ ...ok, logado: false })).toBe("/entrar");
  });

  it("logado sem consentimento: /consentimento e não pode usar o app (falha parcial do cadastro)", () => {
    expect(destinoDoAcesso({ ...ok, consentimentoVigente: false })).toBe("/consentimento");
  });

  it("sem consentimento vem antes de sem perfil", () => {
    expect(destinoDoAcesso({ logado: true, consentimentoVigente: false, temPerfil: false })).toBe("/consentimento");
  });

  it("logado, com consentimento e sem perfil: /onboarding", () => {
    expect(destinoDoAcesso({ ...ok, temPerfil: false })).toBe("/onboarding");
  });

  it("tudo em ordem: libera (null)", () => {
    expect(destinoDoAcesso(ok)).toBeNull();
  });
});
