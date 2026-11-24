import { z } from "zod";

/**
 * Versão do texto de Termos, Privacidade e envio à IA que o usuário aceita.
 * Mudou o texto em app/legal = mudar aqui: quem aceitou outra versão precisa aceitar de novo.
 */
export const VERSAO_CONSENTIMENTO = "2026-11-24";

/** Mesmos valores do CHECK de `consentimentos.finalidade` (docs/DADOS.md). */
export const FinalidadeConsentimento = z.enum(["termos_uso", "privacidade", "envio_ia"]);

const Email = z.string().trim().toLowerCase().pipe(z.email("e-mail inválido").max(254));

/** 72 = limite do bcrypt; acima disso o Supabase truncaria em silêncio. */
const SenhaNova = z
  .string()
  .min(8, "use ao menos 8 caracteres")
  .max(72, "use no máximo 72 caracteres");

/** Caixas do formulário (a action converte "on" em boolean). Termos: obrigatório. IA: opcional. */
export const ConsentimentoInput = z.object({
  aceiteTermos: z.literal(true, "aceite os Termos de Uso e a Política de Privacidade"),
  aceiteEnvioIa: z.boolean(),
});

export const CadastroInput = ConsentimentoInput.extend({
  email: Email,
  senha: SenhaNova,
});

/** Login não revalida força da senha: só o cadastro. */
export const LoginInput = z.object({
  email: Email,
  senha: z.string().min(1, "informe a senha").max(72),
});

export type FinalidadeConsentimento = z.infer<typeof FinalidadeConsentimento>;
export type ConsentimentoInput = z.infer<typeof ConsentimentoInput>;
export type CadastroInput = z.infer<typeof CadastroInput>;
export type LoginInput = z.infer<typeof LoginInput>;
