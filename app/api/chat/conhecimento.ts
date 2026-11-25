import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Fonte, type TrechoKb } from "@/lib/contracts";

const ARQUIVOS = [
  "limite-mei.md", "limite-proporcional.md", "excesso-mei.md", "das-mei.md", "vencimento-das.md",
] as const;

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(/[a-z0-9]+%?/g)?.join(" ") ?? "";
}

export async function selecionarTrechos(pergunta: string): Promise<TrechoKb[]> {
  if ([...pergunta.matchAll(/\b20\d{2}\b/g)].some(([ano]) => ano !== "2026")) return [];
  const busca = ` ${normalizar(pergunta)} `;
  const temas = await Promise.all(ARQUIVOS.map(async (nome) => {
    const conteudo = await readFile(join(process.cwd(), "kb", nome), "utf8");
    const [titulo, fonte, data, palavras, ...corpo] = conteudo.split(/\r?\n/);
    const texto = corpo.join("\n").trim();
    const citacao = Fonte.parse({
      titulo: titulo.replace(/^# /, ""),
      arquivo: `kb/${nome}`,
      url: fonte.replace(/^Fonte: /, ""),
      verificadoEm: data.replace(/^Verificado em: /, ""),
    });
    if (!texto || !palavras.startsWith("Palavras-chave: ")) throw new Error("Base jurídica inválida");
    const peso = palavras.slice("Palavras-chave: ".length).split(", ")
      .filter((p) => busca.includes(` ${normalizar(p)} `)).length;
    return { peso, trecho: { fonte: citacao, texto } };
  }));
  return temas.filter(({ peso }) => peso > 0).sort((a, b) => b.peso - a.peso).slice(0, 3).map(({ trecho }) => trecho);
}
