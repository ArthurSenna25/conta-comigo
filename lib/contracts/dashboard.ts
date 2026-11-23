import { z } from "zod";
import { DataISO, MesISO, Uuid } from "./comum";
import { Categoria } from "./lancamento";

const CentavosNaoNeg = z.int().min(0);

export const TipoAlerta = z.enum([
  "das_vencendo",
  "limite_mei",
  "despesa_atipica",
  "mistura_pf_pj",
  "nota_faltando",
]);
export const Severidade = z.enum(["info", "atencao", "critico"]);

/** Calculado na leitura por lib/engine (gerarAlertas). Não há tabela de alertas. */
export const Alerta = z.object({
  /** Determinística, ex.: "das_vencendo:2026-12". Serve de key na UI. */
  chave: z.string().min(1).max(80),
  tipo: TipoAlerta,
  severidade: Severidade,
  titulo: z.string().max(80),
  mensagem: z.string().max(400),
  vencimento: DataISO.nullable(),
  lancamentoId: Uuid.nullable(),
});

export const FaixaLimite = z.enum(["ok", "70", "90", "100"]);

export const StatusLimiteMei = z.object({
  usadoCentavos: CentavosNaoNeg,
  /** R$ 81 mil, ou proporcional aos meses no ano de abertura. */
  limiteCentavos: CentavosNaoNeg,
  /** 0 a 100+ (pode passar de 100). */
  pct: z.number().min(0),
  faixa: FaixaLimite,
});

export const ProximoDas = z.object({
  vencimento: DataISO,
  valorCentavos: z.int().positive(),
});

export const ResumoMes = z.object({
  mes: MesISO,
  receitaCentavos: CentavosNaoNeg,
  despesaCentavos: CentavosNaoNeg,
  saldoCentavos: z.int(), // pode ser negativo
  despesasPorCategoria: z.array(
    z.object({ categoria: Categoria, totalCentavos: CentavosNaoNeg }),
  ),
});

export const DashboardResponse = z.object({
  resumoMes: ResumoMes,
  limiteMei: StatusLimiteMei.extend({ projecaoAnualCentavos: CentavosNaoNeg }),
  proximoDas: ProximoDas,
  alertas: z.array(Alerta),
});

export type TipoAlerta = z.infer<typeof TipoAlerta>;
export type Severidade = z.infer<typeof Severidade>;
export type Alerta = z.infer<typeof Alerta>;
export type FaixaLimite = z.infer<typeof FaixaLimite>;
export type StatusLimiteMei = z.infer<typeof StatusLimiteMei>;
export type ProximoDas = z.infer<typeof ProximoDas>;
export type ResumoMes = z.infer<typeof ResumoMes>;
export type DashboardResponse = z.infer<typeof DashboardResponse>;
