import { FioCurto } from "@/components/landing/simbolos";

const PAPEIS = [
  {
    quem: "A IA",
    cor: "var(--acc-ink)",
    oQue: "Lê a foto, o áudio ou o print e sugere valor, data, tipo e categoria. Se ficar em dúvida, avisa.",
  },
  {
    quem: "O código",
    cor: "var(--ok)",
    oQue: "Calcula limite anual, DAS e alertas com regras fixas e testadas. A IA não faz conta.",
  },
  { quem: "Você", cor: "var(--t1)", oQue: "Confere, corrige se precisar e confirma. Sem sua confirmação, nada é salvo." },
];

const CAMPOS = [
  { rotulo: "Valor", valor: "R$ 350,00", largo: true, classe: "h-[60px] num text-2xl font-extrabold" },
  { rotulo: "Data · confira", valor: "2?/11/2026", aviso: true, classe: "h-[52px] num text-base font-semibold" },
  { rotulo: "Tipo", valor: "Entrada", classe: "h-[52px] text-base font-semibold" },
  { rotulo: "Categoria", valor: "Serviço prestado", largo: true, classe: "h-[52px] text-base font-medium" },
];

export function IaSoRascunha() {
  return (
    <section id="ia" aria-labelledby="titulo-ia" data-fio="0.3" className="lp-secao pt-[clamp(96px,12vw,160px)]">
      <div className="lp-contido lp-2col">
        <div className="flex flex-col gap-[22px]">
          <p data-movimento="reveal" className="lp-kicker m-0">
            A IA só rascunha
          </p>
          <h2 id="titulo-ia" data-movimento="linhas skew" className="lp-h2">
            A IA sugere. O código calcula. Você decide.
          </h2>
          <dl className="mt-1.5 flex flex-col">
            {PAPEIS.map((p) => (
              <div
                key={p.quem}
                data-movimento="reveal"
                className="grid grid-cols-[110px_1fr] gap-[18px] border-t border-line py-[18px]"
              >
                <dt className="num text-lg font-extrabold" style={{ color: p.cor }}>
                  {p.quem}
                </dt>
                <dd className="lp-corpo m-0 text-[17px]">{p.oQue}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div data-movimento="reveal ia-cartao" className="flex justify-center [perspective:1200px]">
          <CartaoRascunho />
        </div>
      </div>
    </section>
  );
}

/** Ilustração estática (campos já preenchidos). A varredura e o preenchimento a cada 560ms vêm na etapa de movimento. */
function CartaoRascunho() {
  return (
    <figure data-movimento="tilt" className="lp-vidro m-0 flex w-[min(440px,100%)] flex-col gap-3.5 rounded-4xl p-[22px]">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex flex-col gap-[3px]">
          <span className="num text-xl font-extrabold">Rascunho</span>
          <span data-movimento="ia-status" className="text-sm text-ok">
            Pronto para você conferir
          </span>
        </div>
        <span className="rounded-xs border border-dashed border-line-strong px-2 py-0.5 text-sm font-semibold text-t3">
          exemplo
        </span>
      </div>
      <div
        aria-hidden="true"
        data-movimento="ia-varredura"
        className="flex h-[76px] items-center justify-center rounded-lg font-mono text-sm text-t2 [background:repeating-linear-gradient(135deg,var(--s2)_0_8px,var(--s3)_8px_16px)]"
      >
        recibo.jpg
      </div>
      <dl className="m-0 grid grid-cols-2 gap-3">
        {CAMPOS.map((c) => (
          <div key={c.rotulo} data-movimento="ia-campo" className={`flex flex-col gap-1.5 ${c.largo ? "col-span-2" : ""}`}>
            <dt className={`text-sm font-semibold ${c.aviso ? "text-warn" : "text-t2"}`}>{c.rotulo}</dt>
            <dd
              className={`m-0 flex items-center rounded-lg border px-3.5 ${c.classe} ${c.aviso ? "border-warn [background:color-mix(in_oklch,var(--warn)_10%,var(--s2))]" : "border-line-strong bg-s2"}`}
            >
              {c.valor}
            </dd>
          </div>
        ))}
      </dl>
      <p className="m-0 flex items-center gap-2.5 rounded-md bg-s2 px-3.5 py-3 text-sm leading-snug text-t2">
        <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full bg-t3" />
        Nada foi salvo. Só entra no fio quando você confirmar.
      </p>
      <figcaption className="text-right text-sm text-t3">Ilustração do app</figcaption>
    </figure>
  );
}

// Fonte: LC 123/2006, art. 18-A, § 7º, III (alíneas a e b) e § 10, consultado em 24/11/2026 em planalto.gov.br.
// Excesso de até 20% do limite (R$ 81.000,00 → até R$ 97.200,00): desenquadra a partir de 1º de janeiro do ano
// seguinte; a diferença é paga sem multa e juros, em parcela única, junto com o DAS de janeiro.
// Acima de 20%: efeito retroativo a 1º de janeiro do ano do excesso.
const FONTE_DESENQUADRAMENTO = {
  rotulo: "LC 123/2006, art. 18-A, § 7º",
  url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm",
  consultadoEm: "2026-11-24",
};

export function ChatComFonte() {
  return (
    <section aria-labelledby="titulo-chat" data-fio="0.3" className="lp-secao">
      <div className="lp-contido lp-2col">
        <div className="flex flex-col gap-[22px] md:order-2">
          <p data-movimento="reveal" className="lp-kicker m-0">
            Chat com fonte
          </p>
          <h2 id="titulo-chat" data-movimento="linhas skew" className="lp-h2">
            Pergunte. A resposta vem com a lei.
          </h2>
          <p data-movimento="reveal" className="lp-corpo max-w-[480px]">
            Respostas curtas, sem juridiquês. Cada uma mostra de onde saiu, num chip que você toca para conferir.
          </p>
        </div>
        <figure data-movimento="reveal" className="m-0 flex flex-col gap-3.5 md:order-1">
          <p className="m-0 max-w-[80%] self-end rounded-[22px_22px_6px_22px] border border-[var(--acc-a35)] bg-[var(--acc-a16)] px-[18px] py-3.5">
            E se eu passar do limite?
          </p>
          <div className="lp-vidro flex max-w-[92%] flex-col gap-3 self-start rounded-[22px_22px_22px_6px] p-[18px]">
            <p className="m-0 flex items-start gap-3 leading-[1.55] text-pretty">
              <FioCurto largura={34} ponta={30} cor="var(--err)" className="mt-2" />
              Se passar até 20% (até R$ 97.200,00), você segue MEI até dezembro, paga imposto sobre o excesso e vira
              microempresa em janeiro.
            </p>
            <details className="lp-chip">
              <summary className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong bg-s2 px-3.5 text-[15px] font-semibold transition-transform duration-150 hover:bg-s3 active:scale-97">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-acc" />
                {FONTE_DESENQUADRAMENTO.rotulo}
                <span aria-hidden="true" className="text-t3">
                  <span className="lp-chip-mais">↗</span>
                  <span className="lp-chip-menos">−</span>
                </span>
              </summary>
              <p className="m-0 mt-3 rounded-lg border border-line bg-s2 p-3.5 text-[15px] leading-normal text-t2">
                Trata do desenquadramento do MEI. O texto oficial é o que vale.{" "}
                <a href={FONTE_DESENQUADRAMENTO.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1">
                  Abrir no Planalto <span aria-hidden="true">↗</span>
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
                <span className="num block text-sm text-t3">
                  Consultado em {FONTE_DESENQUADRAMENTO.consultadoEm.split("-").reverse().join("/")}
                </span>
              </p>
            </details>
            <p className="m-0 border-t border-line pt-2.5 text-sm text-t3">Informativo. Não substitui um contador.</p>
          </div>
          <figcaption className="sr-only">Exemplo de conversa no chat do app</figcaption>
        </figure>
      </div>
    </section>
  );
}
