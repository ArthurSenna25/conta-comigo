# 03 · Componentes

Convenções:
- **Dinheiro sempre em centavos** (`number` inteiro) na lógica. Só formata na tela.
- Formatação: `new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` → "R$ 34.020,00". (Atenção: o Intl usa espaço não separável entre "R$" e o número; está correto.)
- Componentes com estado, ponteiro ou animação: `"use client"`.
- Base shadcn indicada entre parênteses. Ajuste o estilo pelos tokens de 01.
- Estados padrão de todo elemento clicável: **foco** = `outline: 2px solid var(--ring); outline-offset: 3px` (só `:focus-visible`); **pressionado** = `transform: scale(.97)` em 150ms; alvo mínimo 44×44.

---

## FioDoLimite
Elemento-assinatura. Linha horizontal que mostra o faturamento do ano contra o teto do MEI.

```ts
type FioStatus = "folga" | "atencao" | "estourou" | "vazio";
interface FioDoLimiteProps {
  faturadoCentavos: number;
  limiteCentavos?: number;          // padrão 8_100_000 (R$ 81.000,00) — PENDENTE fonte, ver 07
  variante?: "hero" | "compacto" | "onboarding" | "mini";
  animar?: boolean;                 // padrão true; ignorado se reduced motion
  vazio?: boolean;                  // sem nenhum lançamento ainda
}
```

Regras (obrigatórias):
1. `pct = faturado / limite * 100`.
2. **Status:** `pct < 80` → folga (`--ok`, "Com folga"); `80 ≤ pct ≤ 100` → atenção (`--warn`, "Atenção"); `pct > 100` → estourou (`--err`, "Estourou"); `vazio` → "Começando", cor `--ok`, trilho tracejado `stroke-dasharray: 2 6`.
3. **Escala de 110%:** o fim do desenho é 110% do teto. `x = min(pct, 110) / 110 * largura`. Marca de 80% em **72,7%**; marca do teto em **90,9%**. Acima de 110% a bolinha para no fim.
4. **Sempre com texto.** Nunca só a cor. Mostrar: pílula de status + "Faltam R$ X" (ou "Passou R$ X") + legenda "R$ 0 · 80% · 81 mil".
5. Animação de entrada: traço por `stroke-dashoffset` (100 → 100 − x%) e bolinha por `transform: translateX`, **1100ms ease-cc** (DS: 900ms). Número conta junto (easeOutQuart, 1100ms). Troca de cor é instantânea.

Anatomia (variante hero, viewBox `0 0 320 28`, ver `svg/fio-limite-base.svg`):
- Trilho: linha 0→290.9, `--track`, 2px.
- Marca 80%: linha vertical em x=232.7, y 6–22, `--t3`, 1px.
- Marca teto: linha vertical em x=290.9, y 2–26, `--t2`, 1.5px.
- Traço: `path d="M0 14 H320" pathLength="100" stroke-dasharray="100"`, 3px, ponta redonda, `filter: drop-shadow(0 0 6px <cor>)`.
- Bolinha: r=5.5, `filter: drop-shadow(0 0 9px <cor>)`.
- Variante compacto (DS): traço 5px, bolinha r=7. Onboarding: traço 4px, bolinha r=6, transição 400ms. Mini: 44×12, só traço e bolinha (usado no chat e em chips).

Acessibilidade: o `<svg>` é `aria-hidden`. O contêiner tem `role="meter" aria-valuemin={0} aria-valuemax={limite} aria-valuenow={faturado} aria-valuetext="R$ 34.020,00 de R$ 81.000,00, 42%, com folga"`.

## ValorMoeda (exibição)
```ts
interface ValorMoedaProps { centavos: number; sinal?: "entrada" | "saida"; tamanho?: "sm" | "md" | "lg" | "hero"; contar?: boolean }
```
- Manrope + tabular-nums sempre. Entrada: "+ R$ 180,00" em `--ok`. Saída: "− R$ 245,90" (sinal de menos U+2212) em `--t1`.
- `contar`: anima de 0 (ou valor anterior) até o novo valor, 1100ms easeOutQuart, via `requestAnimationFrame` alterando só o texto.

## InputMoeda (campo de valor em R$)
```ts
interface InputMoedaProps { valueCentavos: number; onChange(c: number): void; erro?: string; desabilitado?: boolean; tamanho?: "md" | "lg" | "xl"; label: string }
```
- "Centavos entram primeiro": guarde só dígitos; `centavos = parseInt(digitos)`; remova zeros à esquerda; máximo **9 dígitos**. Mostre `R$` fixo à esquerda (Manrope 700, `--t3`) e o número formatado sem "R$".
- `inputMode="numeric"`, `autoComplete="off"`.
- Alturas: md 56 (raio 14), lg 64 (raio 16, número 28/800), xl 76 (raio 20, número 36/800).
- Estados: **padrão** fundo `--s2`, borda `--line-strong` · **foco** borda `--ring` + `box-shadow: 0 0 0 4px var(--ring-halo)` · **erro** borda `--err`, fundo `color-mix(in oklch, var(--err) 8%, var(--s2))`, mensagem abaixo em `--err` 14/600: "Digite um valor maior que zero" · **desabilitado** fundo transparente, borda tracejada `--line-strong`, texto `--t3`.
- Erro ligado ao campo por `aria-describedby`; `aria-invalid="true"`.

## Input, Textarea (shadcn Input/Textarea)
- Altura 52, raio 14, padding 0 16, fundo `--s2`, borda `--line-strong`, texto 16/500.
- Foco: borda `--ring` + halo 4px `--ring-halo`. Erro: borda `--err` + mensagem. Desabilitado: opacidade do texto `--t3`, sem halo.
- Rótulo acima: 14/600 `--t2`, gap 6. Campo duvidoso da IA: rótulo vira "<Campo> · confira" em `--warn`, borda `--warn`, fundo `color-mix(in oklch, var(--warn) 10%, var(--s2))`.
- Textarea do Adicionar: 3 linhas, raio 16, texto 17/1.45, `resize: none`.

## Botões (shadcn Button, novas variantes)
| Variante | Fundo | Texto | Borda | Hover | Pressionado | Desabilitado |
|---|---|---|---|---|---|---|
| `primario` (1 por tela) | `--acc` | `--on-acc` 700 | – | `filter: brightness(1.08)` | `scale(.97)` + `brightness(.92)` | fundo `--s3`, texto `--t3`, `cursor: not-allowed` |
| `secundario` | `--s2` | `--t1` 600 | 1px `--line-strong` | fundo `--s3` | `scale(.97)` | fundo transparente, borda `--line`, texto `--t3` |
| `fantasma` | transparente | `--acc-ink` 600 | – | fundo `--acc-a10` (DS usa 12%) | fundo 20% + `scale(.97)` | texto `--t3`, opacidade .7 |
| `perigo` (Excluir) | transparente | `--err` 600 | 1px `color-mix(in oklch, var(--err) 45%, transparent)` | – | `scale(.97)` | – |
| `branco` (landing) | `--cta-bg` | `--cta-fg` 700 | – | fundo `--cta-bg-hover` | `scale(.97)` | – |
| `vidro` (landing) | `oklch(0.20 0.03 255 / 0.55)` + blur 12 | `--t1` 600 | 1px `--line-strong` | fundo `oklch(0.26 0.035 255 / 0.8)`, borda `oklch(0.97 0.02 255 / 0.3)` | `scale(.97)` | – |

Tamanhos: `cta` 56 (raio 16, texto 17) · `md` 52 (raio 16) · `default` 48 (raio 14, texto 16) · `sm` 44 (raio 12, texto 15) · `landing` 58 (raio 999, padding 0 32, texto 18).

**Carregando:** mantém a largura, mostra spinner 16px (`border: 2px solid currentColor; border-right-color: transparent; animation: spin .8s linear infinite`) + texto no gerúndio ("Salvando", "Enviando", "Aguarde"). `aria-busy="true"` e bloqueia clique duplo.
**Erro:** botões não têm estado de erro próprio; o erro aparece no campo ou num banner (EstadoErro).

## ProximoPasso
Cartão-botão no painel que diz **uma** coisa a fazer. Escolha pela primeira regra verdadeira:

| # | Condição | Selo | Título | Subtítulo | Ação | Cor |
|---|---|---|---|---|---|---|
| 1 | sem lançamentos | `+` | Mande seu primeiro lançamento | Uma foto de recibo já basta. Toque aqui ou em Adicionar. | → `/adicionar` | acento |
| 2 | Fio estourou | `!` | Veja o que fazer agora | Passou do teto. Tem caminho, e a gente explica. | → `/chat` e pergunta "E se eu passar do limite?" | `--err` |
| 3 | Fio ≥ 80% | `!` | Veja o que fazer com 80% | Entenda o que acontece se passar do teto. | igual ao 2 | `--warn` |
| 4 | rascunhos pendentes (N) | `N` | Confira 1 rascunho / Confira N rascunhos | A IA já leu. Falta só você conferir. | → `/conferir` do mais antigo | acento |
| 5 | caso contrário | `20` | Seu DAS vence em N dias | Valor e código de pagamento ficam prontos aqui. | abre sheet "O que é o DAS?" | `--ok` |

Visual: altura mín. 72, raio 20, padding 14 16. Fundo `color-mix(in oklch, <cor> 11%, var(--s1))` (acento: `--acc-a10`), borda `color-mix(in oklch, <cor> 45%, transparent)` (acento: `--acc-a40`). Selo 36×36, raio 12, fundo `<cor>`, texto `--on-acc` Manrope 800/16. Rótulo "Próximo passo" 14/600 `--t3`. Seta "›" 22px `--t3`. É um `<button>` (ou `<Link>` quando navega).

## ChipFonte (fonte legal)
```ts
interface ChipFonteProps { rotulo: string; resumo: string; url: string; consultadoEm: string /* ISO, obrigatório */ }
```
- Botão pílula: altura 44, raio 12, fundo `--s2`, borda `--line-strong`, texto 14/600, ponto 6px `--acc` à esquerda, "↗" `--t3` à direita. Hover `--s3`.
- Toque abre **bottom sheet** (shadcn Sheet `side="bottom"`): kicker "FONTE LEGAL", título = rótulo, resumo, aviso "Resumo em linguagem simples. O texto oficial é o que vale.", botão "Abrir texto oficial ↗" (`target="_blank" rel="noopener"`), "Fechar".
- **Regra:** sem `url` + `consultadoEm` válidos, o chip **não renderiza** em produção. Mostre a data no sheet: "Consultado em DD/MM/AAAA".
- Na landing o chip expande inline (sem sheet) com "Trata do desenquadramento do MEI. O texto oficial é o que vale. Abrir no Planalto ↗".

## Cartões de vidro
| Variante | Fundo | Borda | Sombra | Raio | Onde |
|---|---|---|---|---|---|
| `painel` (app) | `radial-gradient(380px circle at var(--x,25%) var(--y,0%), var(--spot), transparent 62%), var(--panel)` + `backdrop-filter: blur(18px)` | 1px `--line-strong` | `--shadow-panel` | 26 | Herói do Fio |
| `solido` (app) | `--card-solid` | 1px `--line` | – | 20 | DAS, listas, opções |
| `landing` | `radial-gradient(360px circle at var(--x,50%) var(--y,0%), oklch(0.78 0.12 240 / 0.12), transparent 62%), linear-gradient(180deg, var(--glass-top), var(--glass-bottom))` + `blur(18px) saturate(1.2)` | 1px `--glass-line` | `--shadow-glass` | 24 (cartão), 26 (IA), 40 (CTA), 999 (pílula) | Toda a landing |

- **Spotlight:** no `pointermove`, grave `--x`/`--y` (px relativos ao cartão) com `el.style.setProperty`. Sem setState. Só com `pointer: fine`.
- **Tilt (só landing e herói do painel):** `perspective(1000px) rotateX((0.5 − y/h)·7deg) rotateY((x/w − 0.5)·9deg)`, transição 250ms ease-cc; volta a zero no `pointerleave`. Desligado em toque, modo leve e reduced motion.
- Grão: camada `svg/textura-grao.svg` por cima do fundo da página (não por cartão).

## Chips de estado e etiquetas
- **StatusPill:** altura 30–36, raio 999, padding 0 12, texto 14/700 na cor do status, fundo `color-mix(in oklch, <cor> 16%, transparent)`, ponto 8px. Textos: "Com folga", "Atenção", "Estourou", "Começando". Landing usa "Atenção · passou de 80%" e "Estourou o teto".
- **Etiqueta "exemplo":** 14/600 `--t3`, borda 1px tracejada `--line-strong`, raio 8, padding 2–3 8. Obrigatória em todo bloco com dado fictício.
- **Faixa demo:** topo do app, altura 30, raio 10, fundo listrado `repeating-linear-gradient(135deg, oklch(0.245 0.035 255) 0 9px, oklch(0.28 0.04 255) 9px 18px)`, borda `--line-strong`, ponto `--warn`, texto "Modo demonstração · dados de exemplo". Só aparece na conta demo.
- **Chip de categoria (ToggleGroup single):** altura 44, raio 12. Selecionado: borda `--acc`, fundo `--acc-a14`, texto `--acc-ink`. Opções: Serviço, Venda, Material, Outro.
- **Sugestão do chat:** pílula 44, raio 999, borda `--line-strong`, fundo transparente, 14/600.

## Skeleton (shadcn Skeleton)
- Fundo `--s3`, animação `opacity .45 → 1 → .45`, **1.4s ease-in-out infinite**, atraso escalonado 0 / .15 / .3 / .45s.
- Painel: cartão (linha 14px a 40%, bloco 52px a 78%, trilho 4px a 100%, linha 14px a 55%) + bloco 96px + bloco 170px + texto "Carregando seu painel…" 14 `--t3`.
- Contêiner com `aria-busy="true"` e o texto visível serve de anúncio.

## EstadoErro
```ts
interface EstadoErroProps { tipo: "503" | "429" | "rede" }
```
- **503 · IA fora do ar** (tela cheia em /adicionar): Fio âmbar tracejado (`svg/fio-ia-falhou.svg`), código "IA fora do ar · 503" (Manrope 14/600 `--warn`), título "A IA não respondeu agora", corpo "Pode ser instabilidade do serviço. Você não perde nada: preencha na mão ou tente de novo em alguns minutos.", caixa ✓ "Sua foto ficou guardada neste aparelho". Botões: primário "Preencher manualmente" → `/conferir` manual; secundário "Tentar de novo" → reenvia a leitura.
- **429 · Limite diário da IA:** código "Limite diário da IA · 429", título "Você usou todas as leituras de hoje", corpo "O limite volta amanhã, à meia-noite. Enquanto isso, o app segue funcionando com preenchimento manual." (horário **PENDENTE**), caixa ✓ "Limite e DAS continuam sendo calculados normalmente". Botões: "Preencher manualmente" / "Voltar ao painel".
- **Rede (banner no topo do painel):** fundo `color-mix(in oklch, var(--err) 13%, var(--s1))`, borda `color-mix(in oklch, var(--err) 55%, transparent)`, raio 16. Título "Sem internet" (15/700 `--err`), texto "Mostrando o último painel salvo, de HH:MM." Botão secundário pequeno "Tentar de novo". Sucesso → toast "Conectado de novo · Painel atualizado agora".
- `role="alert"` no banner; na tela cheia, foco vai para o título ao montar.

## EstadoVazio
- Painel sem dados: Fio com trilho tracejado e status "Começando", texto "Assim que entrar o primeiro valor, o fio começa a andar.", ProximoPasso regra 1, esconde DAS e lista.
- Bloco genérico (DS): borda 1px tracejada `--line-strong`, raio 20, `svg/fio-vazio.svg`, título "Seu fio começa no primeiro lançamento", texto "Mande uma foto, um áudio ou escreva.", botão secundário "Adicionar lançamento".
- Lista filtrada vazia: "Nada por aqui com esse filtro." (borda tracejada, centralizado).

## Toast (shadcn Sonner, estilo próprio)
- Posição: acima da tab bar (painel: 180px do fundo; outras abas: 106px; telas sem tab bar: 120px). Laterais 16px.
- Fundo `--s3`, borda `--line-strong`, raio 18, `--shadow-toast`. Ícone 24px redondo: ✓ `--ok` / − `--err` / · `--t3`. Título 15/700, sub 14 `--t2`. Ação "Desfazer" fantasma.
- Some em **5000ms**. `aria-live="polite"`. "Desfazer" restaura o estado anterior completo (lista, total, pendentes).

## Nav da landing
- Pílula fixa: `top: 14px`, centralizada, `width: min(1180px, 100% − 24px)`, padding 8 8 8 18, raio 999.
- Topo da página: transparente. Após `scrollY > 40`: fundo `oklch(0.18 0.03 255 / 0.62)`, borda `oklch(0.97 0.02 255 / 0.16)`, `--shadow-nav-top`, blur 20 saturate 1.3. Implemente com uma camada `::before` que só anima **opacity** (400ms ease-cc).
- ≥1280: logo + links (Como funciona `#como`, O limite `#recursos`, Segurança `#seguranca`, Perguntas `#perguntas`) + "Entrar" (fantasma) + "Comece agora" (branco, 44px).
- <1280: logo + botão "Menu"/"Fechar". Menu: painel em `top: 82px`, laterais 12, raio 20, fundo `oklch(0.20 0.03 255 / 0.94)` + blur 20; links 52px; "Entrar" (secundário) e "Comece agora" (primário) lado a lado. Fecha ao tocar num link. `aria-expanded` no botão; Esc fecha.

## Tab bar (app)
- Fixa: laterais 12, fundo 14, padding 6, raio 26, borda `--line-strong`, fundo `oklch(0.20 0.03 255 / 0.78)` + blur 20, `--shadow-nav`.
- 4 itens iguais: Painel, Lançamentos, Chat, Perfil (ícones em `svg/icone-*.svg`, 24px). Altura 58, raio 20, texto 14/700, gap 4.
- Ativo: fundo `--acc-a16`, cor `--acc-ink`. Inativo: transparente, `--t2`.
- `<nav aria-label="Principal">` com `<Link>`; ativo com `aria-current="page"`.
- Aparece só em /painel, /lancamentos, /calendario, /chat, /perfil.

## Outros do app
- **FAB Adicionar:** direita 20, fundo 108 (acima da tab bar), altura 58, padding 0 24 0 18, raio 20, `--acc`, texto 17/700, ícone "+" 16px, `--shadow-fab`. Pressionado `scale(.96)`. Só no painel.
- **Stepper do onboarding:** 3 barras 4px, raio 2, gap 6; feitas `--acc`, pendentes `--track`. Texto "Passo N de 3" 14/600 `--t3`. "Voltar" fantasma à direita (passos 2 e 3).
- **Opção de atividade (RadioGroup):** altura mín. 64, raio 16. Selecionada: borda `--acc`, fundo `--acc-a10`, rádio com miolo `--acc`. Nome 16/600, "CNAE 9602-5/01" Manrope 14/500 `--t3`.
- **Segmentado (ToggleGroup):** contêiner `--s2` (filtros: `--s1`), padding 4, raio 14; item ativo `--s3`/`--t1`, inativo transparente/`--t3`, raio 10, texto 15/700.
- **Switch (IA, Modo leve):** trilho 52×30 (landing 40×24), raio total; ligado `--acc`, desligado `--s3`; bolinha 24px `--t1`, desliza 22px em 250ms ease-cc (só transform). Área de toque 56×44. `role="switch"` + `aria-checked`.
- **Bottom sheet:** scrim `--scrim`, painel `--s1`, raio 30 30 0 0, borda superior `--line-strong`, alça 40×5. Fecha tocando fora, em "Fechar" e com Esc. Foco preso dentro.
- **Tour guiado (3 dicas, 1ª vez no painel):** recorte com `box-shadow: 0 0 0 2px var(--acc), 0 0 0 9999px oklch(0.08 0.02 255 / 0.68), 0 0 40px 4px oklch(0.78 0.12 240 / 0.5)` sobre o alvo (posição medida no DOM, não fixa). Cartão `--s3`, raio 22, `--shadow-tour`. "Dica N de 3", 3 tracinhos, título, corpo, "Pular dicas" / "Próxima dica" (última: "Começar a usar"). Mover o recorte com **transform** (não left/top/width).
- **Item de lançamento:** botão de linha 64px: dia (Manrope 18/800) + mês (14/600 `--t3`), nome (15/600, reticências) + categoria (14 `--t3`), valor à direita. Toque expande "Editar" (secundário) e "Excluir" (perigo). `aria-expanded`.
- **Calendário:** grade 7 colunas (D S T Q Q S S), célula 44px, dia 38×38 raio 12. Hoje: anel interno 1.5px `--line-strong`. Selecionado: fundo `--acc`, texto `--on-acc`. Dia futuro: `--t3`. Ponto 4px `--acc` em dias com lançamento. Recolhido mostra só a semana de hoje (ou do dia selecionado); "Ver mês"/"Recolher". Selecionar dia filtra a lista e mostra chip "Dia N · limpar filtro ✕".
- **Balões do chat:** usuário à direita (fundo `--acc-a16`, borda `--acc-a35`, raio 20 20 6 20); assistente à esquerda (fundo `--s1`, borda `--line`, raio 20 20 20 6), com Fio mini quando o tema é limite. "Digitando": 3 pontos 7px pulsando (1s, atrasos 0/.15/.3s). Lista com `aria-live="polite"`.
