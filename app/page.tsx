import Link from "next/link";
import { BotaoDemo } from "@/components/auth/botao-demo";

// TODO(Frigeri): landing real. Por ora só o título e as entradas (demo, entrar, criar conta).
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <h1 className="text-2xl font-semibold">Conta Comigo</h1>
      <BotaoDemo />
      <p className="text-sm">
        <Link href="/entrar" className="font-medium underline underline-offset-2">
          Entrar
        </Link>{" "}
        ou{" "}
        <Link href="/cadastrar" className="font-medium underline underline-offset-2">
          criar conta
        </Link>
      </p>
    </main>
  );
}
