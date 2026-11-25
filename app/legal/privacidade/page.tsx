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
          O app usa o e-mail e a sessão para autenticar você, os dados do perfil para configurar
          seu negócio e os lançamentos para mostrar receitas, despesas e o acompanhamento do MEI.
          Se você confirmar um lançamento com imagem, ela pode ser guardada como comprovante.
        </p>
        <p>
          O uso dos dados financeiros necessário para oferecer essas funções tem como base a execução
          do contrato, conforme o art. 7º, V, da LGPD. O app também registra a versão, a finalidade e
          a data dos aceites e mede o uso da IA para controlar limites.
        </p>
      </section>

      <section>
        <h2>Onde os dados são tratados</h2>
        <p>
          O app usa a Vercel para hospedagem e o Supabase para autenticação, dados e armazenamento
          de comprovantes. As imagens confirmadas ficam em armazenamento privado. O app processa o
          áudio em memória durante a extração.
        </p>
        <p>
          <strong className="text-warn">PENDENTE.</strong> Falta confirmar os prazos de retenção de
          comprovantes e registros de aceite.
        </p>
      </section>

      <section>
        <h2>Envio opcional à IA</h2>
        <p>
          O envio de foto, áudio ou texto ao provedor de IA para sugerir lançamentos depende de
          uma autorização específica e opcional. Aceitar os Termos de Uso não autoriza esse envio.
          Essa autorização pode ser revogada, nos termos do art. 8º, § 5º, da LGPD.
        </p>
        <p>
          A integração de demonstração usa a API Gemini, do Google. Segundo os termos do Google,
          no serviço gratuito, entradas e respostas podem ser usadas para melhorar produtos e
          passar por revisão humana. Use somente dados fictícios na demonstração.
        </p>
        <p>
          <strong className="text-warn">PENDENTE.</strong> Falta confirmar os países de tratamento e
          as garantias de transferência internacional antes de habilitar o envio de dados reais.
        </p>
      </section>

      <section>
        <h2>Seus direitos e canal de contato</h2>
        <p>
          A LGPD prevê, entre outros direitos, confirmar se seus dados são tratados, pedir acesso e
          correção, saber com quem foram compartilhados e solicitar a eliminação quando aplicável.
        </p>
        <p>
          <strong className="text-warn">PENDENTE.</strong> Falta identificar o responsável pelo
          tratamento e publicar o canal para pedidos de acesso, correção, eliminação e
          revogação do consentimento.
        </p>
      </section>

      <section>
        <h2>Fontes</h2>
        <p className="text-t3">Consultadas em <time dateTime="2026-11-25">25/11/2026</time>.</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li><a href={lgpd} className="underline">Lei nº 13.709/2018 (LGPD), arts. 7º, 8º, 9º, 18 e 33</a></li>
          <li><a href={regulamentoAnpd} className="underline">Resolução CD/ANPD nº 19/2024</a></li>
          <li><a href={termosGemini} className="underline">Termos da API Gemini para serviços gratuitos</a></li>
        </ul>
      </section>
    </DocumentoLegal>
  );
}
