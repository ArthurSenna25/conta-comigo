import type { Metadata } from "next";
import { DocumentoLegal } from "@/app/legal/documento-legal";

export const metadata: Metadata = {
  title: "Política de Privacidade · Conta Comigo",
  description: "Saiba quais dados o Conta Comigo usa, para que servem e o que acontece se você autorizar o uso da IA.",
  robots: { index: false, follow: true },
};

const lgpd = "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm";
const regulamentoAnpd =
  "https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024";
const direitosAnpd = "https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares";
const termosGemini = "https://aistudio.google.com/docs/terms#data-use-unpaid";

export default function PaginaPrivacidade() {
  return (
    <DocumentoLegal
      titulo="Política de Privacidade"
      resumo="Quais dados o Conta Comigo usa para prestar o serviço e o que muda se você autorizar o envio de conteúdo à IA."
      outroDocumento={{ href: "/legal/termos", rotulo: "Termos de Uso" }}
    >
      <section>
        <h2>Dados usados para prestar o serviço</h2>
        <p>
          O app usa o e-mail e a sessão para autenticar você, o perfil para configurar seu negócio
          e os lançamentos confirmados para acompanhar receitas, despesas, limite do MEI e DAS.
        </p>
        <p>
          O uso dos dados financeiros necessário para oferecer essas funções tem como base a execução
          do contrato, conforme o art. 7º, V, da LGPD. O app também registra a versão, a finalidade e
          a data dos aceites e mede o uso da IA para controlar limites.
        </p>
      </section>

      <section>
        <h2>Onde os dados ficam e por quanto tempo</h2>
        <p>
          O app usa a Vercel para hospedagem e o Supabase para autenticação e armazenamento de dados
          da conta. Rascunhos ficam temporariamente na página. Só os lançamentos confirmados entram
          no banco de dados. O histórico do chat fica na página durante a conversa.
        </p>
        <p>
          <strong className="text-warn">PENDENTE.</strong> O período máximo de retenção dos
          comprovantes e dos registros de aceite ainda precisa ser confirmado.
        </p>
      </section>

      <section>
        <h2>Envio opcional à IA</h2>
        <p>
          O uso da IA é opcional. O app registra a autorização para a IA separadamente dos Termos
          de Uso e da leitura desta política. Você pode registrar lançamentos manualmente sem
          autorizar o envio. Quando o tratamento depende de consentimento, a LGPD permite
          revogá-lo a qualquer momento por um meio gratuito e facilitado (art. 8º, § 5º).
        </p>
        <p>
          Nesta versão, a integração com a API Gemini, do Google, funciona apenas na conta de
          demonstração. Para montar um rascunho, o app envia o texto que você escolheu enviar.
          No chat, o Gemini recebe uma versão reduzida das perguntas e trechos de fontes públicas.
          O app usa os valores do painel no próprio servidor para montar a resposta.
        </p>
        <p>
          O tratamento pelo Gemini pode ocorrer fora do Brasil. Pelos termos do plano gratuito,
          o Google pode usar entradas e respostas para desenvolver e melhorar seus produtos e
          permitir que revisores humanos analisem esse conteúdo. Use somente dados fictícios na
          demonstração.
        </p>
        <p>
          <strong className="text-warn">PENDENTE.</strong> Os países de destino e as garantias de
          transferência internacional precisam ser confirmados antes de habilitar o envio de dados
          reais à IA.
        </p>
      </section>

      <section>
        <h2>Seus direitos e canal de contato</h2>
        <p>
          Você pode confirmar se seus dados pessoais são tratados, pedir acesso e correção, saber
          com quem foram compartilhados, solicitar a eliminação quando cabível e revogar seu
          consentimento. Veja a <a href={direitosAnpd} className="underline">orientação da ANPD sobre
          os direitos previstos na LGPD</a>.
        </p>
        <p>
          Nesta versão, não há funções no app para exportar dados, excluir a conta ou revogar o
          consentimento.
        </p>
        <p>
          <strong className="text-warn">PENDENTE.</strong> A equipe ainda não definiu quem responde
          pelo tratamento, o canal oficial para receber solicitações nem o prazo de atendimento.
        </p>
      </section>

      <section>
        <h2>Fontes</h2>
        <p className="text-t3">Consultadas em <time dateTime="2026-11-27">27/11/2026</time>.</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li><a href={lgpd} className="underline">Lei nº 13.709/2018 (LGPD), arts. 7º, 8º, 9º, 18 e 33</a></li>
          <li><a href={regulamentoAnpd} className="underline">Resolução CD/ANPD nº 19/2024</a></li>
          <li><a href={termosGemini} className="underline">Termos da API Gemini para serviços gratuitos</a></li>
        </ul>
      </section>
    </DocumentoLegal>
  );
}
