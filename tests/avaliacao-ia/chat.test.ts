import { expect, it, vi } from "vitest";
import { lerChat, prepararChat } from "@/lib/ai/saidas";
import { avaliarResposta, casosChat, contextoDaAvaliacao } from "./gabarito-chat";

vi.mock("server-only", () => ({}));

it.each(casosChat)("$id resolve o gabarito com fonte e dados determinísticos", async (caso) => {
  const contexto = await contextoDaAvaliacao(caso);
  const referencias = caso.fontes.map((f) => contexto.kb.findIndex((t) => t.fonte.arquivo === `kb/${f}.md`));
  const preparado = prepararChat([{ role: "user", conteudo: caso.pergunta }], contexto);
  const resultado = preparado.orientacao
    ? { resposta: preparado.orientacao, fontes: [] }
    : lerChat({ indicador: caso.indicador, referencias }, contexto, preparado.periodoDiferente);
  expect(avaliarResposta(caso, resultado, contexto.kb)).toMatchObject({ aprovado: true });
  expect(contexto.dashboard.alertas).toEqual([]);
});
