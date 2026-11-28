import type { Categoria } from "@/lib/contracts";
import { TETO_EXEMPLO_CENTAVOS } from "@/components/landing/limite-exemplo";

/**
 * Roteiro da simulação "Experimente sem cadastro" (landing). Tudo em memória e FICTÍCIO: sem rede, sem IA,
 * sem banco, sem storage. Fechar o diálogo descarta o estado. Mesmos números de exemplo do herói da landing.
 */
export const PAINEL_FICTICIO = {
  faturadoCentavos: 3_402_000,
  limiteCentavos: TETO_EXEMPLO_CENTAVOS,
  ano: "2026",
  das: { valorCentavos: 8_205, vencimento: "21/12/2026" },
} as const;

export const TEXTO_EXEMPLO = "recebi 120 do corte da Maria hoje";

/** O "rascunho da IA" é fixo: nesta simulação nada é lido de verdade. */
export const RASCUNHO_FAKE = {
  tipo: "receita",
  valorCentavos: 12_000,
  categoria: "servicos_prestados" satisfies Categoria,
  descricao: "Corte de cabelo",
  contraparte: "Maria",
  data: "Hoje",
} as const;

/** Tempo do "lendo…" falso. */
export const ATRASO_RASCUNHO_MS = 700;

export type Etapa = "painel" | "escrever" | "lendo" | "rascunho" | "confirmado";

export interface EstadoSimulacao {
  readonly etapa: Etapa;
  readonly faturadoCentavos: number;
}

export type AcaoSimulacao = "escrever" | "enviar" | "rascunhoPronto" | "confirmar" | "recomecar";

export const ESTADO_INICIAL: EstadoSimulacao = { etapa: "painel", faturadoCentavos: PAINEL_FICTICIO.faturadoCentavos };

/** Cada ação só vale na etapa certa: clique duplo em "Confirmar" não soma duas vezes. */
export function roteiro(estado: EstadoSimulacao, acao: AcaoSimulacao): EstadoSimulacao {
  switch (acao) {
    case "escrever":
      return estado.etapa === "painel" ? { ...estado, etapa: "escrever" } : estado;
    case "enviar":
      return estado.etapa === "escrever" ? { ...estado, etapa: "lendo" } : estado;
    case "rascunhoPronto":
      return estado.etapa === "lendo" ? { ...estado, etapa: "rascunho" } : estado;
    case "confirmar":
      return estado.etapa === "rascunho"
        ? { etapa: "confirmado", faturadoCentavos: estado.faturadoCentavos + RASCUNHO_FAKE.valorCentavos }
        : estado;
    case "recomecar":
      return ESTADO_INICIAL;
  }
}
