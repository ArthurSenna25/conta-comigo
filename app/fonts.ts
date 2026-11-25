import { Figtree, Manrope } from "next/font/google";

// next/font baixa no build e serve do próprio domínio: nenhuma requisição ao Google em produção.
export const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});
