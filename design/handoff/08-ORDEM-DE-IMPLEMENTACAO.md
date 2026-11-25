# 08 · Ordem de implementação

Faça na ordem. Cada etapa só depende das anteriores.

## 1. Base (meio dia)
1. `create-next-app` (Next 16, App Router, TS, Tailwind v4) → `npx shadcn@latest init`.
2. Colar o bloco `globals.css` de **01**.
3. Fontes com `next/font` de **02**.
4. Página `/dev/tokens` mostrando cores, raios, sombras e tipografia lado a lado com `conta-comigo-design-system.dc.html` para conferir.

## 2. Primitivos (1 dia) · depende de 1
Na ordem: utilitário de moeda (centavos ↔ texto) → `Button` (variantes de 03) → `Input`/`Textarea` → `InputMoeda` → `Skeleton` → `StatusPill` + etiqueta "exemplo" → `Switch` → segmentado (`ToggleGroup`) → `Sheet` inferior → `Toast` (Sonner).

## 3. Componentes do produto (1–2 dias) · depende de 2
1. **`FioDoLimite`** (com testes unitários: 0%, 42%, 79,99%, 80%, 100%, 100,01%, 120%; escala 110%; textos).
2. `ValorMoeda` com contagem.
3. Cartões de vidro (`painel`, `solido`, `landing`) + spotlight.
4. `ProximoPasso` (testar as 5 regras de prioridade).
5. `ChipFonte` (não renderiza sem url + data).
6. `EstadoVazio`, `EstadoErro` (503, 429, rede).
7. `TabBar`, FAB, stepper, item de lançamento, calendário, balões do chat, tour.

## 4. Telas do app (3–5 dias) · depende de 3 e das fontes de dados
Ordem sugerida pelo fluxo principal:
1. Layout logado (fundo, tab bar, faixa demo).
2. `/painel` com todos os estados (carregando, vazio, rede, 80%, estourou).
3. `/adicionar` + estados Gravando, Lendo, 503, 429.
4. `/conferir` (IA, manual, edição) + toast com Desfazer.
5. `/lancamentos` + `/calendario`.
6. `/chat`.
7. `/perfil`.
8. `/entrar`, `/cadastrar`, recuperar senha.
9. `/onboarding`, `/consentimento`, tour no 1º painel.
10. `/legal/termos`, `/legal/privacidade` (stubs com aviso "PENDENTE" até haver texto).

Depende de dado real: painel, lançamentos, calendário, conferir, chat, perfil, onboarding (lista CNAE), leitura da IA. Pode começar com dados de exemplo de **07** atrás de uma flag de demo.

## 5. Landing (3–4 dias) · depende de 3 e de `/painel` (o celular do hero reusa o Painel)
1. Estática: todas as seções com texto, layout nos 3 breakpoints, nav, menu mobile, acordeão, rodapé. **Publicável assim.**
2. Fundo contínuo + SVG fallback + barra de progresso.
3. Siga o Fio (sticky + troca de passos).
4. O limite (odômetro, barras, Fio, cores).
5. Reveals e entrada do hero (GSAP + SplitText).
6. Modo leve + reduced motion (testar antes de seguir).
7. Extras desktop: parallax, flutuação, tilt/ímã, skew, Lenis.
8. Canvas Three.js por último.
9. Abertura.
Se faltar tempo, corte de baixo para cima (lista em **05**).

## 6. Fechamento
- Resolver PENDÊNCIAS de **07** (legal, DAS, Termos, Privacidade).
- Remover "Laboratório de estados" e qualquer dado de exemplo fora da conta demo.
- Medir orçamento de desempenho (05) com Lighthouse em celular.
- Revisar acessibilidade: foco visível, alvos 44px, `role="meter"` no Fio, `aria-live` em toast/chat/leitura.

## Mapa de dependências
```
tokens + fontes
  └─ primitivos (Button, Input, InputMoeda, Sheet, Toast…)
       └─ FioDoLimite, ValorMoeda, Vidro, ProximoPasso, ChipFonte, Estados
            ├─ telas do app ── precisam dos dados reais (ou demo)
            │    └─ Painel em modo demo
            └─ landing ───────────┘ (hero e Siga o Fio reusam telas do app)
                 └─ GSAP → Lenis → Three.js → abertura (opcionais, nessa ordem)
```
