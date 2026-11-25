import Link from "next/link";
import { BOTAO } from "./botao";

export type EstadoVazioProps =
  | { tipo: "geral"; hrefAdicionar?: string }
  | { tipo: "filtro" };

/** "geral": bloco do DS com Fio vazio e CTA. "filtro": lista filtrada sem itens. */
export function EstadoVazio(props: EstadoVazioProps) {
  if (props.tipo === "filtro") {
    return (
      <p className="rounded-2xl border border-dashed border-line-strong px-5 py-8 text-center text-[15px] text-t2">
        Nada por aqui com esse filtro.
      </p>
    );
  }
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong px-5 py-8 text-center">
      <svg aria-hidden="true" viewBox="0 0 200 16" className="mb-2 h-4 w-[200px]">
        <line x1={6} y1={8} x2={194} y2={8} strokeWidth={2} strokeLinecap="round" style={{ stroke: "var(--track)", strokeDasharray: "2 6" }} />
        <circle cx={6} cy={8} r={5} style={{ fill: "var(--ok)" }} />
      </svg>
      <h2 className="text-[17px] font-bold text-balance">Seu fio começa no primeiro lançamento</h2>
      <p className="text-[15px] text-t2">Mande uma foto, um áudio ou escreva.</p>
      <Link href={props.hrefAdicionar ?? "/adicionar"} className={`${BOTAO.secundario} mt-2`}>
        Adicionar lançamento
      </Link>
    </section>
  );
}
