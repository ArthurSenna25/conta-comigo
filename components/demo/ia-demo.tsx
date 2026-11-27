import Link from "next/link";
import { BotaoDemo } from "@/components/auth/botao-demo";
import { BOTAO } from "@/components/botao";
import { MENSAGEM_IA_SOMENTE_DEMO } from "@/lib/security/portao-api";

export const AVISO_IA_DEMO =
  "Demonstração: o que você escrever aqui é enviado à IA do Google (plano gratuito). Não escreva dados reais.";

/** Aviso fixo perto do campo de texto que vai à IA. Só na demo (mesmo `demo` da FaixaDemo). */
export function AvisoIaDemo({ demo, id }: { demo: boolean; id: string }) {
  if (!demo) return null;
  return (
    <p id={id} className="rounded-xl border border-amber-700 bg-amber-100 px-3 py-2 text-sm font-medium text-amber-950 text-pretty">
      {AVISO_IA_DEMO}
    </p>
  );
}

/** A recusa de conta real (403 com MENSAGEM_IA_SOMENTE_DEMO) é a única que pede para trocar de conta. */
export const ehRecusaSomenteDemo = (falha: { status?: number; mensagem: string }) =>
  falha.status === 403 && falha.mensagem === MENSAGEM_IA_SOMENTE_DEMO;

/**
 * Saídas da recusa "IA só na demo". O botão entra na demo pela action (`entrarComoDemo`), porque o proxy
 * manda quem já tem sessão de /entrar para /painel: um link para /entrar não trocaria de conta.
 */
export function SaidasIaSomenteDemo({ hrefManual }: { hrefManual?: string }) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <BotaoDemo rotulo="Entrar na demonstração" className={`${BOTAO.secundario} aria-disabled:opacity-60`} />
      {hrefManual && (
        <Link href={hrefManual} className={BOTAO.fantasma}>
          Preencher na mão
        </Link>
      )}
    </div>
  );
}
