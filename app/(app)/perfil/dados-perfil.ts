import type { ErroResposta } from "@/lib/contracts/comum";
import type { Atividade, Perfil } from "@/lib/contracts/perfil";

export const ROTULO_ATIVIDADE = {
  comercio: "Comércio ou indústria",
  servicos: "Prestação de serviços",
  ambos: "Comércio e serviços",
} satisfies Record<Atividade, string>;

export function dadosEditaveis({
  nomeNegocio, atividade, uf, municipio, dataAbertura, receitaInicialCentavos,
}: Perfil) {
  return { nomeNegocio, atividade, uf, municipio, dataAbertura, receitaInicialCentavos };
}

export type DadosEditaveis = ReturnType<typeof dadosEditaveis>;
export type RascunhoPerfil = Record<keyof DadosEditaveis, string>;

export type EstadoPerfil =
  | { status: "sucesso"; dados: DadosEditaveis; aviso?: string }
  | { status: "erro"; erro: ErroResposta["erro"]; rascunho?: RascunhoPerfil };
