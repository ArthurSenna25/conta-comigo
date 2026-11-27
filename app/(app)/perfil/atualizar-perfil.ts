"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { obterPerfil, salvarPerfil } from "@/actions/perfil";
import { exigirAcesso } from "@/actions/sessao";
import { ufs } from "@/app/onboarding/ufs";
import { dadosEditaveis, type EstadoPerfil, type RascunhoPerfil } from "@/app/(app)/perfil/dados-perfil";
import type { Perfil } from "@/lib/contracts/perfil";
import { lerReceitaInicial } from "@/app/(app)/perfil/receita-inicial";

function texto(dados: FormData, campo: keyof RascunhoPerfil) {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor : "";
}

export async function atualizarPerfil(
  _anterior: EstadoPerfil | null,
  dados: unknown,
): Promise<EstadoPerfil | null> {
  let rascunho: RascunhoPerfil | undefined;
  let perfilSalvo: Perfil;
  try {
    const { demo } = await exigirAcesso("consentimento");
    if (demo) return null;
    if (!(dados instanceof FormData)) {
      return { status: "erro", erro: { codigo: "invalido", mensagem: "Envio inválido. Tente novamente." } };
    }

    const limites = {
      nomeNegocio: 80, atividade: 8, uf: 2, municipio: 80, dataAbertura: 10, receitaInicialCentavos: 16,
    } satisfies Record<keyof RascunhoPerfil, number>;
    const campos: Partial<RascunhoPerfil> = {};
    const entradas: RascunhoPerfil = {
      nomeNegocio: "", atividade: "", uf: "", municipio: "", dataAbertura: "", receitaInicialCentavos: "",
    };
    for (const campo of Object.keys(entradas) as (keyof RascunhoPerfil)[]) {
      const valores = dados.getAll(campo);
      if (valores.length > 1 || valores.some((valor) => typeof valor !== "string")) {
        campos[campo] = "Envie um único valor de texto para este campo.";
      } else {
        entradas[campo] = texto(dados, campo).slice(0, limites[campo]);
      }
    }
    // Restaura a digitação em respostas a um POST anterior à hidratação.
    rascunho = entradas;
    if (Object.keys(campos).length) {
      return { status: "erro", erro: { codigo: "invalido", mensagem: "Confira os dados e tente novamente.", campos }, rascunho };
    }

    const atual = await obterPerfil();
    if (!atual.ok) {
      if (atual.erro.codigo === "nao_encontrado") redirect("/onboarding");
      return { status: "erro", erro: atual.erro, rascunho };
    }

    const uf = texto(dados, "uf").trim();
    const salvo = await salvarPerfil({
      nomeNegocio: texto(dados, "nomeNegocio").trim(),
      atividade: texto(dados, "atividade").trim(),
      uf: ufs.includes(uf) || uf === atual.dados.uf ? uf : "",
      municipio: texto(dados, "municipio").trim(),
      dataAbertura: texto(dados, "dataAbertura").trim(),
      ehMei: atual.dados.ehMei,
      receitaInicialCentavos:
        lerReceitaInicial(dados.get("receitaInicialCentavos")) ?? atual.dados.receitaInicialCentavos,
    });
    if (!salvo.ok) {
      if (salvo.erro.codigo === "proibido") return null;
      return { status: "erro", erro: salvo.erro, rascunho };
    }

    perfilSalvo = salvo.dados;
  } catch (erro) {
    unstable_rethrow(erro);
    return {
      status: "erro",
      erro: { codigo: "interno", mensagem: "Não foi possível concluir o salvamento. Tente novamente." },
      rascunho,
    };
  }

  let aviso: string | undefined;
  for (const caminho of ["/perfil", "/painel"]) {
    try {
      revalidatePath(caminho);
    } catch (erro) {
      unstable_rethrow(erro);
      aviso = "Os dados foram salvos, mas a atualização da tela pode demorar. Recarregue a página para conferir.";
    }
  }
  return { status: "sucesso", dados: dadosEditaveis(perfilSalvo), aviso };
}
