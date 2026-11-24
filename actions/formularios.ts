import type { ZodError } from "zod";

/** Campo de texto do formulário. Arquivo ou ausente vira "": o Zod decide se é válido. */
const texto = (fd: FormData, nome: string): string => {
  const v = fd.get(nome);
  return typeof v === "string" ? v : "";
};

/** Caixa de seleção: só o valor exato "on" (padrão do navegador) marca. Ausente = desmarcada. */
const caixa = (fd: FormData, nome: string): boolean => fd.get(nome) === "on";

/** Lê SÓ os campos conhecidos: o cliente não consegue injetar campo extra no contrato. */
export const lerLogin = (fd: FormData) => ({ email: texto(fd, "email"), senha: texto(fd, "senha") });

export const lerConsentimento = (fd: FormData) => ({
  aceiteTermos: caixa(fd, "aceiteTermos"),
  aceiteEnvioIa: caixa(fd, "aceiteEnvioIa"),
});

export const lerCadastro = (fd: FormData) => ({ ...lerLogin(fd), ...lerConsentimento(fd) });

/** Primeira mensagem do contrato por campo. Nunca ecoa o valor digitado. Erro na raiz vai em `_`. */
export function camposDoErro(erro: ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const issue of erro.issues) {
    const chave = issue.path.join(".") || "_";
    campos[chave] ??= issue.message;
  }
  return campos;
}
