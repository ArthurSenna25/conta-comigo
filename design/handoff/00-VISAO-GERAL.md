# 00 · Visão geral

**Produto:** assistente de papelada para MEI. O usuário manda foto, áudio, print ou texto; a IA monta um **rascunho**; o usuário confere e confirma; o **Fio do Limite** mostra quanto falta para o teto anual do MEI. A IA nunca calcula imposto: limite e DAS são calculados pelo código.

**Regra de ouro:** nada é salvo sem o usuário confirmar.

## Arquivos-fonte (pasta `prototipos/`)
| Sigla | Arquivo | O que tem |
|---|---|---|
| APP | `conta-comigo-app.dc.html` | Todas as telas do app em 390×844. Troque a tela pelo prop `start` (Tweaks) ou pelo "Laboratório de estados" no Perfil. |
| DS | `conta-comigo-design-system.dc.html` | Tokens, botões em todos os estados, campos, Fio, vidro, chip legal, toast, vazio, esqueleto, tab bar. Use "Só B" + "Escuro". |
| LAND | `conta-comigo-landing.dc.html` | Landing completa, autenticação (modal no protótipo) e demo. |

## Mapa de rotas
| Rota | Fonte | Valor de `start` no APP | Observação |
|---|---|---|---|
| `/` | LAND | – | Landing |
| `/entrar` | LAND, modal "Entrar" + "Recuperar senha" | – | No protótipo é modal; no Next vira página |
| `/cadastrar` | LAND, modal "Criar sua conta" | – | Ao enviar → `/onboarding` |
| `/onboarding` | APP | `onb1`, `onb2` | Passos 1 e 2 de 3 |
| `/consentimento` | APP | `onb3` | Passo 3 de 3 (uso de IA). Ao terminar → `/painel` com tour |
| `/painel` | APP | `painel`, `vazio`, `carregando`, `erro-rede`, `painel-80`, `painel-over` | Tab 1 |
| `/adicionar` | APP | `adicionar`, `gravando`, `lendo`, `ia-off`, `ia-429` | Gravando, Lendo e erros de IA são **estados** desta rota, não rotas |
| `/conferir` | APP | `conferir`, `manual` | Rascunho da IA, lançamento manual ou edição |
| `/lancamentos` | APP | `lancamentos` | Tab 2 |
| `/calendario` | APP | `lancamentos` com "Ver mês" aberto | No protótipo o calendário fica **dentro** de Lançamentos (ver ambiguidades) |
| `/chat` | APP | `chat` | Tab 3 |
| `/perfil` | APP | `perfil` | Tab 4 (não estava na lista pedida, mas existe) |
| `/legal/termos` | – | – | **PENDENTE**: não existe texto |
| `/legal/privacidade` | – | – | **PENDENTE**: não existe texto |

## Telas do app (3 linhas cada)
- **Onboarding 1 · Atividade:** escolhe a atividade (CNAE) numa lista com busca. "Continuar" só libera depois de escolher. Link "O que é CNAE?" abre explicação.
- **Onboarding 2 · Faturamento:** digita quanto já faturou no ano. Um Fio ao vivo mostra % do teto. Pode pular com "Ainda não faturei nada".
- **Consentimento · IA:** explica em 3 itens o que a IA faz. "Aceitar e começar" ou "Recusar e preencher na mão". O app funciona igual sem IA.
- **Painel:** Fio do Limite grande, alerta de 80% ou de estouro, "Próximo passo", próximo DAS e 3 últimos lançamentos. Botão flutuante "Adicionar". Primeiro acesso mostra tour de 3 dicas.
- **Adicionar:** 4 entradas (Foto, Áudio, Print, Escrever) e campo de texto livre. "Enviar para a IA" ou "Preencher na mão".
- **Gravando (estado):** cronômetro, ondas de áudio, "Cancelar" e "Parar e enviar".
- **Lendo (estado):** checklist do progresso da leitura da IA. Saída: "Prefiro preencher na mão".
- **IA indisponível 503 / Limite diário 429 (estado):** explica o problema, garante que nada foi perdido, oferece preenchimento manual.
- **Conferir:** formulário do rascunho (valor, descrição, data, tipo, categoria). Campos duvidosos em âmbar. "Confirmar lançamento" salva e anima o Fio.
- **Lançamentos:** filtro Todos/Entradas/Saídas, calendário da semana (expande para o mês), lista agrupada por mês com Editar/Excluir.
- **Chat:** perguntas sobre MEI com respostas curtas e chips de fonte legal que abrem um resumo + link oficial.
- **Perfil:** nome, atividade, chave "Usar IA para ler", "Refazer o cadastro", "Apagar todos os meus dados".

## Seções da landing (3 linhas cada)
- **Abertura:** uma linha se desenha e o nome aparece (1,95 s, uma vez por sessão). Botão "Pular abertura".
- **Nav:** pílula fixa no topo; vira vidro após 40 px de rolagem. No celular vira botão "Menu".
- **Hero:** título grande, subtítulo, 2 CTAs, 3 garantias, celular com o Painel e 2 cartões flutuantes (desktop).
- **Siga o Fio:** seção fixa (sticky) onde o scroll troca 4 passos: foto → IA lê → você confere → fio anda. Texto e celular sincronizados.
- **O limite:** odômetro de R$ 0 a R$ 84.240,00 com barras mês a mês; o Fio muda verde → âmbar → vermelho.
- **A IA só rascunha:** quem faz o quê (IA, código, você) e um cartão de rascunho que se "preenche" ao entrar na tela.
- **Chat com fonte:** exemplo de pergunta e resposta com chip legal que expande.
- **Segurança:** 3 cartões de vidro sobre privacidade.
- **Perguntas:** acordeão com 6 perguntas.
- **CTA final:** linha vertical que se desenha + cartão grande com 2 botões.
- **Rodapé:** aviso legal, Termos, Privacidade, chave "Modo leve".
