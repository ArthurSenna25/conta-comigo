# 01 · Tokens (Azul-noite, escuro)

Fonte: DS (`PAL.azul.dark`), conferido com APP e LAND. O produto é **só tema escuro**. Não implemente modo claro agora.

## Cores
| Token | OKLCH | Uso |
|---|---|---|
| `--bg` | `oklch(0.16 0.025 255)` | Fundo da página (superfície 0) |
| `--s1` | `oklch(0.20 0.03 255)` | Superfície 1: cartões, sheet |
| `--s2` | `oklch(0.245 0.035 255)` | Superfície 2: campos, botão secundário |
| `--s3` | `oklch(0.30 0.04 255)` | Superfície 3: hover, toast, esqueleto, botão desabilitado |
| `--t1` | `oklch(0.97 0.008 255)` | Texto principal |
| `--t2` | `oklch(0.85 0.02 255)` | Texto secundário |
| `--t3` | `oklch(0.72 0.025 255)` | Texto de apoio, rótulos, placeholders |
| `--line` | `oklch(0.97 0.02 255 / 0.12)` | Borda de cartão, divisória |
| `--line-strong` | `oklch(0.97 0.02 255 / 0.22)` | Borda de campo e botão |
| `--acc` | `oklch(0.78 0.12 240)` | Acento: botão primário, seleção |
| `--acc-ink` | `oklch(0.80 0.11 240)` | Texto/ícone em acento (links, botão fantasma) |
| `--on-acc` | `oklch(0.17 0.04 255)` | Texto sobre `--acc` |
| `--ring` | `oklch(0.80 0.11 240)` | Anel de foco |
| `--ok` | `oklch(0.84 0.13 160)` | Sucesso · Fio com folga |
| `--on-ok` | `oklch(0.20 0.03 180)` | Texto sobre `--ok` |
| `--warn` | `oklch(0.83 0.14 78)` | Atenção · Fio ≥ 80% · campo duvidoso |
| `--err` | `oklch(0.71 0.18 25)` | Erro · Fio acima do teto |
| `--track` | `oklch(0.97 0.02 255 / 0.16)` | Trilho do Fio |
| `--glow` | `oklch(0.55 0.13 245 / 0.28)` | Brilho de fundo 1 |
| `--glow2` | `oklch(0.50 0.09 215 / 0.20)` | Brilho de fundo 2 |
| `--spot` | `oklch(0.78 0.12 240 / 0.15)` | Spotlight que segue o ponteiro |
| `--hi` | `oklch(1 0 0 / 0.07)` | Realce de 1 px no topo do vidro |
| `--shadow` | `oklch(0 0 0 / 0.7)` | Cor base das sombras |

### Cores derivadas (usadas literalmente nos protótipos)
| Token | OKLCH | Uso |
|---|---|---|
| `--acc-a10` | `oklch(0.78 0.12 240 / 0.10)` | Fundo de item selecionado, hover fantasma, Próximo passo |
| `--acc-a14` | `oklch(0.78 0.12 240 / 0.14)` | Chip de categoria selecionado |
| `--acc-a16` | `oklch(0.78 0.12 240 / 0.16)` | Aba ativa, balão do usuário, número do passo |
| `--acc-a35` | `oklch(0.78 0.12 240 / 0.35)` | Borda do balão do usuário |
| `--acc-a40` | `oklch(0.78 0.12 240 / 0.40)` | Borda do Próximo passo |
| `--ring-halo` | `oklch(0.80 0.11 240 / 0.18)` | Halo de 4 px no foco de campo |
| `--panel` | `oklch(0.20 0.03 255 / 0.72)` | Fundo do cartão-herói do painel (vidro app) |
| `--card-solid` | `oklch(0.20 0.03 255 / 0.8)` | Cartões do app (DAS, listas, opções) |
| `--glass-top` | `oklch(0.25 0.035 255 / 0.66)` | Vidro landing, topo do gradiente |
| `--glass-bottom` | `oklch(0.18 0.03 255 / 0.66)` | Vidro landing, base do gradiente |
| `--glass-line` | `oklch(0.97 0.02 255 / 0.12)` | Borda do vidro landing |
| `--glass-hi` | `oklch(1 0 0 / 0.09)` | Realce do vidro landing |
| `--cta-bg` | `oklch(0.97 0.01 240)` | Botão branco da landing |
| `--cta-bg-hover` | `oklch(1 0 0)` | Hover do botão branco |
| `--cta-fg` | `oklch(0.18 0.04 255)` | Texto do botão branco |
| `--cta-inset` | `oklch(0.82 0.03 240)` | Borda inferior interna do botão branco |
| `--fio-wire` | `oklch(0.86 0.08 232)` | Linha do Fio decorativo (landing) |
| `--fio-head` | `oklch(0.95 0.04 232)` | Ponta brilhante do Fio na abertura |
| `--scrim` | `oklch(0.08 0.02 255 / 0.6)` | Fundo atrás do bottom sheet |
| `--scrim-modal` | `oklch(0.10 0.02 255 / 0.72)` | Fundo atrás de modal |
| `--star` | `oklch(0.95 0.02 240)` | Estrelas do fundo da landing |

Mistura de estado (alertas, chips de status): use `color-mix(in oklch, <cor> N%, <base>)` com os valores da tabela de componentes (03).

### Fundos compostos
- **App:** `radial-gradient(120% 45% at 25% -5%, var(--glow), transparent 62%), radial-gradient(80% 35% at 110% 35%, var(--glow2), transparent 70%), var(--bg)` + grão (`svg/textura-grao.svg`, opacidade 0.08).
- **Landing (fixo, atrás de tudo):** `radial-gradient(120% 70% at 50% -10%, oklch(0.24 0.06 245), transparent 60%), radial-gradient(80% 60% at 100% 100%, oklch(0.20 0.045 235 / 0.7), transparent 70%), linear-gradient(180deg, oklch(0.155 0.026 255), oklch(0.13 0.022 255))`. Estrelas: 5 `radial-gradient(1px 1px …, var(--star), transparent)` em `background-size: 270px 270px`, opacidade 0.28. Grão com opacidade 0.07, camada fixa `z-index: 45`, `pointer-events: none`.

## Raios
| Token | Valor | Onde |
|---|---|---|
| `--r-xs` | 8px | Etiqueta "exemplo" |
| `--r-sm` | 10px | Item interno de segmentado, botão do toast |
| `--r-md` | 12px | Chip de fonte, botão pequeno, banner demo |
| `--r-lg` | 14px | **Padrão** (`--radius`): botão 48, campo, segmentado |
| `--r-xl` | 16px | Botão 56, campo de valor 64, toast, item de lista |
| `--r-2xl` | 20px | Cartões do app, botão de entrada (Foto…), FAB |
| `--r-3xl` | 24px | Cartões de vidro da landing, tab bar (DS) |
| `--r-4xl` | 26px | Cartão-herói do painel, tab bar do app, cartão IA (landing) |
| `--r-sheet` | 30px | Topo do bottom sheet |
| `--r-cta` | 40px | Cartão do CTA final |
| `--r-full` | 999px | Pílulas, botões da landing, chips de status |

## Sombras (em camadas)
| Token | Valor |
|---|---|
| `--shadow-glass` (landing) | `inset 0 1px 0 var(--glass-hi), 0 1px 2px oklch(0 0 0 / 0.35), 0 14px 34px -14px oklch(0 0 0 / 0.55), 0 44px 90px -44px oklch(0 0 0 / 0.75)` |
| `--shadow-panel` (vidro app) | `inset 0 1px 0 var(--hi), 0 30px 60px -34px var(--shadow)` |
| `--shadow-nav` (tab bar) | `inset 0 1px 0 var(--hi), 0 20px 40px -20px var(--shadow)` |
| `--shadow-nav-top` (nav landing rolada) | `inset 0 1px 0 oklch(1 0 0 / 0.08), 0 20px 40px -24px oklch(0 0 0 / 0.7)` |
| `--shadow-toast` | `0 20px 44px -16px var(--shadow)` |
| `--shadow-fab` | `0 14px 34px -10px oklch(0.78 0.12 240 / 0.7), inset 0 1px 0 oklch(1 0 0 / 0.35)` |
| `--shadow-cta` (botão branco) | `inset 0 -2px 0 var(--cta-inset), 0 14px 44px -10px oklch(0.75 0.13 240 / 0.8)` |
| `--shadow-modal` | `0 40px 90px -30px oklch(0 0 0 / 0.9)` |
| `--shadow-tour` | `0 24px 50px -20px oklch(0 0 0 / 0.8)` |
| `--shadow-phone` | `0 0 0 1px oklch(0.85 0.08 235 / 0.3), 0 0 90px -12px oklch(0.65 0.14 242 / 0.55), 0 40px 80px -30px oklch(0 0 0 / 0.8)` |

Desfoque de vidro: `backdrop-filter: blur(18px)` (app) e `blur(18px) saturate(1.2)` (landing). Nav rolada: `blur(20px) saturate(1.3)`.

## Espaçamento
Base de 4 px (escala padrão do Tailwind). Valores usados de fato: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48, 64.
- Margem lateral do app: **20px**. Gap entre blocos do painel: **16px**. Gap em formulário: **12–18px**.
- Área do rodapé de ação (app): `padding: 12px 20px 34px`.
- Largura máxima landing: `min(1240px, 100% - 40px)` (nav e hero: 1180px; FAQ: 900px).
- Padding vertical de seção (landing): `clamp(64px, 8vw, 120px)`.
- Alvo de toque mínimo: **44×44px**.

## z-index
| Token | Valor | Camada |
|---|---|---|
| `--z-bg` | 0 | Fundo, canvas WebGL, SVG fallback |
| `--z-content` | 1 | Seções (hero usa 2) |
| `--z-fab` | 3 | Botão Adicionar |
| `--z-tabbar` | 4 | Tab bar do app |
| `--z-toast` | 6 | Toast |
| `--z-sheet` | 7 | Bottom sheet |
| `--z-tour` | 9 | Tour guiado |
| `--z-grain` | 45 | Grão da landing |
| `--z-menu` | 49 | Menu mobile da landing |
| `--z-nav` | 50 | Nav da landing |
| `--z-progress` | 60 | Barra de progresso de leitura |
| `--z-modal` | 80 | Modal |
| `--z-intro` | 100 | Abertura |

## Breakpoints
| Nome | Largura | Comportamento |
|---|---|---|
| base | **390px** (referência de desenho, funciona de 320 para cima) | 1 coluna, menu "Menu", sem WebGL |
| `md` | **768px** | Seções da landing em 2 colunas; nav ainda com "Menu" |
| `xl` | **1280px** | Nav com links, cartões flutuantes no hero, Lenis, WebGL, tilt |

O protótipo troca tudo em um único ponto: **900px**. A divisão 768/1280 é decisão deste pacote (ver 05).

---

## Bloco pronto: `app/globals.css`
```css
@import "tailwindcss";
@import "tw-animate-css"; /* vem com o shadcn init; pode remover se não usar */

:root {
  color-scheme: dark;

  /* superfícies e texto */
  --bg: oklch(0.16 0.025 255);
  --s1: oklch(0.20 0.03 255);
  --s2: oklch(0.245 0.035 255);
  --s3: oklch(0.30 0.04 255);
  --t1: oklch(0.97 0.008 255);
  --t2: oklch(0.85 0.02 255);
  --t3: oklch(0.72 0.025 255);
  --line: oklch(0.97 0.02 255 / 0.12);
  --line-strong: oklch(0.97 0.02 255 / 0.22);

  /* acento e estados */
  --acc: oklch(0.78 0.12 240);
  --acc-ink: oklch(0.80 0.11 240);
  --on-acc: oklch(0.17 0.04 255);
  --ring: oklch(0.80 0.11 240);
  --ok: oklch(0.84 0.13 160);
  --on-ok: oklch(0.20 0.03 180);
  --warn: oklch(0.83 0.14 78);
  --err: oklch(0.71 0.18 25);

  /* fio e atmosfera */
  --track: oklch(0.97 0.02 255 / 0.16);
  --glow: oklch(0.55 0.13 245 / 0.28);
  --glow2: oklch(0.50 0.09 215 / 0.20);
  --spot: oklch(0.78 0.12 240 / 0.15);
  --hi: oklch(1 0 0 / 0.07);
  --shadow: oklch(0 0 0 / 0.7);

  /* derivadas */
  --acc-a10: oklch(0.78 0.12 240 / 0.10);
  --acc-a14: oklch(0.78 0.12 240 / 0.14);
  --acc-a16: oklch(0.78 0.12 240 / 0.16);
  --acc-a35: oklch(0.78 0.12 240 / 0.35);
  --acc-a40: oklch(0.78 0.12 240 / 0.40);
  --ring-halo: oklch(0.80 0.11 240 / 0.18);
  --panel: oklch(0.20 0.03 255 / 0.72);
  --card-solid: oklch(0.20 0.03 255 / 0.8);
  --glass-top: oklch(0.25 0.035 255 / 0.66);
  --glass-bottom: oklch(0.18 0.03 255 / 0.66);
  --glass-line: oklch(0.97 0.02 255 / 0.12);
  --glass-hi: oklch(1 0 0 / 0.09);
  --cta-bg: oklch(0.97 0.01 240);
  --cta-bg-hover: oklch(1 0 0);
  --cta-fg: oklch(0.18 0.04 255);
  --cta-inset: oklch(0.82 0.03 240);
  --fio-wire: oklch(0.86 0.08 232);
  --fio-head: oklch(0.95 0.04 232);
  --scrim: oklch(0.08 0.02 255 / 0.6);
  --scrim-modal: oklch(0.10 0.02 255 / 0.72);
  --star: oklch(0.95 0.02 240);

  /* sombras */
  --shadow-glass: inset 0 1px 0 var(--glass-hi), 0 1px 2px oklch(0 0 0 / 0.35), 0 14px 34px -14px oklch(0 0 0 / 0.55), 0 44px 90px -44px oklch(0 0 0 / 0.75);
  --shadow-panel: inset 0 1px 0 var(--hi), 0 30px 60px -34px var(--shadow);
  --shadow-nav: inset 0 1px 0 var(--hi), 0 20px 40px -20px var(--shadow);
  --shadow-nav-top: inset 0 1px 0 oklch(1 0 0 / 0.08), 0 20px 40px -24px oklch(0 0 0 / 0.7);
  --shadow-toast: 0 20px 44px -16px var(--shadow);
  --shadow-fab: 0 14px 34px -10px oklch(0.78 0.12 240 / 0.7), inset 0 1px 0 oklch(1 0 0 / 0.35);
  --shadow-cta: inset 0 -2px 0 var(--cta-inset), 0 14px 44px -10px oklch(0.75 0.13 240 / 0.8);
  --shadow-modal: 0 40px 90px -30px oklch(0 0 0 / 0.9);
  --shadow-tour: 0 24px 50px -20px oklch(0 0 0 / 0.8);

  /* z-index */
  --z-bg: 0; --z-content: 1; --z-fab: 3; --z-tabbar: 4; --z-toast: 6; --z-sheet: 7; --z-tour: 9;
  --z-grain: 45; --z-menu: 49; --z-nav: 50; --z-progress: 60; --z-modal: 80; --z-intro: 100;

  /* movimento (ver 06) */
  --dur-press: 150ms; --dur-fast: 200ms; --dur-base: 320ms; --dur-slow: 550ms; --dur-fio: 1100ms;

  /* ===== variáveis que o shadcn espera ===== */
  --radius: 14px;
  --background: var(--bg);
  --foreground: var(--t1);
  --card: var(--s1);
  --card-foreground: var(--t1);
  --popover: var(--s2);
  --popover-foreground: var(--t1);
  --primary: var(--acc);
  --primary-foreground: var(--on-acc);
  --secondary: var(--s2);
  --secondary-foreground: var(--t1);
  --muted: var(--s2);
  --muted-foreground: var(--t3);
  --accent: var(--s3);
  --accent-foreground: var(--t1);
  --destructive: var(--err);
  --border: var(--line);
  --input: var(--line-strong);
  /* --ring já definido acima */
}

@theme inline {
  /* fontes (variáveis criadas pelo next/font, ver 02) */
  --font-sans: var(--font-figtree), system-ui, sans-serif;
  --font-num: var(--font-manrope), system-ui, sans-serif;

  /* shadcn */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* Conta Comigo */
  --color-s1: var(--s1);
  --color-s2: var(--s2);
  --color-s3: var(--s3);
  --color-t1: var(--t1);
  --color-t2: var(--t2);
  --color-t3: var(--t3);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-acc: var(--acc);
  --color-acc-ink: var(--acc-ink);
  --color-on-acc: var(--on-acc);
  --color-ok: var(--ok);
  --color-on-ok: var(--on-ok);
  --color-warn: var(--warn);
  --color-err: var(--err);
  --color-track: var(--track);
  --color-panel: var(--panel);
  --color-card-solid: var(--card-solid);
  --color-cta: var(--cta-bg);
  --color-cta-fg: var(--cta-fg);

  /* raios: rounded-xs … rounded-cta */
  --radius-xs: 8px;
  --radius-sm: 10px;
  --radius-md: 12px;
  --radius-lg: var(--radius);
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-3xl: 24px;
  --radius-4xl: 26px;
  --radius-sheet: 30px;
  --radius-cta: 40px;

  /* sombras: shadow-glass … */
  --shadow-glass: var(--shadow-glass);
  --shadow-panel: var(--shadow-panel);
  --shadow-nav: var(--shadow-nav);
  --shadow-toast: var(--shadow-toast);
  --shadow-fab: var(--shadow-fab);
  --shadow-cta: var(--shadow-cta);
  --shadow-modal: var(--shadow-modal);

  /* easing: ease-cc, ease-cc-inout */
  --ease-cc: cubic-bezier(0.2, 0.7, 0.2, 1);
  --ease-cc-inout: cubic-bezier(0.65, 0, 0.35, 1);

  /* breakpoints: md (768) e xl (1280) já são padrão do Tailwind v4 */
  --breakpoint-xs: 24.375rem; /* 390px */
}

@layer base {
  html, body { background: var(--bg); color: var(--t1); -webkit-font-smoothing: antialiased; }
  body { font-family: var(--font-sans); }
  a { color: var(--acc-ink); text-underline-offset: 3px; }
  a:hover { opacity: .85; }
  :focus-visible { outline: 2px solid var(--ring); outline-offset: 3px; }
  .num { font-family: var(--font-num); font-variant-numeric: tabular-nums; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

Observação: o `shadcn init` também cria `--chart-*` e `--sidebar-*`. Não são usados; pode apagar.
