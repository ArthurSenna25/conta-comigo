import { z } from "zod";
import { DataISO, Timestamp, Uuid } from "./comum";

/** Define o valor do DAS (ICMS e/ou ISS). */
export const Atividade = z.enum(["comercio", "servicos", "ambos"]);

export const PerfilInput = z.object({
  nomeNegocio: z.string().trim().min(1).max(80),
  ehMei: z.boolean(),
  atividade: Atividade,
  uf: z.string().regex(/^[A-Z]{2}$/, "UF inválida"),
  municipio: z.string().trim().min(1).max(80),
  /** Limite do MEI é proporcional aos meses no ano de abertura. */
  dataAbertura: DataISO,
  /** Faturamento do ano informado no onboarding (antes de usar o app). */
  receitaInicialCentavos: z.int().min(0).max(1_000_000_000),
});

export const Perfil = PerfilInput.extend({
  userId: Uuid,
  criadoEm: Timestamp,
});

export type Atividade = z.infer<typeof Atividade>;
export type PerfilInput = z.infer<typeof PerfilInput>;
export type Perfil = z.infer<typeof Perfil>;
