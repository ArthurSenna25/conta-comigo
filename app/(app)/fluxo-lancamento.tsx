"use client";

import { createContext, useContext, useReducer, type ActionDispatch, type ReactNode } from "react";
import type { Rascunho } from "@/lib/contracts";

/**
 * Estado entre /adicionar → /conferir → /painel, só na memória do cliente: rascunho da IA não é persistido
 * (nem banco, nem localStorage). Refresh perde os rascunhos de propósito.
 */
export type Aviso = { titulo: string; sub?: string };
export type EstadoFluxo = { rascunhos: Rascunho[] | null; aviso: Aviso | null };
export type AcaoFluxo =
  | { tipo: "guardar"; rascunhos: Rascunho[] }
  | { tipo: "concluir"; aviso: Aviso | null }
  | { tipo: "avisoVisto" };

/** Rodapé de ação fixo das telas de fluxo (04 § Estrutura comum: padding 12 20 34), acima do indicador home. */
export const RODAPE_FLUXO =
  "sticky bottom-0 z-[var(--z-content)] flex flex-col gap-3 border-t border-line bg-[oklch(0.16_0.025_255/0.96)] px-5 pt-3 " +
  "pb-[max(34px,calc(14px+env(safe-area-inset-bottom)))] backdrop-blur-[12px]";

export const FLUXO_INICIAL: EstadoFluxo = { rascunhos: null, aviso: null };

export function fluxo(estado: EstadoFluxo, acao: AcaoFluxo): EstadoFluxo {
  switch (acao.tipo) {
    case "guardar":
      return { rascunhos: acao.rascunhos.length > 0 ? acao.rascunhos : null, aviso: null };
    case "concluir":
      return { rascunhos: null, aviso: acao.aviso };
    case "avisoVisto":
      return estado.aviso ? { ...estado, aviso: null } : estado;
  }
}

const Contexto = createContext<[EstadoFluxo, ActionDispatch<[AcaoFluxo]>] | null>(null);

export function ProvedorFluxo({ children }: { children: ReactNode }) {
  return <Contexto value={useReducer(fluxo, FLUXO_INICIAL)}>{children}</Contexto>;
}

export function useFluxo() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useFluxo fora do ProvedorFluxo");
  return valor;
}
