# Conta Comigo · Pacote de handoff

Alvo: **Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui**. Tema único: **Azul-noite escuro**.

## Leia isto primeiro
- Os arquivos em `prototipos/` são **referência visual e de comportamento**. Não copie o código deles.
- `support.js` e o React UMD são só para abrir os protótipos no navegador. **Não vão para o projeto.**
- Tudo marcado **exemplo** é dado fictício. Tudo marcado **PENDENTE** precisa de fonte ou decisão antes de publicar.
- Fidelidade: **alta**. Cores, tamanhos, textos e tempos são finais, exceto onde marcado.

## Ordem de leitura
1. `00-VISAO-GERAL.md` · telas, rotas, arquivo-fonte de cada uma
2. `01-TOKENS.md` · cores OKLCH, raios, sombras, espaçamento, z-index, breakpoints, CSS pronto
3. `02-TIPOGRAFIA.md` · Figtree + Manrope com next/font
4. `03-COMPONENTES.md` · cada componente, props, estados, acessibilidade
5. `04-TELAS-APP.md` · app logado, tela por tela
6. `05-LANDING.md` · landing, seção por seção, movimento e desempenho
7. `06-MOVIMENTO.md` · tabela única de easings e durações
8. `07-ASSETS-E-DADOS.md` · SVGs, lista de "exemplo", PENDÊNCIAS
9. `08-ORDEM-DE-IMPLEMENTACAO.md` · o que fazer primeiro

## Pastas
- `prototipos/` · `conta-comigo-app.dc.html`, `conta-comigo-design-system.dc.html`, `conta-comigo-landing.dc.html` (+ `support.js` e `fio3d.js` só para abrir localmente; sirva a pasta com um servidor estático, ex.: `npx serve prototipos`)
- `svg/` · ícones e desenhos do Fio exportados
