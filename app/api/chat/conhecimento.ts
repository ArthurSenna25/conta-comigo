import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { perguntaSobreExcessoMei } from "@/lib/ai/saidas";
import { Fonte, type TrechoKb } from "@/lib/contracts";

const ARQUIVOS = [
  "limite-mei.md", "limite-proporcional.md", "excesso-mei.md", "das-mei.md", "vencimento-das.md",
  "limite-mei-2027-2028.md", "mei-lc-238-empregados-e-perdao.md", "reforma-tributaria-mei.md",
] as const;

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(/[a-z0-9]+%?/g)?.join(" ") ?? "";
}

export async function selecionarTrechos(pergunta: string): Promise<TrechoKb[]> {
  // O ano no número de uma lei não é necessariamente o exercício da pergunta.
  const anos = [...pergunta.replace(/\b\d+\s*\/\s*20\d{2}\b/g, "").matchAll(/\b20\d{2}\b/g)]
    .map(([ano]) => Number(ano));
  const busca = ` ${normalizar(pergunta)} `;
  const excessoMei = perguntaSobreExcessoMei(pergunta);
  const limitePessoal = /\bmeu (?:limite|teto)(?: de faturamento| anual| este ano)? $|\blimite (?:do meu mei|no meu painel)\b|\bquanto (?:ainda )?posso faturar(?: este ano| no ano)? $/.test(busca);
  const valorDasPessoal = /\bmeu das\b/.test(busca) && !/\b(?:vence|vencimento|prazo|quando)\b/.test(busca);
  const limiteFuturo = /\b(?:limite|teto)\b/.test(busca)
    && (anos.some((ano) => ano > 2026) || /\b(?:110|140) (?:mil|000)\b/.test(busca));
  const arquivos = (excessoMei ? ["excesso-mei.md"] : limiteFuturo ? ["limite-mei-2027-2028.md"] : ARQUIVOS)
    .filter((nome) => anos.every((ano) => {
      if (nome === "limite-mei-2027-2028.md") return ano >= 2026;
      if (nome === "mei-lc-238-empregados-e-perdao.md") return ano >= 2026;
      if (nome === "reforma-tributaria-mei.md") return ano >= 2026 && ano <= 2033;
      return ano === 2026;
    }));
  const temas = await Promise.all(arquivos.map(async (nome) => {
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
    return { peso: excessoMei || limiteFuturo || fonteDoLimite || (valorDasPessoal && nome === "das-mei.md") ? peso + 1 : peso,
      trecho: { fonte: citacao, texto } };
  }));
  return temas.filter(({ peso }) => peso > 0).sort((a, b) => b.peso - a.peso).slice(0, 3).map(({ trecho }) => trecho);
}
