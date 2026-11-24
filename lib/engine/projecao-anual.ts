import type { EntradaLimite } from "./index";

/** Projeção linear do faturamento até 31/12. */
export function projecaoAnual({ receitasAnoCentavos, dataAbertura, hoje }: EntradaLimite): number {
  if (dataAbertura > hoje) {
    throw new RangeError("A data de abertura é posterior à data de referência");
  }
  if (!Number.isSafeInteger(receitasAnoCentavos) || receitasAnoCentavos < 0) {
    throw new RangeError("A receita deve ser um inteiro seguro não negativo em centavos");
  }

  const abriuNesteAno = dataAbertura.slice(0, 4) === hoje.slice(0, 4);
  const mesInicial = abriuNesteAno ? Number(dataAbertura.slice(5, 7)) : 1;
  const mesAtual = Number(hoje.slice(5, 7));
  const mesesDecorridos = mesAtual - mesInicial + 1;
  const mesesNoAno = 13 - mesInicial;

  const numerador = BigInt(receitasAnoCentavos) * BigInt(mesesNoAno);
  const divisor = BigInt(mesesDecorridos);
  const quociente = numerador / divisor;
  const resto = numerador % divisor;
  const projecao = resto * BigInt(2) >= divisor ? quociente + BigInt(1) : quociente;

  if (projecao > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("A projeção ultrapassa o limite de inteiros seguros em centavos");
  }
  return Number(projecao);
}
