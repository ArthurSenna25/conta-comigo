import { MesISO } from "@/lib/contracts/comum";
import type { Categoria, FormaPgto } from "@/lib/contracts/lancamento";

export const CATEGORIAS: Record<Categoria, string> = {
  vendas: "Vendas",
  servicos_prestados: "Serviços prestados",
  estoque: "Estoque",
  aluguel: "Aluguel",
  contas_consumo: "Contas de consumo",
  frete: "Frete",
  marketing: "Marketing",
  impostos_das: "Impostos e DAS",
  salario: "Salários",
  material_consumo: "Material de consumo",
  retirada: "Retirada",
  outras: "Outras",
};

export const FORMAS_PAGAMENTO: Record<FormaPgto, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  boleto: "Boleto",
  outro: "Outro",
};

const MES = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const MES_CURTO = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const DATA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" });

export const dataUtc = (dia: string) => new Date(`${dia}T00:00:00Z`);
export const tituloMes = (mes: string) => MES.format(dataUtc(`${mes}-01`));
export const mesCurto = (dia: string) => MES_CURTO.format(dataUtc(dia)).replace(/\.$/, "");
export const dataLonga = (dia: string) => DATA.format(dataUtc(dia));

export function mesSelecionado(mes: unknown, hoje: string): string {
  const parsed = MesISO.safeParse(mes);
  const atual = hoje.slice(0, 7);
  return parsed.success && parsed.data >= "0001-01" && parsed.data <= atual ? parsed.data : atual;
}

export function deslocarMes(mes: string, passo: -1 | 1): string {
  const data = dataUtc(`${mes}-01`);
  data.setUTCMonth(data.getUTCMonth() + passo);
  return data.toISOString().slice(0, 7);
}

export function periodoDoMes(mes: string) {
  return { de: `${mes}-01`, ate: `${deslocarMes(mes, 1)}-01` };
}

export function centavosDoCampo(entrada: string): number | null {
  const valor = entrada.trim();
  // Aceita o formato brasileiro e o ponto decimal emitido por alguns teclados.
  const partes = /^(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/.exec(valor)
    ?? /^(\d+)\.(\d{1,2})$/.exec(valor);
  if (!partes) return null;
  const reais = partes[1].replaceAll(".", "");
  const centavos = (partes[2] ?? "").padEnd(2, "0");
  return Number(reais + centavos);
}
