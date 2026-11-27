import type { Metadata } from "next";
import { DocumentoLegal } from "@/app/legal/documento-legal";

export const metadata: Metadata = {
  title: "Termos de Uso · Conta Comigo",
  description: "Entenda como funciona o Conta Comigo, quais são os limites da ferramenta e como usar a demonstração.",
  robots: { index: false, follow: true },
};

export default function PaginaTermos() {
  return (
    <DocumentoLegal
      titulo="Termos de Uso"
      resumo="Condições de uso do Conta Comigo, uma ferramenta para organizar as receitas e despesas do seu MEI."
      outroDocumento={{ href: "/legal/privacidade", rotulo: "Política de Privacidade" }}
    >
      <section>
        <h2>O que o Conta Comigo faz</h2>
        <p>
          O app ajuda a registrar entradas e saídas e a acompanhar o limite anual do MEI e o DAS.
          A ferramenta é de apoio à organização financeira. Para orientação sobre o seu caso, consulte
          um contador. O app não emite notas ou guias nem entrega declarações.
        </p>
      </section>

      <section>
        <h2>Confira antes de salvar</h2>
        <p>
          Na conta de demonstração, o app usa a API Gemini do Google no plano gratuito para sugerir
          rascunhos com base no texto que você envia e para ajudar nas respostas do chat. A IA pode
          interpretar o conteúdo errado.
          Confira o valor, a data e a categoria antes de confirmar o lançamento. Os cálculos do
          app dependem dos dados que você registra.
        </p>
      </section>

      <section>
        <h2>Uso da demonstração</h2>
        <p>
          A conta de demonstração é compartilhada. Outros visitantes podem ver e alterar os
          lançamentos salvos nela. Use somente dados fictícios ao testar, inclusive na digitação
          manual e no chat. Não inclua dados pessoais, documentos ou informações confidenciais
          suas ou de terceiros.
        </p>
      </section>

      <section>
        <h2>Privacidade e uso opcional de IA</h2>
        <p>
          Estes Termos tratam do uso do serviço. A Política de Privacidade explica como os dados
          são tratados. A autorização para enviar conteúdo ao provedor de IA
          é opcional e específica. Ela não é exigida para registrar um lançamento manual.
        </p>
      </section>
    </DocumentoLegal>
  );
}
