import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AvisoFalha } from "@/app/(app)/adicionar/adicionar";
import { Conversa, FalhaChat } from "@/app/(app)/chat/conversa";
import { MENSAGEM_IA_SOMENTE_DEMO } from "@/lib/security/portao-api";
import { AVISO_IA_DEMO, AvisoIaDemo } from "./ia-demo";

vi.mock("@/actions/auth", () => ({ entrarComoDemo: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const recusaDemo = { status: 403, mensagem: MENSAGEM_IA_SOMENTE_DEMO };
const nada = () => {};

describe("aviso de envio à IA da demo", () => {
  it("aparece só na demo", () => {
    expect(renderToStaticMarkup(<AvisoIaDemo demo id="a" />)).toContain(AVISO_IA_DEMO);
    expect(renderToStaticMarkup(<AvisoIaDemo demo={false} id="a" />)).toBe("");
  });

  it("o chat mostra o aviso perto do campo só na demo", () => {
    expect(renderToStaticMarkup(<Conversa demo />)).toContain(AVISO_IA_DEMO);
    expect(renderToStaticMarkup(<Conversa demo={false} />)).not.toContain(AVISO_IA_DEMO);
  });
});

describe("recusa \"IA só na demo\" (403 MENSAGEM_IA_SOMENTE_DEMO)", () => {
  it("/adicionar: mensagem do servidor, entrar na demo e preencher na mão", () => {
    const html = renderToStaticMarkup(<AvisoFalha falha={recusaDemo} onTentar={nada} podeTentar />);
    expect(html).toContain(MENSAGEM_IA_SOMENTE_DEMO);
    expect(html).toContain("Entrar na demonstração");
    expect(html).toContain('href="/conferir?modo=manual"');
    expect(html).not.toContain("Conferir consentimento");
  });

  it("/chat: mensagem do servidor e entrar na demo, sem o texto genérico", () => {
    const html = renderToStaticMarkup(<FalhaChat falha={recusaDemo} onTentar={nada} podeTentar />);
    expect(html).toContain(MENSAGEM_IA_SOMENTE_DEMO);
    expect(html).toContain("Entrar na demonstração");
    expect(html).not.toContain("Confira seu acesso à demo");
  });

  it("outro 403 continua apontando para o consentimento", () => {
    const falha = { status: 403, mensagem: "Você não tem permissão para esta ação." };
    expect(renderToStaticMarkup(<FalhaChat falha={falha} onTentar={nada} podeTentar />)).toContain("Conferir consentimento");
    expect(renderToStaticMarkup(<AvisoFalha falha={falha} onTentar={nada} podeTentar />)).toContain("Conferir consentimento");
  });
});
