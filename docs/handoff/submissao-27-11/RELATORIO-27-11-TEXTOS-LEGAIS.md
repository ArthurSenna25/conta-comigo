# Conta Comigo · revisão dos textos legais · 27/11/2026

## Escopo

Revisão de conteúdo das páginas públicas `/legal/termos` e `/legal/privacidade`, a partir da `main` em `25e2de9`. A atualização descreve o que o produto entrega na versão testada: registro manual e IA por texto restrita à demo, com Gemini Free e uso de dados fictícios.

## Decisões

- Termos e Privacidade avisam que a demo é compartilhada e que o plano gratuito do Gemini é usado para IA. A política explica o que é enviado para a extração e para o chat. Os valores do painel são usados pelo servidor do app para montar a resposta.
- A política distingue o registro manual, a autorização opcional de IA e a consulta dos direitos do titular. Ela informa que o app ainda não tem controles específicos para exportar dados, excluir conta ou revogar o consentimento.
- O time ainda não definiu responsável, e-mail oficial e prazo de atendimento. A redação mantém esses itens como **PENDENTE**, junto com retenção, países e garantias de transferência internacional. A marca de revisão e a indicação de vigência pendente permanecem.
- O cadastro já exibe caixas separadas para os Termos e o envio de dados à IA. Quando o texto for aprovado, a equipe precisa alinhar a entrada em vigência, a versão do consentimento cobrada no cadastro e o fluxo de atendimento.
- A landing ainda precisa alinhar a promessa de atendimento de exclusão com a existência de um canal oficial. O QA observou que durante a rolagem o CTA fixo chega a encobrir os links legais em WebKit. A correção da sobreposição entra no escopo de UX.

## Fontes oficiais consultadas

- [LGPD, Lei nº 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD, Direito dos Titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares)
- [ANPD, Resolução CD/ANPD nº 19/2024](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024)
- [Condições aplicáveis aos serviços gratuitos do Gemini](https://aistudio.google.com/docs/terms#data-use-unpaid)

## Validação e continuidade

- O [PR #54](https://github.com/ArthurSenna25/conta-comigo/pull/54) está aberto para revisão com um commit (`94861fb`) e duas páginas alteradas. A aprovação jurídica e a definição de vigência ainda estão pendentes.
- O GitHub exibiu cinco verificações aprovadas e uma revisão pendente. [Checks do PR](https://github.com/ArthurSenna25/conta-comigo/pull/54/checks)
- `pnpm check` passou com 878 testes em 67 arquivos. O build também passou com mocks desligados e configuração fictícia local.
- A nova redação foi validada em WebKit a 390 px. As duas páginas responderam HTTP 200 sem sessão, os links entre elas funcionaram e o aviso de revisão ficou visível. [Termos a 390 px](evidencias/legal-termos-390.png) · [Privacidade a 390 px](evidencias/legal-privacidade-390.png)
- As páginas legais da versão em produção também responderam HTTP 200. O [relatório de QA](RELATORIO-QA-27-11.md) contém os passos e as evidências da versão publicada.
