import { z } from "zod";

/**
 * Versão do texto de Termos, Privacidade e envio à IA que o usuário aceita.
 * Mudou o texto em app/legal = mudar aqui: quem aceitou outra versão precisa aceitar de novo.
 */
export const VERSAO_CONSENTIMENTO = "2026-11-26";

/** Mesmos valores do CHECK de `consentimentos.finalidade` (docs/DADOS.md). */
export const FinalidadeConsentimento = z.enum(["termos_uso", "privacidade", "envio_ia"]);

/** `.max(320)` antes do pipe barra payload gigante antes de trim/lowercase/regex. */
const Email = z.string().max(320).trim().toLowerCase().pipe(z.email("e-mail inválido").max(254));

/**
 * bcrypt (usado pelo Supabase Auth) limita a senha a 72 BYTES, não caracteres: "ç" são 2 bytes e
 * emoji 4. Acima disso o Auth trunca em silêncio ou recusa sem explicar. O `.max(200)` só limita
 * o custo de codificar um texto absurdo.
 */
const MSG_BYTES = "use no máximo 72 bytes (acentos e emojis contam mais que 1)";
const cabeEm72Bytes = (s: string) => new TextEncoder().encode(s).length <= 72;

const SenhaNova = z
  .string()
  .min(8, "use ao menos 8 caracteres")
  .max(200, MSG_BYTES)
  .refine(cabeEm72Bytes, MSG_BYTES);

/** Caixas do formulário (a action converte "on" em boolean). Termos e privacidade: obrigatórios e independentes. IA: opcional. */
export const ConsentimentoInput = z.object({
  aceiteTermosUso: z.literal(true, "aceite os Termos de Uso"),
  aceitePrivacidade: z.literal(true, "aceite a Política de Privacidade"),
  aceiteEnvioIa: z.boolean(),
});

export const CadastroInput = ConsentimentoInput.extend({
  email: Email,
  senha: SenhaNova,
});

/** Login não revalida força da senha, só o limite: senha de mais de 72 bytes nunca existiu no cadastro. */
export const LoginInput = z.object({
  email: Email,
  senha: z.string().min(1, "informe a senha").max(200, MSG_BYTES).refine(cabeEm72Bytes, MSG_BYTES),
});

export type FinalidadeConsentimento = z.infer<typeof FinalidadeConsentimento>;
export type ConsentimentoInput = z.infer<typeof ConsentimentoInput>;
export type CadastroInput = z.infer<typeof CadastroInput>;
export type LoginInput = z.infer<typeof LoginInput>;
