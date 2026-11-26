import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatarCentavos } from "@/components/moeda";
import { ROTULO_SIMULACAO, Simulacao } from "./dialogo-experimente";
import { type AcaoSimulacao, ESTADO_INICIAL, PAINEL_FICTICIO, RASCUNHO_FAKE, roteiro } from "./roteiro";

const nada = () => {};
const rodar = (...acoes: AcaoSimulacao[]) => acoes.reduce(roteiro, ESTADO_INICIAL);

afterEach(() => vi.unstubAllGlobals());

describe("Simulacao", () => {
  it("mostra o rótulo fixo e o painel fictício", () => {
    const html = renderToStaticMarkup(<Simulacao aoFechar={nada} />);
    expect(html).toContain(ROTULO_SIMULACAO);
    expect(html).toContain(formatarCentavos(PAINEL_FICTICIO.faturadoCentavos));
    expect(html).toContain(">Escrever<");
  });

  it("depois de confirmar mostra o faturado novo e o Recomeçar", () => {
    const fim = rodar("escrever", "enviar", "rascunhoPronto", "confirmar");
    const html = renderToStaticMarkup(<Simulacao aoFechar={nada} inicial={fim} />);
    expect(html).toContain(formatarCentavos(PAINEL_FICTICIO.faturadoCentavos + RASCUNHO_FAKE.valorCentavos));
    expect(html).toContain("Recomeçar");
    expect(html).toContain(ROTULO_SIMULACAO);
  });

  it("nenhuma etapa chama a rede", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const etapas: AcaoSimulacao[] = ["escrever", "enviar", "rascunhoPronto", "confirmar", "recomecar"];
    let estado = ESTADO_INICIAL;
    for (const acao of etapas) {
      estado = roteiro(estado, acao);
      renderToStaticMarkup(<Simulacao aoFechar={nada} inicial={estado} />);
    }
    expect(fetch).not.toHaveBeenCalled();
  });
});
