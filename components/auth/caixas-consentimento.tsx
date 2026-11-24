import Link from "next/link";
import { VERSAO_CONSENTIMENTO } from "@/lib/contracts";

/**
 * Caixas de consentimento (LGPD.md): NÃO pré-marcadas. A primeira (termos + privacidade) é obrigatória;
 * a segunda (envio à IA) é opcional e específica: sem ela só o lançamento manual funciona.
 * A versão do texto aceito é VERSAO_CONSENTIMENTO e é gravada junto com o aceite.
 */
export function CaixasConsentimento({ erroTermos }: { erroTermos?: string }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 text-sm font-medium">Privacidade e termos</legend>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="aceiteTermos" className="flex min-h-12 items-start gap-3 text-sm leading-snug">
          <input
            id="aceiteTermos"
            name="aceiteTermos"
            type="checkbox"
            required
            aria-invalid={erroTermos ? true : undefined}
            aria-describedby={erroTermos ? "aceiteTermos-erro" : undefined}
            className="mt-0.5 size-6 shrink-0 accent-primary"
          />
          <span>
            Li e aceito os{" "}
            <Link href="/legal/termos" target="_blank" className="underline underline-offset-2">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/legal/privacidade" target="_blank" className="underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        {erroTermos && (
          <p id="aceiteTermos-erro" role="alert" className="text-sm text-destructive">
            {erroTermos}
          </p>
        )}
      </div>

      <label htmlFor="aceiteEnvioIa" className="flex min-h-12 items-start gap-3 text-sm leading-snug">
        <input id="aceiteEnvioIa" name="aceiteEnvioIa" type="checkbox" className="mt-0.5 size-6 shrink-0 accent-primary" />
        <span>
          <strong className="font-medium">Opcional:</strong> autorizo enviar minhas fotos, áudios e textos a um provedor
          de IA para ler os lançamentos. Sem isso, você lança tudo manualmente.
        </span>
      </label>

      <p className="text-xs text-muted-foreground">Versão do texto: {VERSAO_CONSENTIMENTO}</p>
    </fieldset>
  );
}
