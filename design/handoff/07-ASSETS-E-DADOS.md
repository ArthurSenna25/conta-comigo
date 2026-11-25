# 07 · Assets e dados

## Imagens e fontes
- **Nenhuma imagem raster** é usada. Placeholders listrados ("foto", "recibo.jpg") são CSS: `repeating-linear-gradient(135deg, var(--s2) 0 8px, var(--s3) 8px 16px)`.
- Sem logos de terceiros, depoimentos, números de uso ou preços.
- Fontes: Figtree e Manrope via `next/font/google` (02).

## SVGs exportados (`svg/`)
| Arquivo | Uso | Cor |
|---|---|---|
| `logo-marca.svg` | Marca 36×36 (nav usa 30px) | fixa (tokens) |
| `icone-painel.svg`, `icone-lancamentos.svg`, `icone-chat.svg`, `icone-perfil.svg` | Tab bar, 24px | `currentColor` |
| `icone-foto.svg`, `icone-audio.svg`, `icone-print.svg`, `icone-escrever.svg` | Adicionar, 30px | `currentColor` (usar `--acc-ink`) |
| `fio-limite-base.svg` | Referência geométrica do Fio (42%, verde) | fixa |
| `fio-mini.svg` | Fio pequeno do chat / chips / avisos | `currentColor` no traço |
| `fio-vazio.svg` | Estado vazio | fixa |
| `fio-ia-falhou.svg` | Telas 503/429 | fixa |
| `fio-fallback-landing.svg` | Fundo da landing sem WebGL | trocada por JS |
| `textura-grao.svg` | Grão sobre o fundo | branco, opacidade .08 (landing .07) |

Recomendação: transformar ícones em componentes React (`svgr` ou JSX direto). O Fio deve ser um componente (03), não arquivo estático.
Símbolos de texto usados como ícone: "›", "‹", "↗", "↑", "↓", "×", "✓", "+", "−". Manter como texto (com `aria-hidden` quando decorativo e `aria-label` no botão).

## Tudo que é "exemplo" (trocar por dado real ou manter só na conta demo)
**App**
- Nome "Ana" / "Ana · exemplo", avatar "A".
- Faturado R$ 34.020,00; após confirmar R$ 34.370,00; estados 80% = R$ 68.040,00; estourado = R$ 84.240,00.
- Projeções "perto de R$ X" (fórmula a confirmar).
- Próximo DAS R$ 81,90, "Vence em 20/12/2026 · referente a novembro", "em 26 dias", "Seu DAS vence em 26 dias".
- Rascunhos pendentes: 2.
- Lançamentos: Coloração · Juliana +180,00 (21/11) · Produtos de cabelo −245,90 (19/11) · Corte · Bruno +60,00 (18/11) · Escova progressiva · Lia +350,00 (14/11) · Aluguel da cadeira −400,00 (08/11) · Corte e barba · Rafael +85,00 (05/11) · Mechas · Carla +420,00 (30/10) · Tintas e oxidante −189,40 (22/10) · Corte · Pedro +60,00 (15/10).
- Rascunho da IA: R$ 350,00, "Escova progressiva · Maria", data "2?/11/2026", Entrada, Serviço, "Lido de uma foto", "Hoje, 14:32".
- Data padrão do manual "24/11/2026"; "hoje" no calendário = dia 24; mês "Novembro 2026".
- "Mostrando o último painel salvo, de 9:12."
- Cronômetro "0:07".
- Lista de atividades/CNAE (4 itens) e "Cabeleireiro(a) · MEI".
- Toasts com valores ("Faltam R$ 46.630,00 no fio").
- Sugestões e respostas do chat.

**Landing**
- Cartões flutuantes: R$ 34.020,00 · Faltam R$ 46.980,00 · R$ 81,90 · 20/12/2026.
- Odômetro e barras: 11 meses somando R$ 84.240,00; etiqueta "jan · R$ 5.200,00".
- Cartão IA: R$ 350,00, 2?/11/2026, Entrada, Serviço prestado, "recibo.jpg".
- Celulares com telas do app em modo demo.

**Design system**
- R$ 34.020,00, "fecha o ano perto de R$ 61.000,00", Fio 42% / 84% / 104%, R$ 350,00, 22/11/2026, R$ 1.234,56, "Faltam R$ 46.630,00".

## PENDÊNCIAS (não publicar sem resolver)
Regra: texto legal só entra com **fonte + data de consulta**. Até lá, fica marcado PENDENTE.

| # | Item | Onde aparece | O que falta |
|---|---|---|---|
| 1 | Teto anual R$ 81.000,00 — "LC 123/2006, art. 18-A, § 1º" | Fio, painel, chat, landing, DS | Conferir texto vigente + data de consulta |
| 2 | Limite proporcional R$ 6.750,00/mês no 1º ano — "§ 2º" | Chat, DS | Conferir + data |
| 3 | **Chip do § 7º**: excesso até 20% (R$ 97.200,00) segue MEI até dezembro, excesso tributado à parte, vira ME em janeiro; acima de 20% "a mudança volta para o começo do ano" | Chat (app e landing), alerta de estouro, FAQ 1 | Conferir **parágrafo correto** (o protótipo cita § 7º), redação e data. Ramo "acima de 20%" não tem tela |
| 4 | "Resolução CGSN 140/2018": DAS vence dia 20 do mês seguinte | Chat, sheet "O que é o DAS?", Próximo passo | Conferir artigo + link direto (hoje aponta para a home do Simples Nacional) + data |
| 5 | **Valores de DAS** (R$ 81,90 é exemplo) | Painel, landing | Tabela oficial por atividade e ano, fonte e data; regra de cálculo no código |
| 6 | Explicação "DAS junta INSS e o imposto da sua atividade" | Sheet DAS | Fonte |
| 7 | Lista de CNAE permitidos ao MEI | Onboarding 1 | Fonte oficial da tabela |
| 8 | Projeção anual (fórmula) | Painel | Decisão de produto |
| 9 | **Termos de uso** | `/legal/termos`, cadastro, rodapé (`#termos`) | Texto completo + data de vigência |
| 10 | **Política de Privacidade** | `/legal/privacidade`, cadastro, rodapé (`#privacidade`) | Texto completo (LGPD) + data |
| 11 | Limite diário da IA "volta à meia-noite" | Tela 429 | Regra real e fuso |
| 12 | "Apagar todos os meus dados" | Perfil | Fluxo, confirmação e textos |
| 13 | Rodapé "Projeto de hackathon…" | Landing | Texto final |
| 14 | Mensagens de erro de autenticação do servidor, microfone negado, erro de envio no chat | Entrar/Cadastrar, Gravando, Chat | Textos |
| 15 | Rota/sessão da conta demo | Landing, auth | Decisão técnica |
