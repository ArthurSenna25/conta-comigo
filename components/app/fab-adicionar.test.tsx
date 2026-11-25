import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FabAdicionar } from "./fab-adicionar";

const m = vi.hoisted(() => ({ ADICIONAR: { href: "/adicionar", rotulo: "Adicionar", ativo: false } }));
vi.mock("./navegacao", () => m);

beforeEach(() => {
  m.ADICIONAR.ativo = false;
});

describe("FabAdicionar", () => {
  it("desligado: não renderiza nada (não cobre o painel)", () => {
    expect(renderToStaticMarkup(<FabAdicionar />)).toBe("");
  });

  it("ligado: aparece como link para /adicionar", () => {
    m.ADICIONAR.ativo = true;
    const html = renderToStaticMarkup(<FabAdicionar />);
    expect(html).toContain('href="/adicionar"');
    expect(html).toContain("Adicionar");
  });
});
