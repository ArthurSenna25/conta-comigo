import Link from "next/link";
import { VERSAO_CONSENTIMENTO } from "@/lib/contracts/auth"; // arquivo direto: o barrel levaria todos os schemas ao bundle

/**
 * Caixas de consentimento (LGPD.md): NÃO pré-marcadas. Termos de Uso e Política de Privacidade são
 * aceites obrigatórios e independentes (cada um grava só a sua finalidade); o envio à IA é opcional e
 * específico: sem ele só o lançamento manual funciona.
 * A versão do texto aceito é VERSAO_CONSENTIMENTO e é gravada junto com o aceite.
 */
const CLASSE_LINK = "underline underline-offset-2";

function CaixaObrigatoria({ nome, erro, children }: { nome: string; erro?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={nome} className="flex min-h-12 items-start gap-3 text-sm leading-snug">
        <input
          id={nome}
          name={nome}
          type="checkbox"
          required
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${nome}-erro` : undefined}
          className="mt-0.5 size-6 shrink-0 accent-primary"
        />
        <span>{children}</span>
      </label>
      {erro && (
        <p id={`${nome}-erro`} className="text-sm text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}

export function CaixasConsentimento({ erros }: { erros?: Record<string, string> }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 text-sm font-medium">Privacidade e termos</legend>

      <CaixaObrigatoria nome="aceiteTermosUso" erro={erros?.aceiteTermosUso}>
        Li e aceito os{" "}
        <Link href="/legal/termos" prefetch={false} target="_blank" rel="noopener noreferrer" className={CLASSE_LINK}>
          Termos de Uso
        </Link>
        .
      </CaixaObrigatoria>

      <CaixaObrigatoria nome="aceitePrivacidade" erro={erros?.aceitePrivacidade}>
        Li a{" "}
        <Link href="/legal/privacidade" prefetch={false} target="_blank" rel="noopener noreferrer" className={CLASSE_LINK}>
          Política de Privacidade
        </Link>
        .
      </CaixaObrigatoria>

      <label htmlFor="aceiteEnvioIa" className="flex min-h-12 items-start gap-3 text-sm leading-snug">
        <input id="aceiteEnvioIa" name="aceiteEnvioIa" type="checkbox" className="mt-0.5 size-6 shrink-0 accent-primary" />
        <span>
          <strong className="font-medium">Opcional:</strong> autorizo enviar minhas fotos, áudios e textos à API Gemini,
          do Google, para ler os lançamentos. O tratamento pode ocorrer fora do Brasil. Sem isso, você lança tudo
          manualmente.
        </span>
      </label>

      <p className="text-xs text-muted-foreground">Versão do texto: {VERSAO_CONSENTIMENTO}</p>
    </fieldset>
  );
}
