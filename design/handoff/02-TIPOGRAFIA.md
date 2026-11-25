# 02 · Tipografia

- **Figtree** = toda a interface (texto, rótulos, botões). Pesos **400, 500, 600, 700**.
- **Manrope** = números, valores em R$, títulos de tela e títulos da landing. Pesos **500, 600, 700, 800**. Números sempre com `font-variant-numeric: tabular-nums` (classe `.num`).
- Tamanho mínimo de texto: **14px**. Nada abaixo disso.
- O protótipo usa `Figtree 800` em alguns ícones de ✓. Figtree 800 não é carregado: use **700**.

## Carregar com next/font (sem CDN)
`next/font/google` baixa as fontes no build e serve do seu domínio. Nenhuma requisição ao Google em produção.

```tsx
// app/fonts.ts
import { Figtree, Manrope } from "next/font/google";

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
```

```tsx
// app/layout.tsx
import { figtree, manrope } from "./fonts";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${figtree.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```
Em `globals.css` (já incluso em 01): `--font-sans: var(--font-figtree)` e `--font-num: var(--font-manrope)`. Use `font-sans` e `font-num` no Tailwind.

## Escala do app (390px)
| Papel | Família | Tamanho / altura de linha | Peso | Tracking |
|---|---|---|---|---|
| Número-herói (Fio do painel) | Manrope | 52 / 1 (DS: 48–64) | 800 | -0.035em |
| Cronômetro gravando | Manrope | 64 / 1 | 800 | -0.03em |
| Valor em campo de onboarding | Manrope | 36 | 800 | -0.02em |
| Título de tela | Manrope | 30 / 1.1 | 800 | -0.02em |
| Título de aba (Lançamentos, Pergunte) | Manrope | 28 | 800 | -0.02em |
| Valor em campo do rascunho | Manrope | 28 | 800 | -0.02em |
| Título de seção do painel ("Seu ano até aqui") | Manrope | 24 / 1.1 | 800 | -0.015em |
| Valor do DAS | Manrope | 26 | 800 | -0.02em |
| Título de sheet / perfil / conferir | Manrope | 22 / 1.2 | 800 | -0.01em |
| Título do tour | Manrope | 20 / 1.25 | 800 | 0 |
| Valor em lista / "Faltam R$…" | Manrope | 16–18 | 700 | 0 |
| Botão CTA | Figtree | 17 | 700 | 0 |
| Botão secundário / fantasma | Figtree | 15–16 | 600 | 0 |
| Título de cartão / item | Figtree | 16–17 | 600–700 | 0 |
| Corpo | Figtree | 16 / 1.5 | 400 | 0 |
| Corpo pequeno | Figtree | 15 / 1.45 | 400 | 0 |
| Apoio / rótulo de campo | Figtree | 14 / 1.4 | 500–600 | 0 |
| Sobretítulo (kicker) | Figtree | 14 | 600 | 0.06em, MAIÚSCULAS |
| Tab bar | Figtree | 14 | 700 | 0 |

## Escala da landing (fluida)
| Papel | Família | Tamanho / altura de linha | Peso | Tracking |
|---|---|---|---|---|
| H1 do herói | Manrope | `clamp(52px, 9.2vw, 150px)` / 0.92, `max-width: 12ch` | 800 | -0.055em |
| H2 do CTA final | Manrope | `clamp(42px, 6.6vw, 104px)` / 0.95 | 800 | -0.05em |
| H2 de seção | Manrope | `clamp(36px, 4.8vw, 68px)` / 1.02 | 800 | -0.04em |
| Título dos passos (Siga o Fio) | Manrope | `clamp(30px, 3.8vw, 58px)` / 1.02 | 800 | -0.04em |
| H2 "O limite" | Manrope | `clamp(28px, 3.8vw, 56px)` / 1.04 | 800 | -0.04em |
| Odômetro | Manrope | `clamp(44px, 8vw, 124px)` / 1; "R$" a 0.42em | 800 | -0.04em |
| Mensagem do limite | Manrope | `clamp(18px, 1.8vw, 24px)` | 700 | 0 |
| Título de cartão de segurança | Manrope | 24 / 1.15 | 800 | -0.02em |
| Pergunta do FAQ | Figtree | `clamp(17px, 1.5vw, 20px)` / 1.35 | 700 | 0 |
| Subtítulo do herói | Figtree | `clamp(17px, 1.4vw, 20px)` / 1.55, `max-width: 560px` | 400 | 0 |
| Corpo da landing | Figtree | 18 / 1.55 (cartões: 16–17) | 400 | 0 |
| Kicker de seção | Figtree | 14 | 600 | 0.08em, MAIÚSCULAS, cor `--acc-ink` |
| Botões grandes | Figtree | 18, altura 58px | 700 (primário) / 600 | 0 |
| Nav | Figtree | 15 | 600 | 0 |
| Logo (texto) | Manrope | 18 (nav), 30 (abertura) | 800 | -0.01em / -0.02em |

Regras de quebra: títulos com `text-wrap: balance`; parágrafos com `text-wrap: pretty`.
