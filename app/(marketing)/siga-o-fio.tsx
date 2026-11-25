import { Celular, type TelaCelular } from "@/components/landing/celular";

const PASSOS: { kicker: string; titulo: string; texto: string; tela: TelaCelular }[] = [
  {
    kicker: "1 · Você tira a foto",
    titulo: "Um toque em Foto. Pronto.",
    texto: "Recibo amassado, nota do Pix, print. Do jeito que estiver à mão.",
    tela: "adicionar",
  },
  {
    kicker: "2 · A IA lê",
    titulo: "Valor, data e tipo, em segundos.",
    texto: "A tela diz o que está acontecendo. Nada é salvo ainda.",
    tela: "lendo",
  },
  {
    kicker: "3 · Você confere",
    titulo: "O rascunho pronto. Você confirma.",
    texto: "O que ficou duvidoso aparece em âmbar, para você olhar.",
    tela: "conferir",
  },
  {
    kicker: "4 · O fio anda",
    titulo: "Confirmou, o Fio do Limite avança.",
    texto: "O número sobe na hora e mostra quanto ainda falta para o teto.",
    tela: "confirmado",
  },
];

/** Trilho 300px com 4 pontos; `alcancados` pinta os pontos e o preenchimento em --ok. */
function Trilho({ alcancados }: { alcancados: number }) {
  const xs = [12, 104, 196, 288];
  const fim = xs[Math.max(0, alcancados - 1)];
  return (
    <svg aria-hidden="true" viewBox="0 0 300 24" className="h-auto w-[min(300px,100%)] overflow-visible">
      <line x1={12} y1={12} x2={288} y2={12} strokeWidth={2} strokeLinecap="round" style={{ stroke: "var(--track)" }} />
      <line x1={12} y1={12} x2={fim} y2={12} strokeWidth={3} strokeLinecap="round" style={{ stroke: "var(--ok)" }} />
      {xs.map((x, i) => (
        <circle key={x} cx={x} cy={12} r={7} style={{ fill: i < alcancados ? "var(--ok)" : "oklch(0.40 0.03 255)" }} />
      ))}
    </svg>
  );
}

/**
 * Sem JS: os 4 passos ficam empilhados e visíveis. A etapa de movimento transforma a seção em
 * sticky (360/420vh) e troca os passos pelo scroll usando os ganchos data-movimento.
 */
export function SigaOFio() {
  return (
    <section id="como" aria-labelledby="titulo-como" data-fio="1" data-movimento="siga-o-fio" className="lp-secao">
      <div className="lp-contido flex flex-col gap-[clamp(48px,8vw,96px)]">
        <h2 id="titulo-como" className="lp-kicker m-0">
          Siga o fio · o app funcionando
        </h2>
        <ol className="flex flex-col gap-[clamp(56px,9vw,120px)]">
          {PASSOS.map((p, i) => (
            <li key={p.kicker} data-movimento="siga-passo" className="lp-2col">
              <div className="lp-sombra-texto flex flex-col gap-[18px]">
                <Trilho alcancados={i + 1} />
                <div data-movimento="siga-texto" className="flex flex-col gap-3.5">
                  <span className="text-base font-bold text-ok">{p.kicker}</span>
                  <h3 className="num m-0 text-[clamp(30px,3.8vw,58px)] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance">
                    {p.titulo}
                  </h3>
                  <p className="lp-corpo max-w-[460px]">{p.texto}</p>
                </div>
              </div>
              <div data-movimento="siga-celular" className="relative flex justify-center">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[170%] max-w-[700px] -translate-1/2 rounded-full [background:radial-gradient(closest-side,oklch(0.60_0.14_240/0.28),transparent)]"
                />
                <Celular tela={p.tela} className="celular-passo" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
