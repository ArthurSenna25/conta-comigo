"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { salvarPerfil } from "@/actions/perfil";
import { ufs } from "@/app/onboarding/ufs";
import type { ErroResposta } from "@/lib/contracts/comum";

function texto(dados: FormData, campo: string) {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function paraCentavos(entrada: FormDataEntryValue | null) {
  if (entrada !== null && typeof entrada !== "string") return NaN;
  const valor = entrada?.trim();
  if (!valor) return 0;

  // Aceita a vírgula brasileira e o ponto decimal de alguns teclados. Não arredonda valores.
  const brasileiro = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(valor);
  const decimalComPonto = /^\d+\.\d{1,2}$/.test(valor);
  if (!brasileiro && !decimalComPonto) return NaN;

  const [reais, centavos = ""] = brasileiro
    ? valor.replaceAll(".", "").split(",")
    : valor.split(".");
  return Number(reais + centavos.padEnd(2, "0"));
}

type ErroOnboarding = ErroResposta["erro"];

export async function enviarPerfil(_: ErroOnboarding | null, dados: FormData): Promise<ErroOnboarding> {
  const uf = texto(dados, "uf");
  const resultado = await salvarPerfil({
    nomeNegocio: texto(dados, "nomeNegocio"),
    atividade: texto(dados, "atividade"),
    uf: ufs.includes(uf) ? uf : "",
    municipio: texto(dados, "municipio"),
    dataAbertura: texto(dados, "dataAbertura"),
    receitaInicialCentavos: paraCentavos(dados.get("receitaInicialCentavos")),
    ehMei: true,
  });
  if (!resultado.ok) return resultado.erro;

  revalidatePath("/painel");
  redirect("/painel", RedirectType.replace);
}
