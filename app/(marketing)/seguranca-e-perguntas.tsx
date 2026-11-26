import { FioCurto } from "@/components/landing/simbolos";

const CARTOES = [
  {
    titulo: "Seus dados, seus direitos",
    texto: "Pedidos de exclusão de dados são tratados conforme a LGPD.",
    ponta: 20,
  },
  {
    titulo: "Nada é salvo sem você",
    texto: "Cada lançamento passa pelos seus olhos antes de entrar. O texto que você escreve vai à IA do Google (plano gratuito) para montar o rascunho; nenhum lançamento é salvo sem sua confirmação. Dá para descartar o rascunho antes de confirmar e conferir tudo em Lançamentos.",
    ponta: 40,
  },
  {
    titulo: "A IA é opcional",
    texto: "Ela só roda quando você escreve e envia. Nesta versão de avaliação, só funciona na conta demo. O app segue calculando tudo.",
    ponta: 60,
  },
];

export function Seguranca() {
  return (
    <section id="seguranca" aria-labelledby="titulo-seguranca" data-fio="0.3" className="lp-secao">
      <div className="lp-contido flex flex-col gap-[var(--lp-bloco)]">
        <div className="flex max-w-[780px] flex-col gap-[var(--lp-pilha)]">
          <p data-movimento="reveal" className="lp-kicker m-0">
            Segurança e privacidade
          </p>
          <h2 id="titulo-seguranca" data-movimento="linhas skew" className="lp-h2">
            Seu dinheiro, suas regras.
          </h2>
        </div>
        <ul className="grid gap-3 md:grid-cols-3 md:gap-4">
          {CARTOES.map((c) => (
            <li
              key={c.titulo}
              data-movimento="reveal tilt"
              className="lp-vidro flex flex-col justify-between gap-5 rounded-3xl p-5 md:min-h-[240px] md:gap-7 md:p-6 xl:p-7"
            >
              <FioCurto largura={64} ponta={c.ponta} />
              <div className="flex flex-col gap-2.5">
                <h3 className="num m-0 text-xl leading-[1.15] font-extrabold tracking-[-0.02em] xl:text-2xl">{c.titulo}</h3>
                <p className="lp-corpo text-base">{c.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// Resposta 1: LC 123/2006, art. 18-A, § 7º, III (a e b) e § 10, consultado em 24/11/2026 (detalhe em ia-e-chat.tsx).
const PERGUNTAS = [
  [
    "O que acontece se eu passar do limite?",
    "O app avisa em âmbar a partir de 80% e em vermelho se passar. Até 20% acima do teto, você segue MEI até dezembro, paga imposto sobre o excesso e vira microempresa no ano seguinte. O chat mostra a regra com a fonte.",
  ],
  [
    "Preciso aceitar a IA?",
    "Não. A IA é opcional. Se recusar, você preenche os lançamentos na mão e o app calcula tudo do mesmo jeito.",
  ],
  [
    "A IA calcula meu imposto?",
    "Não. A IA só lê o que você manda e monta um rascunho. Limite e DAS são calculados pelo código do app, com regras fixas.",
  ],
  ["Algo é salvo sem eu ver?", "Nada. O texto que você escreve vai à IA do Google (plano gratuito) para montar o rascunho; nenhum lançamento é salvo sem sua confirmação. Antes disso você pode descartar o rascunho, e depois confere tudo em Lançamentos."],
  ["Posso apagar meus dados?", "O pedido de exclusão de dados é tratado conforme a LGPD. Ainda não há botão de exclusão no app."],
  [
    "Substitui meu contador?",
    "Não. O Conta Comigo organiza a papelada do dia a dia e explica as regras do MEI. Para decisões maiores, fale com um contador.",
  ],
] as const;

/** Acordeão com <details name> nativo: abre um por vez, funciona sem JS. */
export function Perguntas() {
  return (
    <section id="perguntas" aria-labelledby="titulo-perguntas" data-fio="0.25" className="lp-secao">
      <div className="mx-auto flex w-[min(900px,100%-2*var(--lp-margem))] flex-col gap-[var(--lp-bloco)]">
        <h2 id="titulo-perguntas" data-movimento="linhas skew" className="lp-h2">
          Perguntas frequentes
        </h2>
        <div data-movimento="reveal" className="lp-vidro divide-y divide-line rounded-3xl px-5 py-1 md:px-6">
          {PERGUNTAS.map(([pergunta, resposta], i) => (
            <details key={pergunta} name="faq" open={i === 0} className="lp-faq">
              <summary className="flex min-h-[60px] items-center justify-between gap-4 py-3.5 text-[clamp(17px,1.5vw,20px)] md:min-h-[72px] md:gap-5 md:py-4 leading-[1.35] font-bold">
                {pergunta}
                <span
                  aria-hidden="true"
                  className="lp-faq-icone grid size-9 shrink-0 place-items-center rounded-full border border-line-strong text-xl font-medium text-acc-ink"
                >
                  +
                </span>
              </summary>
              <p data-movimento="faq-resposta" className="lp-corpo pb-5 text-base md:pr-14 md:pb-[22px] md:text-[17px]">
                {resposta}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
