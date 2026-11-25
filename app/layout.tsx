import type { Metadata } from "next";
import { figtree, manrope } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conta Comigo",
  description: "Assistente contábil e financeiro com IA para MEIs",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${figtree.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
