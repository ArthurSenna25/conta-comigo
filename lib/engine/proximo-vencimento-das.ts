import { DataISO } from "@/lib/contracts";

// Agenda do Simples Nacional, consultada em 25/11/2026: o prazo normal é
// dia 20 ou o primeiro dia útil posterior quando não houver expediente bancário.
// https://www8.receita.fazenda.gov.br/SimplesNacional/ConteudoApoio/Agenda/Agenda.aspx
const DIA_VENCIMENTO_DAS = 20;

// Resolução CMN nº 4.880/2020, art. 6º, consultada em 25/11/2026: sábados,
// domingos e feriados de âmbito nacional são dias não úteis para operações financeiras.
// https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=4880&tipo=RESOLU%C3%87%C3%83O+CMN
// Feriados bancários nacionais de 2026 divulgados pela Febraban, consulta em 25/11/2026.
// https://portal.febraban.org.br/Noticia/4413/pt_br
const FERIADOS_BANCARIOS_NACIONAIS_2026 = new Set([
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-04-03",
  "2026-04-21",
  "2026-05-01",
  "2026-06-04",
  "2026-09-07",
  "2026-10-12",
  "2026-11-02",
  "2026-11-15",
  "2026-11-20",
  "2026-12-25",
]);

// PENDENTE: feriados regionais, prorrogações excepcionais e calendários
// bancários de outros anos. Fora de 2026, aplica-se apenas o ajuste de fim
// de semana. Pontos facultativos exigem confirmação de fechamento bancário.
function diaUtilBancario(data: Date): boolean {
  const diaDaSemana = data.getUTCDay();
  return diaDaSemana !== 0
    && diaDaSemana !== 6
    && !FERIADOS_BANCARIOS_NACIONAIS_2026.has(data.toISOString().slice(0, 10));
}

function ajustarVencimento(data: Date): void {
  while (!diaUtilBancario(data)) {
    data.setUTCDate(data.getUTCDate() + 1);
  }
}

/** Próximo vencimento ordinário do DAS, a partir da data civil `hoje` (inclusive). */
export function proximoVencimentoDas(hoje: string): string {
  if (!DataISO.safeParse(hoje).success) {
    throw new RangeError("A data de referência deve ser uma data civil válida no formato YYYY-MM-DD");
  }

  const vencimento = new Date(`${hoje}T00:00:00.000Z`);
  vencimento.setUTCDate(DIA_VENCIMENTO_DAS);
  ajustarVencimento(vencimento);

  if (vencimento.toISOString().slice(0, 10) < hoje) {
    vencimento.setUTCMonth(vencimento.getUTCMonth() + 1, DIA_VENCIMENTO_DAS);
    ajustarVencimento(vencimento);
  }

  return vencimento.toISOString().slice(0, 10);
}
