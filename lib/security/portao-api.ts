// Parte pura do portão de app/api/*: Origin, consentimento de IA e resposta de erro. Sem next, sem supabase.
// Quem junta isso com sessão e banco é actions/portao-api.ts.
import { VERSAO_CONSENTIMENTO, type CodigoErro, type ErroResposta } from "@/lib/contracts";
import type { AceiteRegistrado } from "./acesso";

const STATUS: Record<CodigoErro, number> = {
  nao_autenticado: 401,
  proibido: 403,
  invalido: 400,
  nao_encontrado: 404,
  limite_ia: 429,
  ia_indisponivel: 503,
  interno: 500,
};

/** Mensagens genéricas: dizem o que fazer, nunca o que falhou por dentro. */
const MENSAGEM: Record<CodigoErro, string> = {
  nao_autenticado: "Entre na sua conta para continuar.",
  proibido: "Você não tem permissão para esta ação.",
  invalido: "Não foi possível processar o pedido. Confira os dados e tente de novo.",
  nao_encontrado: "Não encontramos o que você procura.",
  limite_ia: "O limite diário de uso da IA acabou. Você pode lançar manualmente.",
  ia_indisponivel: "A IA está indisponível agora. Você pode lançar manualmente.",
  interno: "Algo deu errado. Tente de novo em instantes.",
};

/** Resposta de erro de rota: JSON `ErroResposta`, status HTTP coerente, nunca redirect nem cache. */
export function respostaErro(codigo: CodigoErro): Response {
  const corpo: ErroResposta = { erro: { codigo, mensagem: MENSAGEM[codigo] } };
  return Response.json(corpo, { status: STATUS[codigo], headers: { "cache-control": "no-store" } });
}

// GET e HEAD nunca podem ter efeito colateral. OPTIONS fica de fora: se alguém exportar um handler, é escrita.
const METODOS_DE_LEITURA = new Set(["GET", "HEAD"]);

/**
 * Origem esperada da requisição: esquema da `req.url` + o cabeçalho `Host` que o cliente realmente usou
 * (o Next normaliza `req.url` para localhost, então o host da URL não serve). `x-forwarded-host/proto` NÃO
 * são lidos: valem só se o proxy sobrescrever o que o cliente mandou, e o `Host` dispensa essa premissa.
 * Se um dia o `Host` chegar interno, o Origin do navegador deixa de bater e a escrita falha FECHADA (403).
 * Regra única de todo `app/api/*` (AMEACAS #16): confirmar com um POST real no preview da Vercel.
 */
export function origemDaRequisicao(url: string, host: string | null): string {
  const u = new URL(url);
  return `${u.protocol}//${host?.trim() || u.host}`;
}

/**
 * Defesa de CSRF para rota de escrita: Origin tem de ser o da própria aplicação (`origemEsperada`, de
 * `origemDaRequisicao`). Leitura passa. Falha fechada: sem Origin, "null" ou URL ilegível, não escreve.
 * Compara origem inteira (esquema + host + porta), então subdomínio e http/https diferentes não passam.
 */
export function origemConfere(metodo: string, origin: string | null, origemEsperada: string): boolean {
  if (METODOS_DE_LEITURA.has(metodo.toUpperCase())) return true;
  if (!origin) return false;
  try {
    return new URL(origemEsperada).origin === origin;
  } catch {
    return false;
  }
}

/**
 * Consentimento de envio à IA vale só na versão atual e sem revogação (AMEACAS #16): um `envio_ia`
 * aceito num texto antigo não autoriza mandar dado ao provedor sob o texto novo.
 */
export function envioIaVigente(aceites: AceiteRegistrado[], versaoAtual = VERSAO_CONSENTIMENTO): boolean {
  return aceites.some((a) => a.finalidade === "envio_ia" && a.versao === versaoAtual && a.revogadoEm === null);
}
