# 05 · Landing

Fonte: `prototipos/conta-comigo-landing.dc.html`. Rota `/`.

## Bibliotecas
| Lib | Pacote | Uso | Carregar |
|---|---|---|---|
| GSAP 3.13+ | `gsap` (inclui ScrollTrigger e SplitText, gratuitos) | entradas, reveals, parallax, skew | dinâmico, só se não for modo leve/reduced |
| Lenis | `lenis` | rolagem suave | só ≥1280 + `pointer: fine` |
| Three.js | `three` | **o único `<canvas>`**: Fio 3D de fundo | `import()` dinâmico, só ≥1280, altura ≥600, `pointer: fine`, sem leve/reduced |
| CSS 3D | – | cartões flutuantes (`rotateY`), tilt, `perspective` | sempre (tilt só desktop) |

Todos em componentes `"use client"`. Crie um único `useLandingMotion()` que inicia tudo depois de `document.fonts.ready` e desmonta (`gsap.matchMedia().revert()`, `lenis.destroy()`, `gl.destroy()`).
Código de referência do canvas: `prototipos/fio3d.js` (tubo em 3 camadas aditivas, 1400 partículas, ponta brilhante, câmera segue a curva; DPR máx. 1.5; pausa com `document.hidden`). Reescrever como módulo TS importando `three` do npm.

## Fundo contínuo (atrás de todas as seções)
Camadas fixas, `pointer-events: none`: gradiente (01) → estrelas → **canvas WebGL** (opacidade 0 até montar; transição .6s) **ou** **SVG fallback** → grão (`z-index: 45`). Não há bordas entre seções: só máscaras `linear-gradient` nas bordas das seções sticky.

Opacidade do Fio de fundo por seção (`data-fio`, seção que cruza o meio da tela): Hero 1 · Siga o Fio 1 · O limite 1 · IA 0.3 · Chat 0.3 · Segurança 0.3 · FAQ 0.25 · CTA 1. SVG usa `min(1, valor + 0.2)`.

Cor do Fio de fundo (WebGL e SVG):
- até Siga o Fio: mistura gelo `rgb(172 214 250)` → verde `rgb(112 226 172)` pelo progresso de Siga o Fio;
- dentro de O limite: pct < 70 verde; 70–80 mistura verde→âmbar `rgb(242 192 92)`; 80–100 âmbar; >100 mistura âmbar→vermelho `rgb(240 108 92)` em 3 pontos;
- depois de O limite: gelo.
(Valores RGB porque alimentam o shader; equivalem a `--fio-wire`, `--ok`, `--warn`, `--err`.)

## Breakpoints (decisão deste pacote; o protótipo usa só 900px)
| | <768 | 768–1279 | ≥1280 |
|---|---|---|---|
| Nav | "Menu" | "Menu" | links + Entrar + Comece agora |
| Grade das seções 2 col. | 1 coluna | 2 colunas `minmax(0,1fr) minmax(0,1fr)` | 2 colunas |
| Cartões flutuantes do hero | não | não | sim |
| Celular do hero (escala de 390×844) | 0.5 | 0.56 | `clamp(0.56, (altura−180)/844, 0.7)` |
| Siga o Fio altura | 360vh | 420vh | 420vh |
| O limite altura | 260vh | 300vh | 300vh |
| Altura do gráfico | 110px | 130px | 180px (130 se altura < 820) |
| Lenis, WebGL, parallax, skew, tilt, float | não | não | sim |
| Reveals e SplitText | sim (y 18) | sim (y 40) | sim (y 40) |

## Seções (texto exato)

### Abertura
- Tela `--bg` cheia, `z-index: 100`. Linha 420px (máx 70vw) se desenha (`stroke-dashoffset` 100→0, **1.2s ease-cc-inout**), ponta brilhante anda junto (`translateX`). "Conta Comigo" (Manrope 30/800) aparece (opacity .5s, atraso .45s).
- Em 1.35s começa a sumir (opacity .55s); some em 1.95s. Botão "Pular abertura" (canto inferior direito, 44px).
- Só **uma vez por sessão** (`sessionStorage`). Nunca em modo leve ou reduced motion.

### Barra de progresso
Topo, 2px, `--ok` com `box-shadow: 0 0 10px var(--ok)`, `transform: scaleX(progressoDaPágina)`, origem à esquerda.

### Nav
Ver 03. Links: Como funciona · O limite · Segurança · Perguntas. Botões: Entrar → `/entrar`; Comece agora → `/cadastrar`.

### Hero (`#topo`)
- Padding topo `clamp(124px, 17vh, 176px)`, centralizado, `min-height: 100vh`.
- Eyebrow (pílula de vidro, 36px): Fio mini + "Assistente de papelada para MEI".
- H1: "Mande a foto. A gente cuida do resto."
- Sub: "A IA lê seu recibo, áudio ou print e monta o rascunho. Você confere, e o app calcula seu limite anual e o DAS."
- Botões: "Comece agora" (branco 58px, com borda cônica girando, ver 06) → `/cadastrar`; "Ver o app funcionando ↓" (vidro) → `#como`.
- Garantias (15 `--t2`, gap 8×22): "Nada é salvo sem você confirmar" · "IA opcional" · "Você apaga quando quiser".
- Palco: celular com o **Painel em modo demo** (mesmo componente do app, dados de exemplo, `inert` + `aria-hidden`), raio 44×escala, `--shadow-phone`. Máscara inferior `linear-gradient(180deg, #000 55%, transparent 98%)`. Altura do palco = altura do celular × 0.74 (desktop) / 0.68.
- ≥1280: 2 cartões de vidro em CSS 3D: esquerda (5%, top 96, `rotateY(22deg) rotateZ(-4deg)`, 280px): "Faturado em 2026 · exemplo", "R$ 34.020,00", Fio mini, "Faltam R$ 46.980,00". Direita (5%, top 170, `rotateY(-22deg) rotateZ(4deg)`, 260px): "Próximo DAS · exemplo", "R$ 81,90", "Vence em 20/12/2026".
- Decoração: feixes cônicos + feixe central de 1.5px + horizonte curvo (gradientes CSS, ver protótipo).

### Siga o Fio (`#como`)
- Seção alta (360/420vh) com filho `position: sticky; top: 0; height: 100vh`. Máscara topo/base 15%.
- Esquerda: kicker "Siga o fio · o app funcionando"; trilho 300px com 4 pontos (cinza `oklch(0.40 0.03 255)` → `--ok` quando alcançado) e preenchimento verde ligado ao progresso; texto do passo atual.
- Direita: celular (escala desktop `clamp(0.5, altura×0.68/844, 0.72)`; mobile `clamp(0.3, (altura×0.7−240)/844, 0.46)`) com halo radial.
- Passos (`passo = min(3, floor(progresso × 4))`):
  1. "1 · Você tira a foto" — "Um toque em Foto. Pronto." — "Recibo amassado, nota do Pix, print. Do jeito que estiver à mão." — tela **Adicionar**
  2. "2 · A IA lê" — "Valor, data e tipo, em segundos." — "A tela diz o que está acontecendo. Nada é salvo ainda." — tela **Lendo**
  3. "3 · Você confere" — "O rascunho pronto. Você confirma." — "O que ficou duvidoso aparece em âmbar, para você olhar." — tela **Conferir**
  4. "4 · O fio anda" — "Confirmou, o Fio do Limite avança." — "O número sobe na hora e mostra quanto ainda falta para o teto." — tela **Painel com toast "Lançamento salvo"** (R$ 34.370,00)
- Troca: texto opacity + `translateY(±24px)` 500ms ease-cc; celular opacity + `translateY(-40 | +60px)` + `scale(.94→1)` 550ms ease-cc. Passos inativos com `aria-hidden`.
- Mobile: texto em cima, celular embaixo, gap 18.

### O limite (`#recursos`)
- Seção alta (260/300vh) + sticky 100vh. Máscara 9%.
- Kicker "O Fio do Limite" · H2 "O teto do MEI, desenhado em uma linha."
- Odômetro: "R$" + 7 dígitos em 2 grupos (`00.000,00`). Cada dígito é uma fita 0–9 movida por `translateY(-Nem)` 450ms ease-cc. Zeros à esquerda com opacidade .25. Ao mudar, brilho radial na cor do status (opacity .5→0 em 700ms).
- Fio largo (viewBox 1000×40): trilho até 909, marca 80% em 727, teto em 909; traço e bolinha r=9; legenda "R$ 0 · 80% · R$ 81 mil".
- Gráfico: 11 barras (jan–nov), altura proporcional ao maior mês, `scaleY` 0→1 pelo scroll; cor de cada barra pelo **acumulado** até ela (verde/âmbar/vermelho). Etiqueta flutuante "{mês} · R$ X" sobre a barra atual. Gráfico é `aria-hidden`.
- Rodapé: StatusPill ("Com folga" / "Atenção · passou de 80%" / "Estourou o teto") + "Faltam R$ X" / "Passou R$ X do teto" + "Faturamento mês a mês · exemplo".
- Mecânica: `k = progresso × 11`; barra i preenche `clamp(k − i, 0, 1)`; total = soma de `mês_i × preenchimento_i`. [EXEMPLO] meses: 5.200 · 6.100 · 6.800 · 7.400 · 7.000 · 7.900 · 8.300 · 8.600 · 8.900 · 9.100 · 8.940 = **R$ 84.240,00**.
- Acessibilidade: o número final e o status ficam num `<p class="sr-only">` estático: "Exemplo: R$ 84.240,00 faturados até novembro, R$ 3.240,00 acima do teto de R$ 81.000,00."

### A IA só rascunha (`#ia`)
- Kicker "A IA só rascunha" · H2 "A IA sugere. O código calcula. Você decide."
- 3 linhas (grade 110px + 1fr, borda superior `--line`):
  - **A IA** (`--acc-ink`): "Lê a foto, o áudio ou o print e sugere valor, data, tipo e categoria. Se ficar em dúvida, avisa."
  - **O código** (`--ok`): "Calcula limite anual, DAS e alertas com regras fixas e testadas. A IA não faz conta."
  - **Você** (`--t1`): "Confere, corrige se precisar e confirma. Sem sua confirmação, nada é salvo."
- Cartão de vidro (440px, raio 26): "Rascunho" + status (`aria-live`): "Lendo a foto… procurando valor, data e tipo" → "Pronto para você conferir" · etiqueta exemplo · área listrada "recibo.jpg" com faixa de varredura · 4 campos que se preenchem a cada **560ms** (Valor "R$ 350,00", Data · confira "2?/11/2026" em âmbar, Tipo "Entrada", Categoria "Serviço prestado") · "Nada foi salvo. Só entra no fio quando você confirmar." · botão "Ler de novo" · "Ilustração do app".
- Dispara 1× quando 40% visível (IntersectionObserver). Modo leve: já aparece preenchido.

### Chat com fonte
- Desktop: balões à esquerda, texto à direita. Mobile: texto primeiro.
- Balão usuário: "E se eu passar do limite?"
- Resposta (Fio mini vermelho): "Se passar até 20% (até R$ 97.200,00), você segue MEI até dezembro, paga imposto sobre o excesso e vira microempresa em janeiro." **PENDENTE fonte**.
- Chip "LC 123/2006, art. 18-A, § 7º" (↗ / − ) expande: "Trata do desenquadramento do MEI. O texto oficial é o que vale. Abrir no Planalto ↗" (https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm). **PENDENTE data de consulta e conferência do parágrafo.**
- Rodapé do balão: "Informativo. Não substitui um contador."
- Kicker "Chat com fonte" · H2 "Pergunte. A resposta vem com a lei." · "Respostas curtas, sem juridiquês. Cada uma mostra de onde saiu, num chip que você toca para conferir."

### Segurança (`#seguranca`)
- Kicker "Segurança e privacidade" · H2 "Seu dinheiro, suas regras."
- 3 cartões de vidro (grade `auto-fit minmax(300px, 1fr)`, mín. 240px alto, padding 28), cada um com Fio 64px (ponto em 20/40/60):
  - "Você apaga quando quiser" — "Um toque no Perfil e seus lançamentos somem. Sem formulário, sem esperar."
  - "Nada é salvo sem você" — "Cada lançamento passa pelos seus olhos antes de entrar. E dá para desfazer."
  - "A IA é opcional" — "Não quer IA? Recuse no cadastro ou desligue no Perfil. O app segue calculando tudo."

### Perguntas (`#perguntas`)
- H2 "Perguntas frequentes". Acordeão (shadcn Accordion `type="single" collapsible`, 1ª aberta), cartão de vidro largura 900. Pergunta 72px mín.; ícone "+" em círculo 36px gira 45° (300ms). **Desligue a animação de altura do shadcn** (só opacity no conteúdo).
  1. O que acontece se eu passar do limite? — O app avisa em âmbar a partir de 80% e em vermelho se passar. Até 20% acima do teto, você segue MEI até dezembro, paga imposto sobre o excesso e vira microempresa no ano seguinte. O chat mostra a regra com a fonte. (**PENDENTE fonte**)
  2. Preciso aceitar a IA? — Não. A IA é opcional. Se recusar, você preenche os lançamentos na mão e o app calcula tudo do mesmo jeito.
  3. A IA calcula meu imposto? — Não. A IA só lê o que você manda e monta um rascunho. Limite e DAS são calculados pelo código do app, com regras fixas.
  4. Algo é salvo sem eu ver? — Nada. Cada lançamento só entra depois que você confirma. E dá para desfazer logo depois.
  5. Posso apagar meus dados? — Sim, quando quiser, pelo Perfil. Apagou, sumiu.
  6. Substitui meu contador? — Não. O Conta Comigo organiza a papelada do dia a dia e explica as regras do MEI. Para decisões maiores, fale com um contador.

### CTA final
- Linha vertical (20px × `clamp(160px, 26vh, 280px)`) que se desenha com o scroll.
- Cartão de vidro raio 40, padding `clamp(72px, 11vw, 152px) clamp(24px, 5vw, 72px)`, feixe central + brilho inferior.
- H2 "Conta comigo para a papelada." · "Crie sua conta em um minuto, ou teste agora com dados de exemplo."
- "Comece agora" (branco) → `/cadastrar`; "Testar com a conta demo" (vidro) → app em modo demo (**rota PENDENTE**).

### Rodapé
- "Conta Comigo" · "Projeto de hackathon. Não é um escritório de contabilidade e não substitui um contador." (**confirmar texto final**)
- Links "Termos de uso" → `/legal/termos`, "Privacidade" → `/legal/privacidade` (**PENDENTES**).
- Switch "Modo leve".

## Especificação de movimento
| Efeito | Gatilho | Duração / easing | Tecnologia | Propriedade |
|---|---|---|---|---|
| Abertura | carregamento, 1×/sessão | 1.2s ease-cc-inout; saída .55s | CSS | stroke-dashoffset, transform, opacity |
| Entrada do hero (`[data-hero]`) | após abertura (atraso 1.35s) ou .15s | .8s power3.out, stagger .08 | GSAP timeline | y 24→0, opacity |
| H1 por linhas | junto, em .1s | 1.1s power4.out, stagger .08 | GSAP SplitText (`type: lines, mask: lines`) | yPercent 110→0 |
| Saída do palco do hero | scroll do hero até 75% | scrub | ScrollTrigger | translateY 0→−90px, scale 1→.92, opacity 1→0 (×1.25) |
| Parallax (`[data-speed]`) | scroll da seção | scrub, ease none | ScrollTrigger (≥1280) | yPercent = speed × −40 |
| Flutuação do celular | contínuo | 3.4s sine.inOut yoyo | GSAP (≥1280) | y 0↔−12 |
| Reveal (`[data-reveal]`) | topo do elemento em 92% da tela, 1× | .8s power3.out | ScrollTrigger | y 40/18→0, opacity |
| Títulos por linha (`[data-lines]`) | topo em 90%, 1× | 1s power4.out, stagger .09 | SplitText; sem SplitText: clip-path `inset(0 0 100% 0)` | yPercent / clip-path |
| Skew por velocidade (`[data-skew]`) | velocidade do scroll | quickTo .5s power3.out; volta a 0 no fim | ScrollTrigger (≥1280) | skewY ±2° (`velocidade / −500`) |
| Siga o Fio | progresso da seção | troca 500/550ms ease-cc | CSS sticky + ScrollTrigger `onUpdate` (sem pin) | opacity, transform, stroke-dashoffset |
| O limite | progresso da seção | odômetro 450ms ease-cc; brilho 700ms | CSS sticky + ScrollTrigger `onUpdate` | translateY, scaleY, stroke-dashoffset, opacity |
| Fio de fundo | progresso da página | lerp .08 (WebGL) / direto (SVG) | Three.js / SVG | câmera, stroke-dashoffset |
| Linha do CTA | scroll | direto | ScrollTrigger `onUpdate` | stroke-dashoffset |
| Nav vidro | scrollY > 40 | 400ms ease-cc | CSS | opacity da camada `::before` |
| Tilt / ímã / spotlight | ponteiro | 250 / 200ms / instantâneo | JS + CSS | transform, variável `--x/--y` |
| Rolagem suave | sempre | `lerp: 0.1`, `anchors: true` | Lenis ligado ao `gsap.ticker` e `ScrollTrigger.update` (≥1280) | – |

Proteções do protótipo (manter):
- Depois de 1.5s, todo reveal que já está visível e não rodou recebe `progress(1)`.
- Depois de 3.8s, a timeline do hero é completada se travou.
- `ScrollTrigger.refresh()` após fontes carregarem e no resize.

## Fallback SVG
Arquivo `svg/fio-fallback-landing.svg`: `<svg>` fixo em tela cheia, `viewBox="0 0 100 1000" preserveAspectRatio="none"`, dois `path` com a mesma curva: halo (12px, cor a 16%) e núcleo (2px). `vector-effect: non-scaling-stroke`. `stroke-dashoffset = 100 − progressoDaPágina × 100`. Cor pela regra de cor acima.
Usar quando: <1280, toque, modo leve, reduced motion, sem WebGL, ou erro no `import()` de three (logar aviso, nunca quebrar a página). Esconder o SVG quando o WebGL montar.

## Modo leve
- Switch no rodapé. Ao ligar: desmonta GSAP (`matchMedia().revert()`), Lenis e WebGL; desliga abertura, tilt, ímã, flutuação, skew, varredura do cartão IA (campos já preenchidos), brilho do odômetro, saída do palco. Todo o conteúdo fica visível e estático.
- Continua: Siga o Fio e O limite ligados ao scroll (sem transições), SVG fallback, barra de progresso.
- Persistir em `localStorage` (o protótipo não persiste; decisão deste pacote).

## prefers-reduced-motion
- Tratar igual ao modo leve, automaticamente, sem mostrar o switch ligado.
- CSS global zera `animation` e `transition` (01). Nada de abertura, nada de Lenis.
- Valores que dependem do scroll continuam corretos, só sem interpolação.

## Orçamento de desempenho
| Métrica | Meta |
|---|---|
| LCP (4G, celular médio) | ≤ 2.5s (o H1 é o LCP: nunca escondê-lo com opacity 0 no SSR; animar a partir do estado visível só depois de hidratar, ou usar `autoAlpha` com fallback) |
| CLS | ≤ 0.05 (alturas de palco/celular calculadas no servidor com valor padrão) |
| INP | ≤ 200ms |
| JS inicial da landing | ≤ 180 KB gzip (GSAP + ScrollTrigger + SplitText + Lenis ≈ 75 KB) |
| Chunk do Three.js | ≤ 170 KB gzip, carregado por `import()` só no desktop |
| Peso total da página | ≤ 2.5 MB |
| Fontes | 2 famílias, só `latin`, 8 pesos no total |
| WebGL | 1 canvas, DPR máx. 1.5, 1400 partículas, tubo 900 segmentos; pausa com aba oculta |
| Animação | só transform, opacity, clip-path, stroke-dashoffset (06) |
| Celulares no hero e Siga o Fio | usam o componente real do app em modo `still` (sem timers); se pesar, trocar por imagem AVIF estática |

## O que cortar primeiro se faltar tempo (nesta ordem)
1. Abertura
2. Skew por velocidade
3. Lenis
4. Canvas Three.js (fica o SVG fallback)
5. Ímã, tilt e spotlight
6. Brilho dos dígitos do odômetro
7. Parallax dos feixes e cartões flutuantes
8. SplitText (fica reveal simples de opacity/y)
9. Varredura do cartão IA (aparece preenchido)
10. Barras mês a mês (fica odômetro + Fio)

**Nunca cortar:** textos, Siga o Fio sincronizado, Fio do Limite com texto, modo leve, reduced motion, CTAs.
