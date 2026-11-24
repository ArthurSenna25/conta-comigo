import type { Metadata } from "next";
import Link from "next/link";
import { FormCadastro } from "@/components/auth/form-cadastro";

export const metadata: Metadata = { title: "Criar conta · Conta Comigo" };

export default function PaginaCadastrar() {
  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">Seu controle financeiro de MEI, sem planilha.</p>
      </header>
      <FormCadastro />
      <p className="text-sm">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </>
  );
}
