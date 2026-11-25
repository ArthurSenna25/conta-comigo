import { FioCurto } from "@/components/landing/simbolos";

const CARTOES = [
  {
    titulo: "Você apaga quando quiser",
    texto: "Um toque no Perfil e seus lançamentos somem. Sem formulário, sem esperar.",
    ponta: 20,
  },
  {
    titulo: "Nada é salvo sem você",
    texto: "Cada lançamento passa pelos seus olhos antes de entrar. E dá para desfazer.",
    ponta: 40,
  },
  {
    titulo: "A IA é opcional",
    texto: "Não quer IA? Recuse no cadastro ou desligue no Perfil. O app segue calculando tudo.",
    ponta: 60,
  },
];

export function Seguranca() {
  return (
    <section id="seguranca" aria-labelledby="titulo-seguranca" data-fio="0.3" className="lp-secao">
      <div className="lp-contido flex flex-col gap-10">
        <div className="flex max-w-[780px] flex-col gap-[18px]">
          <p data-movimento="reveal" className="lp-kicker m-0">
            Segurança e privacidade
          </p>
          <h2 id="titulo-seguranca" data-movimento="linhas skew" className="lp-h2">
            Seu dinheiro, suas regras.
          </h2>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
          {CARTOES.map((c) => (
            <li
              key={c.titulo}
              data-movimento="reveal tilt"
              className="lp-vidro flex min-h-[240px] flex-col justify-between gap-7 rounded-3xl p-7"
            >
              <FioCurto largura={64} ponta={c.ponta} />
              <div className="flex flex-col gap-2.5">
                <h3 className="num m-0 text-2xl leading-[1.15] font-extrabold tracking-[-0.02em]">{c.titulo}</h3>
                <p className="lp-corpo text-base">{c.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// PENDENTE (07 #3): a resposta 1 cita a regra dos 20% sem fonte conferida.
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
  ["Algo é salvo sem eu ver?", "Nada. Cada lançamento só entra depois que você confirma. E dá para desfazer logo depois."],
  ["Posso apagar meus dados?", "Sim, quando quiser, pelo Perfil. Apagou, sumiu."],
  [
    "Substitui meu contador?",
    "Não. O Conta Comigo organiza a papelada do dia a dia e explica as regras do MEI. Para decisões maiores, fale com um contador.",
  ],
] as const;

/** Acordeão com <details name> nativo: abre um por vez, funciona sem JS. */
export function Perguntas() {
  return (
    <section id="perguntas" aria-labelledby="titulo-perguntas" data-fio="0.25" className="lp-secao">
      <div className="mx-auto flex w-[min(900px,100%-40px)] flex-col gap-8">
        <h2 id="titulo-perguntas" data-movimento="linhas skew" className="lp-h2">
          Perguntas frequentes
        </h2>
        <div data-movimento="reveal" className="lp-vidro divide-y divide-line rounded-3xl px-6 py-1">
          {PERGUNTAS.map(([pergunta, resposta], i) => (
            <details key={pergunta} name="faq" open={i === 0} className="lp-faq">
              <summary className="flex min-h-[72px] items-center justify-between gap-5 py-4 text-[clamp(17px,1.5vw,20px)] leading-[1.35] font-bold">
                {pergunta}
                <span
                  aria-hidden="true"
                  className="lp-faq-icone grid size-9 shrink-0 place-items-center rounded-full border border-line-strong text-xl font-medium text-acc-ink"
                >
                  +
                </span>
              </summary>
              <p data-movimento="faq-resposta" className="lp-corpo pr-14 pb-[22px] text-[17px]">
                {resposta}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
