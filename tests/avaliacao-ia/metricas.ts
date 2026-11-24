import { z } from "zod";
import { IngestResponse, Rascunho } from "@/lib/contracts";
import dados from "./casos.json";

const esperado = Rascunho.omit({ descricao: true, confianca: true, origem: true });
const campos = ["tipo", "data", "valorCentavos", "categoria", "formaPgto", "contraparte", "origem"] as const;
type Campo = typeof campos[number];
type Registro = Pick<Rascunho, Campo>;

const casoSchema = z.object({
  id: z.string().regex(/^(nota|print|audio|texto)-\d{2}$/),
  modalidade: z.enum(["foto", "print", "texto", "audio"]),
  conteudo: z.union([z.string(), z.array(z.string())]),
  esperados: z.array(esperado).max(3),
  pergunta: z.enum(["direcao", "data", "valor", "clareza"]).optional(),
});
export const casos = z.array(casoSchema).parse(dados);
export type Caso = typeof casos[number];

function normalizar(valor: unknown) {
  return typeof valor === "string"
    ? valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    : valor;
}

function iguais(a: Registro, b: Registro, campo: Campo) {
  return normalizar(a[campo]) === normalizar(b[campo]);
}

// Emparelhamento que maximiza acertos, sem depender da ordem das linhas.
// Até 3 linhas no gabarito e 50 na resposta: no máximo 8 estados por iteração.
function associar(reais: Registro[], previstos: Registro[]) {
  const indices = previstos.map(() => -1);
  const estados = new Map([[0, { pontos: 0, indices }]]);
  for (const [i, real] of reais.entries()) {
    for (const [mascara, anterior] of [...estados]) {
      previstos.forEach((previsto, j) => {
        const proxima = mascara | (1 << j);
        if (proxima === mascara) return;
        const pontos = anterior.pontos + campos.filter((c) => iguais(real, previsto, c)).length;
        if (pontos <= (estados.get(proxima)?.pontos ?? -1)) return;
        const combinacao = [...anterior.indices];
        combinacao[j] = i;
        estados.set(proxima, { pontos, indices: combinacao });
      });
    }
  }
  return [...estados.values()].sort((a, b) => b.pontos - a.pontos ||
    b.indices.filter((i) => i >= 0).length - a.indices.filter((i) => i >= 0).length)[0].indices;
}

const perguntas = {
  data: /data|que dia|qual dia|quando|em qual dia/,
  valor: /valor|quanto|quantia|preco|total/,
  direcao: /receit|despes|receb|pag|enviou|enviad|entrad|saida|direcao|entrou|saiu|quem.*transfer/,
  clareza: /./,
};

export function pontuar(caso: Caso, resposta?: IngestResponse) {
  const previstos = caso.esperados.map((r) => ({ ...r, origem: caso.modalidade }));
  const reais = resposta?.rascunhos ?? [];
  const indices = associar(reais, previstos);
  const adicionais = reais.filter((_, i) => !indices.includes(i));
  const acertos = Object.fromEntries(campos.map((c) => [c, 0])) as Record<Campo, number>;
  const faltantesCorretos = { corretos: 0, esperados: 0 };
  let registrosCorretos = 0;
  for (const [j, previsto] of previstos.entries()) {
    const real = reais[indices[j]];
    if (real && campos.every((c) => iguais(previsto, real, c))) registrosCorretos++;
    for (const c of campos) {
      const certo = Boolean(real && iguais(previsto, real, c));
      acertos[c] += Number(certo);
      if (previsto[c] === null) {
        faltantesCorretos.esperados++;
        faltantesCorretos.corretos += Number(certo);
      }
    }
  }
  const perguntaAtendida = caso.pergunta
    ? (resposta?.perguntasPendentes ?? []).some((p) => perguntas[caso.pergunta!].test(String(normalizar(p))))
    : null;
  return {
    acertos, esperados: previstos.length, devolvidos: reais.length, adicionais: adicionais.length,
    quantidadeCorreta: Boolean(resposta && reais.length === previstos.length), registrosCorretos,
    ausentes: indices.filter((i) => i === -1).length,
    duplicados: adicionais.filter((r) => indices.some((i) => i >= 0 && campos.every((c) => iguais(r, reais[i], c)))).length,
    nulos: faltantesCorretos, perguntaAtendida,
  };
}
