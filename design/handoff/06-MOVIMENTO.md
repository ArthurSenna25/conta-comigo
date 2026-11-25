# 06 · Movimento

## Regra única
**Só animar `transform`, `opacity`, `clip-path` e `stroke-dashoffset`.**
- Mudança de cor, borda, fundo, sombra, largura, altura, `left/top` → **instantânea** (sem `transition`).
- Para "fundo que aparece" (nav rolada, hover suave), anime a **opacity** de uma camada (`::before`) com aquele fundo.
- Para mover algo de lugar (recorte do tour, etiqueta do gráfico), use `transform: translate()`.
- Respeite `prefers-reduced-motion` e o modo leve (05).

## Easings
| Token | Valor | GSAP equivalente | Uso |
|---|---|---|---|
| `ease-cc` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | `power3.out` (aprox.) | **Padrão** de toda transição de interface |
| `ease-cc-inout` | `cubic-bezier(0.65, 0, 0.35, 1)` | `power2.inOut` (aprox.) | Abertura da landing |
| `ease-scan` | `cubic-bezier(0.4, 0, 0.2, 1)` | – | Faixa de brilho do "Lendo" |
| `ease-out-quart` | `1 − (1 − t)^4` (JS) | `power3.out` | Contagem de número + Fio do painel |
| `ease-out-cubic` | `1 − (1 − t)^3` (JS) | `power2.out` | Contagem no DS |
| `power3.out` | – | GSAP | Entradas e reveals |
| `power4.out` | – | GSAP | Títulos por linha |
| `sine.inOut` | – | GSAP | Flutuação contínua |
| `linear` | – | `none` | Spinner, borda cônica, scrub |
| `ease-in-out` | CSS | – | Pulsos (skeleton, gravando, digitando) |

## Durações
| Token | Valor | Onde |
|---|---|---|
| `press` | 150ms | `scale(.97)` ao pressionar (FAB `.96`, CTA de rodapé `.98`) |
| `fast` | 200ms | ímã, hover com camada, switch do modo leve |
| `switch` | 250ms | bolinha do switch, tilt |
| `screen` | 320ms | entrada de tela do app (`translateY 14px→0`, `opacity .4→1`) |
| `faq` | 300ms | giro do "+" do acordeão |
| `fio-onb` | 400ms | Fio do onboarding ao digitar |
| `nav` | 400ms | camada de vidro da nav |
| `odo` | 450ms | dígito do odômetro |
| `step-text` | 500ms | texto do Siga o Fio |
| `step-phone` | 550ms | celular do Siga o Fio; saída da abertura |
| `canvas` | 600ms | fade do canvas WebGL / SVG |
| `glow` | 700ms | brilho do dígito |
| `reveal` | 800ms | reveals e entrada do hero (stagger 80ms) |
| `spin` | 800ms | spinner, loop linear |
| `fio-ds` | 900ms | Fio no design system |
| `lines` | 1000–1100ms | títulos por linha (stagger 80–90ms) |
| `fio` | 1100ms | Fio + número do painel |
| `intro` | 1200ms | desenho da abertura (total visível 1950ms) |
| `pulse` | 1400ms | skeleton (atrasos 0/150/300/450ms) |
| `scan` | 1600ms | faixa do "Lendo" |
| `float` | 3400ms | flutuação do celular (yoyo, ±12px) |
| `conic` | 3200ms | borda girando do botão "Comece agora" |
| `toast` | 5000ms | tempo até o toast sumir (não é animação) |
| `ia-field` | 560ms | intervalo entre campos do cartão IA da landing |

## Loops infinitos (keyframes)
```css
@keyframes cc-spin  { to { transform: rotate(360deg); } }
@keyframes cc-pulse { 0%,100% { opacity: .45; } 50% { opacity: 1; } }
@keyframes cc-wave  { 0%,100% { transform: scaleY(.22); } 50% { transform: scaleY(1); } }
@keyframes cc-scan  { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
@keyframes cc-scany { from { transform: translateY(-10%); } to { transform: translateY(160%); } }
```

## Onde o protótipo quebra a regra (corrigir na implementação)
| No protótipo | Fazer assim |
|---|---|
| Fio: `transition: stroke .4s / fill .4s` | Cor instantânea |
| Nav: `transition: background, border-color, box-shadow` | Camada `::before` com opacity |
| Botões e campos: `transition: background`, `border-color` | Sem transição de cor |
| Switch: `transition: background` no trilho | Cor instantânea; bolinha com transform |
| Tour: `transition: all` (left/top/width/height) | `transform: translate() scale()` |
| Borda do botão "Comece agora": anima `--ang` (`@property`) | Pseudo-elemento com `conic-gradient` fixo girando por `transform: rotate()` dentro de um contêiner com `overflow: hidden` e raio 999 |
| Acordeão shadcn anima `height` | Remover; conteúdo aparece com opacity |
| Hover do FAQ: `transition: color` | Cor instantânea |
