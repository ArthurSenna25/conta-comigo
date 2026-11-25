import { LancamentoInput, type Categoria, type FormaPgto, type Origem, type Rascunho, type TipoLancamento } from "@/lib/contracts";

/**
 * Abaixo desta confiança o campo lido pela IA aparece em âmbar ("· confira"). PREMISSA: o handoff não define
 * o corte; a camada de IA já zera a confiança de campo não lido (lib/ai/saidas.ts).
 */
export const CONFIANCA_MIN = 0.7;
/** InputMoeda (03): "centavos entram primeiro", no máximo 9 dígitos (R$ 9.999.999,99). */
export const MAX_DIGITOS_VALOR = 9;

/** Um lançamento em edição na tela. Valor em centavos inteiros; 0 = vazio. Data "" = vazia. */
export type Formulario = {
  tipo: TipoLancamento;
  data: string;
  valorCentavos: number;
  categoria: Categoria;
  descricao: string;
  contraparte: string | null;
  formaPgto: FormaPgto | null;
  origem: Origem;
  dataDuvidosa: boolean;
  valorDuvidoso: boolean;
};

export type CampoComErro = "valor" | "data" | "descricao" | "geral";
export type Erros = Partial<Record<CampoComErro, string>>;

/** Primeiro as 4 do handoff (03 § Chip de categoria), depois as demais do contrato. */
export const ORDEM_CATEGORIAS: readonly Categoria[] = [
  "servicos_prestados",
  "vendas",
  "material_consumo",
  "outras",
  "estoque",
  "aluguel",
  "contas_consumo",
  "frete",
  "marketing",
  "impostos_das",
  "salario",
  "retirada",
];

/** Só dígitos, sem zeros à esquerda, até 9 dígitos. Tudo o mais é ignorado. */
export function centavosDigitados(entrada: string): number {
  const digitos = entrada.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITOS_VALOR);
  return digitos ? Number(digitos) : 0;
}

/** Campo que a IA não leu (null) fica vazio e marcado para conferir. */
export function formularioDoRascunho(r: Rascunho): Formulario {
  return {
    tipo: r.tipo,
    data: r.data ?? "",
    valorCentavos: r.valorCentavos ?? 0,
    categoria: r.categoria,
    descricao: r.descricao,
    contraparte: r.contraparte,
    formaPgto: r.formaPgto,
    origem: r.origem,
    dataDuvidosa: r.data === null || r.confianca.data < CONFIANCA_MIN,
    valorDuvidoso: r.valorCentavos === null || r.confianca.valor < CONFIANCA_MIN,
  };
}

export function formularioManual(hoje: string): Formulario {
  return {
    tipo: "receita",
    data: hoje,
    valorCentavos: 0,
    categoria: ORDEM_CATEGORIAS[0],
    descricao: "",
    contraparte: null,
    formaPgto: null,
    origem: "manual",
    dataDuvidosa: false,
    valorDuvidoso: false,
  };
}

const CAMPO_DO_CONTRATO: Partial<Record<string, CampoComErro>> = { valorCentavos: "valor", data: "data", descricao: "descricao" };

/** Mesma regra do servidor (que revalida tudo): o cliente só adianta o erro, sem sair da tela. */
export function validar(f: Formulario, hoje: string): { ok: true; lancamento: LancamentoInput } | { ok: false; erros: Erros } {
  const erros: Erros = {};
  if (f.valorCentavos <= 0) erros.valor = "Digite um valor maior que zero";
  if (!f.data) erros.data = "Informe a data";
  else if (f.data > hoje) erros.data = "A data não pode ser no futuro";
  if (!f.descricao.trim()) erros.descricao = "Descreva o lançamento";

  const parsed = LancamentoInput.safeParse({
    tipo: f.tipo,
    data: f.data,
    valorCentavos: f.valorCentavos,
    categoria: f.categoria,
    descricao: f.descricao,
    contraparte: f.contraparte?.trim() || null,
    formaPgto: f.formaPgto,
    origem: f.origem,
  });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const campo = CAMPO_DO_CONTRATO[String(issue.path[0])] ?? "geral";
      erros[campo] ??= "Confira este campo";
    }
  }
  return parsed.success && Object.keys(erros).length === 0 ? { ok: true, lancamento: parsed.data } : { ok: false, erros };
}

/** Lote para uma única chamada a confirmarLancamento; para no primeiro rascunho inválido. */
export function validarLote(
  forms: readonly Formulario[],
  hoje: string,
): { ok: true; lancamentos: LancamentoInput[] } | { ok: false; indice: number; erros: Erros } {
  const lancamentos: LancamentoInput[] = [];
  for (const [indice, f] of forms.entries()) {
    const r = validar(f, hoje);
    if (!r.ok) return { ok: false, indice, erros: r.erros };
    lancamentos.push(r.lancamento);
  }
  return { ok: true, lancamentos };
}

/** FormData que confirmarLancamento espera: `lancamentos` em JSON. */
export function formDataDoLote(lancamentos: readonly LancamentoInput[]): FormData {
  const fd = new FormData();
  fd.set("lancamentos", JSON.stringify(lancamentos));
  return fd;
}
