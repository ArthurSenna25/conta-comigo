export const RESPOSTA_SAUDACAO = "Olá! Posso ajudar com seu faturamento, o limite do MEI e o DAS. O que gostaria de saber?";

export function saudacaoSimples(texto: string): boolean {
  const normalizado = texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
  return /^(?:(?:ola|oi|bom dia|boa tarde|boa noite)(?:[\s,.!?]+tudo bem)?|tudo bem)[\s.!?]*$/.test(normalizado);
}
