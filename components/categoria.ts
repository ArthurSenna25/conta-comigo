import type { Categoria } from "@/lib/contracts";

/** Rótulo da categoria para a tela (nomes do Dossiê § IA, "Categorias fixas"). */
export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  vendas: "Vendas",
  servicos_prestados: "Serviços prestados",
  estoque: "Estoque e mercadoria",
  aluguel: "Aluguel",
  contas_consumo: "Energia, água e internet",
  frete: "Frete",
  marketing: "Marketing",
  impostos_das: "Impostos e DAS",
  salario: "Salário",
  material_consumo: "Material de consumo",
  retirada: "Pró-labore e retirada",
  outras: "Outras",
};
