import type { Metadata } from "next";
import Link from "next/link";
import { BotaoDemo } from "@/components/auth/botao-demo";
import { FormEntrar } from "@/components/auth/form-entrar";

export const metadata: Metadata = { title: "Entrar · Conta Comigo" };

export default async function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  const { next } = await searchParams;
  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-sm text-muted-foreground">Bem-vindo de volta ao Conta Comigo.</p>
      </header>
      <section aria-label="Demonstração" className="flex flex-col gap-2 rounded-xl border border-line-strong bg-s2 p-4">
        <p className="text-sm text-t2">Durante a avaliação, a IA só funciona na conta demo.</p>
        <BotaoDemo />
      </section>
      {/* A action valida o destino (destinoSeguro): aqui ele só viaja no formulário. */}
      <FormEntrar next={typeof next === "string" ? next : ""} />
      <p className="text-sm">
        Ainda não tem conta?{" "}
        <Link href="/cadastrar" className="font-medium underline underline-offset-2">
          Criar conta
        </Link>
      </p>
    </>
  );
}
