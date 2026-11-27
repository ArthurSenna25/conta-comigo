import { unstable_rethrow } from "next/navigation";
import type { DadosEditaveis, EstadoPerfil, RascunhoPerfil } from "@/app/(app)/perfil/dados-perfil";

type AcaoPerfil = (anterior: EstadoPerfil | null, dados: FormData) => Promise<EstadoPerfil | null>;

export function iniciarEnvio(trava: { current: boolean }, pendente: boolean, despachar: () => void) {
  if (pendente || trava.current) return;
  trava.current = true;
  try {
    despachar();
  } catch (erro) {
    trava.current = false;
    throw erro;
  }
}

export async function comRecuperacaoDeTransporte(
  acao: AcaoPerfil,
  dados: FormData,
): Promise<EstadoPerfil | null> {
  try {
    return await acao(null, dados);
  } catch (erro) {
    unstable_rethrow(erro);
    const texto = (campo: keyof RascunhoPerfil) => {
      const valor = dados.get(campo);
      return typeof valor === "string" ? valor : "";
    };
    return {
      status: "erro",
      erro: {
        codigo: "interno",
        mensagem: "Não foi possível confirmar o salvamento. Seus dados continuam no formulário. Tente novamente.",
      },
      rascunho: {
        nomeNegocio: texto("nomeNegocio"),
        atividade: texto("atividade"),
        uf: texto("uf"),
        municipio: texto("municipio"),
        dataAbertura: texto("dataAbertura"),
        receitaInicialCentavos: texto("receitaInicialCentavos"),
      },
    };
  }
}

export async function enviarPerfilHidratado(acao: AcaoPerfil, dados: FormData, salvos?: DadosEditaveis) {
  const estado = await comRecuperacaoDeTransporte(acao, dados);
  return { estado, salvos: estado?.status === "sucesso" ? estado.dados : salvos };
}
