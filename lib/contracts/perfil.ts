import { z } from "zod";
import { DataISO, Timestamp, Uuid, hojeBrasil } from "./comum";

/** Define o valor do DAS (ICMS e/ou ISS). */
export const Atividade = z.enum(["comercio", "servicos", "ambos"]);

/** Objeto sem refine: o `.extend` do Zod 4 não aceita schema com refine. */
export const PerfilBase = z.object({
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

/** `hoje` injetável (testável sem mexer no relógio global). */
export const perfilInputCom = (hoje: () => string) =>
  PerfilBase.refine((p) => p.dataAbertura <= hoje(), {
    message: "A data de abertura não pode ser futura",
    path: ["dataAbertura"],
  });
export const PerfilInput = perfilInputCom(() => hojeBrasil());

export const Perfil = PerfilBase.extend({
  userId: Uuid,
  criadoEm: Timestamp,
});

export type Atividade = z.infer<typeof Atividade>;
export type PerfilInput = z.infer<typeof PerfilInput>;
export type Perfil = z.infer<typeof Perfil>;
