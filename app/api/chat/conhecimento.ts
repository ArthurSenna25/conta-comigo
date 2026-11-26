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
  const limitePessoal = /\bmeu (?:limite|teto)(?: de faturamento| anual| este ano)? $|\blimite (?:do meu mei|no meu painel)\b|\bquanto (?:ainda )?posso faturar(?: este ano| no ano)? $/.test(busca);
  const valorDasPessoal = /\bmeu das\b/.test(busca) && !/\b(?:vence|vencimento|prazo|quando)\b/.test(busca);
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
    const fonteDoLimite = limitePessoal && (nome === "limite-mei.md" || nome === "limite-proporcional.md");
    return { peso: fonteDoLimite || (valorDasPessoal && nome === "das-mei.md") ? peso + 1 : peso,
      trecho: { fonte: citacao, texto } };
  }));
  return temas.filter(({ peso }) => peso > 0).sort((a, b) => b.peso - a.peso).slice(0, 3).map(({ trecho }) => trecho);
}
