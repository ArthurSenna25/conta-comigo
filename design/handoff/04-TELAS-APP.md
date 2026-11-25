# 04 · Telas do app (logado)

Fonte: `prototipos/conta-comigo-app.dc.html`. Largura de referência 390px; telas são fluidas até ~480px e centralizadas acima disso.

Legenda: **[REAL]** precisa de dado do backend · **[EXEMPLO]** dado fictício do protótipo, trocar pelo real · **[SÓ VISUAL]** não implementar.

## Fora do escopo (só existem no protótipo)
- Barra de status "9:41", bateria, indicador home e moldura de celular com raio 44 → **[SÓ VISUAL]**.
- "Laboratório de estados · demo" no Perfil → **não vai para produção** (pode virar página `/dev` só em desenvolvimento).
- Atrasos simulados (Lendo 2200ms, Carregando 1800ms, chat 1100ms) → substituir pelo tempo real da resposta.
- Respostas do chat por palavra-chave (regex) → **[SÓ VISUAL]**; em produção vem do serviço de chat.

## Estrutura comum
- Fundo app (01) + grão. Faixa demo só na conta demo (topo, 12px das laterais).
- Telas com rolagem: conteúdo `padding: 18px 20px`, espaço inferior para tab bar (120px) ou FAB+tab bar (190px no painel).
- Telas de fluxo (onboarding, adicionar, conferir, erros): coluna com conteúdo rolável em cima e **rodapé de ação fixo** (`padding: 12px 20px 34px`).
- Transição entre telas: conteúdo entra de `translateY(14px)` + `opacity .4` para 0/1 em 320ms ease-cc.

---

## /onboarding · Passo 1 de 3 (Atividade)
Dados: **lista de atividades permitidas ao MEI com CNAE** [REAL]; **busca** nessa lista [REAL].
Blocos:
1. Stepper (1 de 3).
2. Título "O que você faz como MEI?"
3. Corpo "Com isso a gente sabe quais impostos e limites valem para você."
4. Link fantasma "O que é CNAE?" → sheet: kicker "EM LINGUAGEM SIMPLES", título "O que é CNAE?", texto "É o código da sua atividade, tipo um “RG” do que você faz. Ele define se você pode ser MEI e quanto paga no DAS. Está no seu Certificado MEI."
5. Campo de busca, placeholder "Buscar atividade ou CNAE" (no protótipo é estático; implementar filtro).
6. Lista de opções (RadioGroup). [EXEMPLO]: Cabeleireiro(a) 9602-5/01 · Manicure e pedicure 9602-5/02 · Confeiteiro(a) 1091-1/02 · Eletricista 4321-5/00.
Rodapé: primário "Continuar" — desabilitado até escolher → passo 2.
Estados: carregando lista = 4 skeletons de 64px; erro = banner rede; busca sem resultado = "Nada por aqui com esse filtro." (mesmo texto do vazio da lista).

## /onboarding · Passo 2 de 3 (Faturamento)
Dados: grava **faturamento inicial do ano** [REAL].
1. Stepper (2 de 3) + "Voltar" → passo 1.
2. Título "Quanto você já faturou em 2026?" (ano = ano corrente).
3. Corpo "Pode ser aproximado. Você ajusta depois, lançamento por lançamento."
4. InputMoeda xl, com foco ao abrir. [EXEMPLO] valor inicial 34.020,00 → em produção começa vazio (0,00).
5. Cartão sólido "Seu fio, por enquanto" + "N% do teto" + FioDoLimite variante onboarding (atualiza ao digitar, 400ms) + "Faltam R$ X para o teto" / "Passou R$ X do teto".
Rodapé: primário "Continuar" → passo 3; fantasma "Ainda não faturei nada" → zera e vai ao passo 3.

## /consentimento · Passo 3 de 3 (IA)
Dados: grava **preferência de uso de IA** (sim/não) e data do aceite [REAL].
1. Stepper (3 de 3) + "Voltar".
2. Título "Posso usar IA para ler o que você mandar?"
3. Cartão sólido com 3 itens numerados (selo 28px, fundo `--acc-a16`):
   - "A IA lê e monta um rascunho" — "Foto de recibo, áudio, print de Pix ou texto viram um lançamento para você conferir."
   - "Nada é salvo sem você" — "Você confirma cada lançamento. Limite e DAS são calculados pelo app, não pela IA."
   - "Seus dados são seus" — "Você apaga tudo quando quiser, no Perfil."
4. Texto "Se recusar, o app funciona igual, só que você preenche os lançamentos na mão."
Rodapé: primário "Aceitar e começar"; secundário "Recusar e preencher na mão". Os dois → `/painel` com tour (só na 1ª vez).

## /painel
Dados: **dados do painel (dashboard)** [REAL] = faturado no ano, limite, status do Fio, projeção do ano, próximo DAS (valor, vencimento, competência, dias restantes), quantidade de rascunhos pendentes, 3 últimos lançamentos, horário da última atualização.
1. Cabeçalho: "Olá, {primeiro nome}" (15 `--t2`) + "Seu ano até aqui" (24/800). Avatar 44px com inicial → `/perfil`. [EXEMPLO] "Ana".
2. Banner "Sem internet" (só se offline; usa último painel salvo).
3. Cartão-herói (vidro painel, com tilt+spotlight em `pointer: fine`): "Faturado em 2026" + etiqueta exemplo (só demo) · ValorMoeda hero contando · "de R$ 81.000,00 · teto anual do MEI" · FioDoLimite hero · StatusPill + "Faltam R$ X" · projeção:
   - folga: "No ritmo atual, você fecha 2026 perto de R$ X. Cabe no MEI com folga."
   - atenção: "No ritmo atual, você fecha 2026 perto de R$ X. Cabe, mas com pouca folga."
   - estourou: "Calma: tem caminho. Veja abaixo o que fazer agora."
   - vazio: "Assim que entrar o primeiro valor, o fio começa a andar."
   - Fórmula do protótipo: `faturado × diasDoAno ÷ diaDoAnoAtual`, arredondado a R$ 100. **PENDENTE** confirmar regra.
4. Alerta 80% (só atenção): fundo `color-mix(in oklch, var(--warn) 11%, var(--s1))`, borda warn 50%, raio 18. "Você passou de 80% do teto" / "Ainda cabe no MEI. Vale segurar notas grandes até janeiro, se der."
5. Alerta estouro (só estourou): fundo err 12%, borda err 55%. Título "Você passou do teto. O que fazer:" e 3 itens numerados: "Como passou menos de 20%, você segue MEI até dezembro." · "O valor acima do teto paga imposto em guia própria." · "Em janeiro você vira microempresa. Fale com um contador antes." Botão chip "Ver a regra no chat" → `/chat` perguntando "E se eu passar do limite?". **PENDENTE fonte** (ver 07) e ramo "acima de 20%" não desenhado.
6. ProximoPasso (regras em 03).
7. Cartão DAS (escondido se vazio): "Próximo DAS" + botão "?" (44px) → sheet "O que é o DAS?" ("É a guia mensal que o MEI paga. Um valor fixo que já junta INSS e o imposto da sua atividade. Vence todo dia 20."); selo "em N dias" (`--s3`); valor Manrope 26/800; "Vence em DD/MM/AAAA · referente a {mês}". [EXEMPLO] R$ 81,90, 20/12/2026, novembro, 26 dias.
8. "Últimos lançamentos" + "Ver todos" → `/lancamentos`; 3 linhas (nome, "Categoria · DD/MM", valor com sinal).
9. FAB "Adicionar" → `/adicionar`.
Estados: carregando = skeleton (03); vazio = EstadoVazio do painel; erro rede = banner + dados em cache; sucesso após confirmar = Fio anima do valor antigo ao novo + toast.

## /adicionar
Dados: envio de **foto, print, áudio ou texto** para leitura pela IA [REAL]; preferência de IA do usuário [REAL].
1. Título "O que entrou ou saiu?" · corpo "Mande do jeito mais fácil. A IA monta um rascunho e você confere."
2. Grade 4 colunas, botões `aspect-ratio: .82`, raio 20, fundo `--card-solid`, borda `--line-strong`, ícone 30px `--acc-ink` + rótulo 15/600: **Foto** (abre câmera/galeria `accept="image/*" capture="environment"`), **Áudio** (estado Gravando), **Print** (galeria), **Escrever** (foca a textarea).
3. Textarea "Ou escreva do seu jeito", placeholder "recebi 120 do corte da Maria hoje".
4. Nota com Fio mini: "A IA só rascunha. Quem calcula limite e DAS é o app, e nada entra sem você confirmar."
Rodapé: primário "Enviar para a IA" (libera com > 2 caracteres) → estado Lendo; "Cancelar" (fantasma `--t2`) → `/painel`; "Preencher na mão" (fantasma) → `/conferir` manual.
Se IA desligada: Foto/Print levam ao estado 503 no protótipo — **em produção** devem ir direto ao manual com aviso (ver ambiguidades).

### Estado Gravando
"Gravando" (ponto `--err` pulsando 1s) · cronômetro "0:07" Manrope 64 · 30 barras de onda (5px, `--acc`, `scaleY` .22↔1, 700–1200ms) · dica "Fale o valor, o que foi e de quem. Ex.: “recebi 350 de uma escova progressiva”."
Rodapé (1 : 1.6): secundário "Cancelar" → volta ao Adicionar; primário "Parar e enviar" (ícone quadrado) → Lendo.
Precisa de permissão de microfone; se negada → mensagem e opção "Preencher na mão" (**texto PENDENTE**).

### Estado Lendo
Dados: **status da leitura** [REAL].
Título por origem: "Lendo sua foto…" / "Lendo seu print…" / "Ouvindo seu áudio…" / "Lendo o que você escreveu…" · "Isso leva poucos segundos. Nada foi salvo ainda." · cartão skeleton com faixa de brilho (`translateX` −100%→250%, 1.6s) · checklist: ✓ "Recebido" · spinner "Procurando valor, data e tipo" · círculo tracejado "Montando o rascunho para você conferir" · fantasma "Prefiro preencher na mão".
Fim: sucesso → `/conferir` com o rascunho; 503/429 → EstadoErro.

## /conferir
Dados: **um rascunho** gerado pela IA (campos + quais estão em dúvida + origem + horário) **ou** um lançamento existente (edição) [REAL]. Ao confirmar, grava o lançamento e recebe o novo total do ano [REAL].
Título por modo: "Conferir rascunho" (IA) · "Novo lançamento" (manual) · "Editar lançamento" (edição). Botão "‹" (44px) volta (edição → `/lancamentos`; outros → `/painel`).
1. (só IA) Miniatura 64px + "Lido de uma foto" + "Hoje, 14:32 · toque para ver o original" [EXEMPLO]. Ação de abrir o original **PENDENTE**.
2. Valor: InputMoeda lg.
3. Descrição: placeholder "Ex.: Corte · Maria".
4. Data (Manrope 16/600) + Tipo (segmentado Entrada/Saída), lado a lado.
5. Se data duvidosa: campo em âmbar "Data · confira" + aviso "A data estava cortada na foto. Confira." com botão "Está certa" (limpa a dúvida). Editar a data também limpa.
6. Categoria: Serviço · Venda · Material · Outro.
Rodapé fixo (fundo `oklch(0.16 0.025 255 / 0.85)` + blur 12, borda superior `--line`):
- Nota: IA "Nada foi salvo ainda. Só entra no fio quando você confirmar." · manual "Preenchido por você. Salva quando confirmar." · edição "A alteração só vale quando você confirmar."
- Grade 1 : 1.5: fantasma "Descartar rascunho" / "Cancelar edição"; primário "Confirmar lançamento".
Comportamento:
- Confirmar com valor 0 → erro no campo "Digite um valor maior que zero"; não sai da tela.
- Confirmar OK → `/painel` (edição → `/lancamentos`), Fio anima, toast "Lançamento salvo" (ou "Lançamento atualizado") com sub "Faltam R$ X no fio" / "Passou R$ X do teto" e "Desfazer".
- Descartar → `/painel` + toast "Rascunho descartado · Nada foi salvo".
- Só "Entrada" soma ao Fio. Saída não altera o faturamento.

## /lancamentos (e /calendario)
Dados: **lista de lançamentos** com filtro por tipo e por dia/mês [REAL]; **dias do mês com lançamento** [REAL]; total de entradas por mês [REAL].
1. "Lançamentos" (28/800) + etiqueta exemplo (só demo).
2. Segmentado Todos · Entradas · Saídas.
3. Cartão calendário: "{Mês} {Ano}" + "Ver mês"/"Recolher"; grade (03). `/calendario` abre com o mês expandido.
4. Chip "Dia N · limpar filtro ✕" quando há dia selecionado.
5. Grupos por mês: cabeçalho "Novembro 2026" + "entrou R$ X" (Manrope 14 `--t3`); cartão com itens (03).
6. Item: toque expande "Editar" → `/conferir` em modo edição; "Excluir" → remove já e mostra toast "Lançamento excluído" + nome + "Desfazer" (sem diálogo de confirmação no protótipo).
Estados: carregando = 2 grupos de 3 skeletons 64px; vazio total = EstadoVazio genérico; vazio por filtro = "Nada por aqui com esse filtro."; erro = banner rede.
[EXEMPLO] os 9 lançamentos (lista em 07).

## /chat
Dados: **resposta do assistente** para uma pergunta + **fontes legais** (rótulo, resumo, link, data de consulta) [REAL]; sugestões de perguntas [EXEMPLO até definir].
1. "Pergunte" (28/800) + aviso fixo "Respostas informativas, sempre com a fonte. Não substitui um contador."
2. Mensagens; 1ª do assistente: "Pergunte do seu jeito. Eu respondo curto e mostro de onde tirei a regra."
3. Sugestões (somem quando já perguntadas): "Qual é o meu limite?", "Quando vence o DAS?", "E se eu passar do limite?".
4. Campo "Escreva sua dúvida" (52px) + botão "↑" 52×52 (`aria-label="Enviar"`); Enter envia.
Respostas do protótipo [EXEMPLO, **PENDENTE fonte**]: ver 07.
Sem resposta segura: "Não tenho uma resposta segura para isso. Tente com outras palavras, ou leve a dúvida a um contador."
Estados: digitando (3 pontos); erro de envio → **texto PENDENTE** (sugestão: reutilizar banner rede); rolagem automática para a última mensagem.

## /perfil
Dados: **usuário** (nome, atividade) e **preferência de IA** [REAL]; ação de **apagar todos os dados** [REAL].
1. Avatar 56px + "{Nome}" (22/800) + "{Atividade} · MEI".
2. Cartão: "Usar IA para ler" + sub ("Ativado · você confirma tudo" / "Desligado · preenchimento manual") + Switch · "Refazer o cadastro ›" → `/onboarding` · "Apagar todos os meus dados ›" (`--err`) — **sem comportamento no protótipo; PENDENTE** diálogo de confirmação e texto.
3. Laboratório de estados → remover.

## /entrar, /cadastrar (fonte: LAND, modal)
Cartão `min(440px, 100%)`, padding 28, raio 28, borda `--line-strong`, fundo `radial-gradient(120% 60% at 50% -10%, oklch(0.55 0.13 245 / 0.25), transparent 60%), var(--s1)`, `--shadow-modal`. Campos 52px, raio 14; botões 56px raio 16.
- **Cadastrar:** "Criar sua conta" / "Leva um minuto. Depois, o app pergunta só três coisas." · E-mail (placeholder "voce@email.com") · Senha (placeholder "Pelo menos 8 caracteres", botão "Mostrar"/"Ocultar"; dica "Faltam N caracteres." → "Senha boa." em `--ok`) · checkbox "Li e aceito os Termos de uso e a Política de Privacidade." (links para `/legal/*`, **PENDENTES**) · primário "Criar minha conta" → `/onboarding` · "ou" · "Testar com a conta demo" · "Já tem conta? **Entrar**".
- **Entrar:** "Entrar" / "Bom te ver de novo." · E-mail · Senha ("Sua senha") · "Esqueci a senha" · "Entrar na minha conta" → `/painel` · demo · "Ainda não tem conta? **Criar conta**".
- **Recuperar senha** (em /entrar): "Recuperar senha" / "Mandamos um link para você criar uma senha nova." · E-mail · "Enviar link de recuperação" → sucesso: sub "Pronto. Agora é com seu e-mail.", caixa ✓ "Se existir uma conta com esse e-mail, o link chega em alguns minutos. Confira também o spam." + "Voltar para entrar" · "Lembrou? **Voltar para entrar**".
- Validação: e-mail `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` → "Confira o e-mail: falta o @ ou o domínio."; senha ≥ 8 no cadastro; termos obrigatórios (borda `--err` no checkbox). O botão parece desabilitado (`--s3`/`--t2`) até válido, **mas continua clicável**: o clique mostra os erros. Use `aria-disabled`, não `disabled`.
- Erros do servidor (credencial inválida, e-mail já usado): **texto PENDENTE**.
