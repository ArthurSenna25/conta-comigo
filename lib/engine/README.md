# lib/engine
**Dono:** Murilo
**Regra:** Cálculo fiscal e financeiro (limite MEI, DAS). PURO e determinístico, com testes. A IA nunca calcula imposto.

## Alertas

- Forneça todos os lançamentos confirmados do ano de referência para calcular o limite do MEI. A receita inicial do perfil entra somente no ano civil do cadastro em São Paulo.
- O lembrete do DAS usa o vencimento ordinário do engine. O calendário considera fins de semana e feriados bancários nacionais de 2026. Em outros anos, considera apenas fins de semana. Feriados regionais e prorrogações excepcionais ficam fora dessa cobertura. O estado do engine não informa se a guia foi paga.
- O lembrete vale a partir da competência do mês de abertura do MEI. O vencimento ordinário ocorre no mês seguinte à competência. [INSS, consultado em 26/11/2026](https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/contribuicao-previdenciaria-e-salario-de-contribuicao).
- Despesa atípica e mistura PF/PJ estão fora desta implementação.
