# Dossiê do Projeto: Conta Comigo

**Hack Brasil 2026 · assistente contábil e financeiro com IA para MEIs, autônomos e pequenos comércios** Preparado em 22/11/2026 para Arthur, Gui, Murilo e Frigeri.

---

## 0. Leia primeiro: 5 alertas que mudam o plano

1. **"31/11" não existe** (novembro tem 30 dias). O plano assume entrega final em **30/11 às 23h59** (prazo anotado). Meta interna: **congelar tudo em 29/11 às 18h** e **enviar em 30/11 até 18h**, com 6h de folga. Confirmem o prazo no site oficial hoje.
2. **Não achei a página oficial do Hack Brasil** (busquei de novo; só vieram outros hackathons). Colem o regulamento no chat: ele define limite de integrantes (anotado: máx. 4), regras sobre IA e código pré-feito, formato da entrega e critérios de nota. Este plano se ajusta a ele.
3. **Restam 8 dias** (22 a 30/11) e vocês têm aula e clientes. Orcem \~3h por dia útil e \~6h por dia de fim de semana por pessoa (≈ 28h cada, ≈ 110h no time). O escopo foi cortado para caber nisso.
4. **Posicionamento legal:** o app não se apresenta como "contador" nem "advogado" (profissões regulamentadas). Ele é um **assistente contábil e financeiro com IA** que organiza, calcula, alerta e orienta, e manda validar decisões críticas com um contador. É honesto e protege vocês.
5. **Regra de ouro técnica:** a IA **lê, classifica e explica**; **código determinístico calcula e dispara alertas**. Imposto calculado por LLM dá erro.

---

## 1. Visão do produto

**Problema.** MEIs e donos de lojinha misturam conta pessoal e do negócio, guardam nota na gaveta, esquecem o DAS, estouram o limite de faturamento sem perceber, não sabem se podem pegar um empréstimo e não acompanham as mudanças da lei. Contador custa caro.

**Solução.** Um app web mobile-first (PWA) onde a pessoa **manda foto de nota, áudio, print de vendas ou texto** e a IA registra tudo, mostra a saúde financeira, avisa prazos e riscos e responde dúvidas com base legal citada.

**Frase do pitch:** "Todo pequeno comerciante merece um contador e um CFO no bolso, sem pagar como se fosse uma empresa grande."

**Nome provisório:** Conta Comigo (troquem se quiserem; é só texto no código).

**Persona principal:** Dona Marta, 48 anos, MEI com lojinha de roupas no centro, vende no Pix e cartão, usa só WhatsApp e celular, nunca abriu o Portal do Empreendedor.

**Diferenciais para os jurados:** (1) entrada multimodal natural (foto, voz, print); (2) alertas proativos determinísticos, não só chat; (3) respostas com fonte e data da base legal; (4) foco real em quem não tem contador.

---

## 2. Escopo do MVP (o que "100% funcional" significa)

"100% funcional" aqui = **fluxo ponta a ponta sem quebrar na demo**, não "tem tudo". Cortem sem dó.

**MUST (entra, ou o projeto não existe)**

- M1. Cadastro/login e **onboarding** (tipo de negócio, atividade: comércio/serviço/ambos, cidade/UF, MEI sim/não, faturamento do ano até agora).
- M2. **Enviar foto de nota fiscal/cupom** → IA extrai data, valor, fornecedor, itens, categoria → usuário **confirma ou edita** → vira lançamento.
- M3. **Enviar áudio** ("hoje comprei X por R$ Y") → transcrição → lançamento (mesmo fluxo de confirmação).
- M4. **Enviar texto livre** e **print de vendas** (maquininha/Pix/planilha) → lançamentos em lote.
- M5. **Lista de lançamentos** (receitas e despesas, filtro por mês, editar, excluir).
- M6. **Dashboard:** receita, despesa, saldo do mês; **medidor do limite do MEI** (usado, % e projeção anual); próximo DAS.
- M7. **Alertas determinísticos:** DAS a vencer, limite do MEI (70/90/100%), despesa atípica, mistura PF/PJ sugerida, nota faltando.
- M8. **Chat com o assistente** (CFO + contador + jurídico) com **fontes citadas** da base legal e contexto dos dados do usuário.

**SHOULD (se sobrar tempo)**

- S1. Simulador "posso pegar um empréstimo/investir R$ X?" (fluxo de caixa + parcela).
- S2. Calendário fiscal (DAS mensal, DASN-SIMEI até 31/05, 2027: nota para todas as vendas).
- S3. Relatório mensal simples em PDF (receitas, despesas por categoria, resultado).

**COULD / fora do escopo (vai no slide "roadmap", não no código)** Emissão de nota fiscal, integração com gov.br/Receita/SEFAZ, Open Finance, WhatsApp bot, app nativo, contador humano parceiro, multiusuário/equipe.

---

## 3. Requisitos e histórias de usuário (com critério de aceite)

| ID | História | Critério de aceite |
| --- | --- | --- |
| H1 | Como lojista, mando a foto da nota para não digitar nada | Em ≤ 15s aparece rascunho com valor, data, fornecedor e categoria; campo de baixa confiança fica destacado; nada é salvo sem confirmar |
| H2 | Como lojista, falo o que comprei/vendi e a IA registra | Áudio de até 60s vira lançamento(s); se faltar valor ou data, o app pergunta |
| H3 | Como MEI, quero saber quanto falta para o limite | Medidor mostra % do limite anual (R$ 81 mil) e projeção; alerta em 70, 90 e 100% |
| H4 | Como MEI, não quero esquecer o DAS | Alerta 7 e 2 dias antes do dia 20, com valor correto pela atividade |
| H5 | Como dono, quero perguntar "posso fazer X?" e receber resposta confiável | Resposta cita fonte e data de verificação; se não houver base, diz "não tenho essa informação, consulte um contador" |
| H6 | Como dono, quero ver para onde meu dinheiro vai | Gráfico de despesas por categoria no mês |
| H7 | Como usuário, quero controlar meus dados | Botões "exportar" e "excluir minha conta e dados" funcionam |

**Requisitos não funcionais:** mobile-first (testar em celular real, inclusive iOS); resposta de IA com streaming ou indicador de progresso; falha de IA nunca derruba o app (fallback "preencher manualmente"); LGPD (seção 8); custo de IA controlado (limite diário por usuário); HTTPS e dados isolados por usuário (RLS).

---

## 4. Base legal que o produto precisa conhecer (verificada em 22/11/2026)

Esta é a semente da base de conhecimento (pasta `/kb`). **Cada item deve ser revalidado em fonte oficial (gov.br, Receita, Sebrae) antes da demo.** Marquem a data de verificação em cada arquivo.

- **Limite de faturamento do MEI em 2026: R$ 81 mil/ano** (≈ R$ 6.750/mês, proporcional ao mês de abertura), sem reajuste desde 2018; há projetos de lei em tramitação para elevar, sem aprovação até onde achei. MEI caminhoneiro: R$ 251,6 mil.
- **DAS-MEI 2026:** INSS de 5% do salário mínimo (R$ 1.621, então R$ 81,05) + R$ 1 de ICMS (comércio/indústria) e/ou R$ 5 de ISS (serviços). Total: **R$ 82,05 (comércio/indústria), R$ 86,05 (serviços), R$ 87,05 (ambos)**. Vence todo **dia 20**, mesmo sem faturamento.
- **Declaração anual (DASN-SIMEI):** até 31 de maio.
- **Regras do MEI:** sem sócio, sem filial, no máximo 1 empregado (salário mínimo ou piso da categoria), não pode ser sócio/titular de outra empresa. Receita recebida no CPF pela mesma atividade soma no limite do CNPJ.
- **Nota fiscal:** em 2026 é obrigatória só nas vendas para PJ; segundo as fontes, **a partir de 01/01/2027 passa a valer para todas as operações** (serviços: NFS-e padrão nacional; mercadorias: Nota Fiscal Fácil). Confirmar a data exata.
- **Reforma tributária (IBS/CBS):** 2026 é ano de teste (CBS 0,9% e IBS 0,1%); para MEI e Simples os campos de IBS/CBS na nota só são exigidos a partir de 04/01/2027; transição até 2033. O MEI continua com valor fixo no DAS; o MEI não gera crédito de IBS/CBS para quem compra dele (ponto de atenção em vendas B2B). Há proposta de "nanoempreendedor" (faturamento até \~R$ 40,5 mil, isenção de CBS/IBS).
- **Excesso de limite (conhecimento geral, validar):** estouro de até 20% gera pagamento sobre o excedente e DAS complementar; acima de 20% há desenquadramento com efeitos retroativos. O alerta de 100% deve explicar isso e sugerir falar com contador.

**Fontes consultadas:** contabeis.com.br (MEI 2026), Agência Brasil (02/01/2026, DAS R$ 81,05), contadores.cnt.br (valores e nota fiscal), infinitepay.io/blog (limite 2026), soubrasilia.com/servicos/mei (regras e DAS), Sebrae (ebook Reforma Tributária para pequenos negócios), Itaú Empresas (cronograma da reforma), Bling Ajuda (campos IBS/CBS por regime), Omie (impactos no MEI).

---

## 5. Arquitetura (simples de propósito)

**Stack:** Next.js (App Router) + TypeScript + Tailwind em um único repositório; **Supabase** (Postgres, Auth, Storage, RLS); **Vercel** para deploy. Sem microsserviços, sem filas, sem banco vetorial.

**IA em uma camada fina** (`lib/ai/provider.ts`): uma função `generate({system, messages, files, schema})`. No Dia 0 escolham **um** provedor multimodal (visão + áudio + texto) conforme quem tem chave/crédito: Gemini (tem camada gratuita e aceita áudio e imagem direto) ou Claude API (visão e texto, áudio via transcrição separada). Uma chave só = menos complexidade. Peçam saída em **JSON com schema** e validem com Zod.

**RAG sem banco vetorial:** a base legal tem \~10 arquivos .md curtos em `/kb`. Cada pergunta carrega os arquivos relevantes (busca por palavra-chave ou o índice inteiro, se couber no contexto). Resposta deve citar `fonte` e `verificado_em`.

**Agentes (um orquestrador, três "chapéus"):** o chat usa um prompt-sistema único com instruções para alternar entre **Contador** (classificação, obrigações), **Tributário/Jurídico** (lei, com citação) e **CFO** (caixa, empréstimo, investimento), com ferramentas (tool calls): `get_resumo_mes`, `get_limite_mei`, `get_proximos_vencimentos`, `simular_emprestimo`, `buscar_kb`. Multiagentes de verdade ficam para o roadmap.

**Fluxo de ingestão:** arquivo/áudio/texto → `/api/ingest` → (transcrição se áudio) → LLM extrai JSON → validação Zod → **rascunho** → usuário confirma → `lancamentos` → motor de regras recalcula dashboard e alertas.

**Modelo de dados (Supabase):**

- `perfis`: user\_id, nome\_negocio, tipo (mei/autonomo/outro), atividade (comercio/servico/ambos), uf, municipio, inicio\_atividade, tem\_funcionario
- `lancamentos`: id, user\_id, tipo (receita/despesa), data, valor, categoria, descricao, contraparte, forma\_pgto, origem (foto/audio/texto/print/manual), documento\_id, status (rascunho/confirmado), confianca
- `documentos`: id, user\_id, storage\_path, tipo, extracao\_json, criado\_em
- `alertas`: id, user\_id, tipo, severidade, titulo, mensagem, vencimento, lido, chave\_unica
- `mensagens`: id, user\_id, papel, conteudo, fontes\_json, criado\_em
- RLS em todas as tabelas: `user_id = auth.uid()`.

**Contratos de API (definidos no Dia 0, em `src/types/contracts.ts`):**

- `POST /api/ingest` {kind: image|audio|text, fileUrl?|text?} → {rascunhos: Lancamento\[\], resumo, perguntas\_pendentes: string\[\]}
- `POST /api/lancamentos/confirmar` {ids|rascunhos\[\]} → {ok}
- `GET /api/dashboard` → {receitaMes, despesaMes, saldoMes, limiteMei: {usado, pct, projecaoAnual}, proximoDas, alertas\[\]}
- `POST /api/chat` {mensagens\[\]} → stream de texto + {fontes\[\]}
- `GET /api/alertas` → Alerta\[\]

**Motor de regras** (`lib/engine/*`, funções puras e testáveis): `valorDas(atividade, anoRef)`, `proximoVencimentoDas(data)`, `statusLimiteMei(receitasAno, hoje)`, `projecaoAnual(receitasAno, hoje)`, `gerarAlertas(estado)`, `resumoMes(lancamentos)`, `simularEmprestimo(principal, taxaMes, meses, caixaMensal)`.

---

## 6. IA: prompts, guardrails e avaliação

**Extração (nota/áudio/print):** pedir JSON estrito, campo `confianca` (0 a 1) por campo, nunca inventar ("null" se ilegível), e lista `perguntas_pendentes`. Categorias fixas (estoque/mercadoria, aluguel, energia/água/internet, frete, marketing, impostos/DAS, salário, material de consumo, pró-labore/retirada, outras).

**Chat:** responder em português simples, curto, com passo a passo. Regras do prompt: (1) só afirmar regra legal se estiver na `/kb` e citar fonte e data; (2) se não houver base, dizer que não sabe e sugerir contador; (3) nunca calcular imposto de cabeça, usar as ferramentas; (4) para empréstimo/investimento, mostrar premissas, risco e plano B; (5) sempre fechar decisões de alto impacto com "valide com um contador".

**Segurança:** tratar texto de nota/print como dado, não como instrução (prompt injection); limite de tamanho e tipos de arquivo; rate limit por usuário; logs sem dados pessoais desnecessários.

**Avaliação (Gui + Frigeri, 1h por dia):** conjunto de 10 fotos de nota (reais e anonimizadas), 5 áudios e 15 perguntas legais com resposta esperada. Meta: ≥ 85% de campos corretos na extração e 0 afirmações legais sem fonte.

---

## 7. Divisão do time (cada um entrega sem esperar o outro)

**Como ninguém bloqueia ninguém:** (1) no Dia 0, Arthur publica os **tipos, contratos e mocks**; (2) cada um trabalha em **pastas só suas**; (3) a flag `NEXT_PUBLIC_USE_MOCKS=true` faz o front usar dados falsos até o back real ficar pronto; (4) merges pequenos todo dia, PR revisado em até 12h, branch `main` sempre verde.

| Pessoa | Papel | Pastas (donos) | Entregáveis |
| --- | --- | --- | --- |
| **Arthur** | Tech lead + front/integração | `app/(app)/dashboard`, `components/`, `app/layout`, auth, `supabase/migrations`, deploy | Scaffold, Auth, schema+RLS, dashboard, chat UI, tela de envio (câmera/mic), integração real, Vercel |
| **Gui** | IA | `lib/ai/**`, `app/api/ingest`, `app/api/chat`, `kb/prompts` | Provider, extração de nota/áudio/print, chat com tools e fontes, avaliação, controle de custo |
| **Murilo** | Motor de regras + telas de dados | `lib/engine/**`, `app/(app)/lancamentos`, `app/(app)/calendario`, `supabase/seed` | Funções puras com testes, alertas, lista de lançamentos, calendário fiscal, dados de seed para a demo |
| **Frigeri** | Produto, conteúdo, jurídico e pitch | `app/(marketing)`, `app/(app)/onboarding`, `app/legal`, `kb/*.md`, `docs/` | Landing, onboarding, Termos e Privacidade (LGPD), curadoria da base legal, roteiro de testes (QA), pitch, vídeo de demo |

**Para Murilo e Frigeri (sem experiência):** as tarefas têm especificação fechada e entrada/saída claras. Usem Claude/ChatGPT como par de programação, sempre colando o trecho do dossiê e o contrato de tipos no prompt. Peçam ajuda cedo (regra dos 30 minutos: travou 30 min, chama).

**Rituais:** daily de 10 min às 20h30 no grupo (feito ontem / faço hoje / travado); revisão de PR obrigatória; **quinta 26/11 e sábado 28/11 = checkpoints de integração**.

---

## 8. LGPD, termos de uso e riscos jurídicos

- **Dados tratados:** identificação, dados financeiros, fotos de notas (podem conter CPF/CNPJ de terceiros), áudios. Não são "dados sensíveis" pela LGPD (Lei 13.709/2018), mas exigem cuidado.
- **Base legal:** execução do serviço contratado + consentimento explícito no cadastro para envio a provedores de IA. Mostrar, em linguagem simples, quais dados vão para a IA.
- **Princípios na prática:** minimização (só pedir o necessário), finalidade, transparência, segurança (RLS, HTTPS, chaves só no servidor), retenção (apagar áudio após transcrever), direitos do titular (exportar e excluir conta, H7).
- **Transferência internacional:** provedores de IA ficam fora do Brasil; informar na Política de Privacidade e usar planos/API que não treinam com dados do cliente.
- **Página "Quem somos/encarregado":** nome e e-mail do responsável pelos dados.
- **Termos de Uso (essenciais):** serviço é ferramenta de apoio, não substitui contador/advogado; IA pode errar, usuário confirma dados; sem garantia de resultado fiscal; responsabilidade pelas obrigações continua do empresário.
- **Honestidade na demo:** o app **não** emite DAS nem integra com gov.br; ele orienta e leva o usuário ao PGMEI. Não prometam o que não existe.
- **Direitos autorais/licenças:** usar só fontes e bibliotecas com licença adequada; citar a base legal por link.
- Modelos de texto jurídico gerados por IA devem ser **revisados por um humano**; Frigeri revisa e, se possível, mostrem a um contador/advogado conhecido.

---

## 9. Cronograma (22 a 30/11)

| Dia | Marco | Arthur | Gui | Murilo | Frigeri |
| --- | --- | --- | --- | --- | --- |
| **Dom 22/11 (Dia 0)** | Kickoff, decisões, repo | Repo, Next+Supabase+Vercel no ar, tipos/contratos/mocks, convida o time | Escolhe provedor/chave, testa 1 chamada multimodal | Clona, roda local, lê contratos, esqueleto de `lib/engine` | Cola regulamento aqui, confirma prazo/regras, abre Google Drive com fotos de notas de teste |
| **Seg 23** | Fundamentos | Auth + schema + RLS + layout mobile | `generate()` + extração de **foto de nota** (JSON+Zod) | `valorDas`, `proximoVencimentoDas`, `statusLimiteMei` + testes | Landing v1 + onboarding (formulário, salva perfil) |
| **Ter 24** | Ingestão | Tela de envio (câmera/arquivo/mic) + tela de confirmação | Áudio→transcrição→lançamento; texto livre | `resumoMes`, `projecaoAnual`, `gerarAlertas` + testes | `kb/*.md` com 8 arquivos da seção 4 + links oficiais |
| **Qua 25** | **Checkpoint 1:** foto→lançamento ponta a ponta com IA real | Integra ingest real, lista de lançamentos conectada | Print de vendas em lote; avaliação v1 | Página de lançamentos (filtro, editar, excluir) | Termos + Privacidade v1; roteiro de QA |
| **Qui 26** | **MVP feature-complete (M1–M7)** | Dashboard com medidor do MEI e alertas reais | Chat v1 com `/kb` e fontes | Alertas ligados ao banco; seed da demo (3 meses de dados) | Testa tudo no celular, abre bugs, esboça pitch |
| **Sex 27** | **Chat completo (M8)** | Chat UI com streaming e cartões de fonte | Tools do chat (`get_limite_mei` etc.), guardrails, avaliação v2 | Calendário fiscal (S2) ou simulador (S1) | Vídeo de demo (roteiro) e slides v1 |
| **Sáb 28** | **Checkpoint 2 + corte de escopo** | Polimento mobile/iOS, estados de erro/loading | Reduz custo/latência, fallback manual | Testes unitários finais, correção de bugs | QA completo com lista; atualiza legal/LGPD |
| **Dom 29** | **FREEZE 18h** | Deploy de produção, domínio, variáveis, backup | Só correções de bug | Só correções de bug | Grava vídeo, fecha pitch, ensaio ×2 |
| **Seg 30** | **Submissão** | Tag v1.0, verifica link/login/credenciais de demo | Plantão | Plantão | Preenche formulário e **envia até 18h** (folga até 23h59) |

**Metas por semana (os dois blocos que existem):**

- **Bloco 1 (22–26/11): construir.** Meta: no dia 26, qualquer pessoa manda uma nota e vê dashboard e alertas funcionando.
- **Bloco 2 (27–30/11): fechar.** Meta: chat completo, QA, pitch, vídeo e envio. Nenhuma funcionalidade nova depois do sábado.

---

## 10. Definição de pronto e critérios de corte

**Pronto =** (1) deploy público funcionando no celular; (2) login com usuário de demonstração carregado; (3) as 6 etapas da demo (seção 11) passam 3 vezes seguidas; (4) 0 erros de console na rota principal; (5) termos e privacidade publicados; (6) README com como rodar e variáveis; (7) vídeo gravado de reserva.

**Cortes por ordem se atrasar:** simulador (S1) → relatório PDF (S3) → calendário (S2) → print de vendas → texto livre. **Nunca cortar:** foto de nota, dashboard com limite do MEI, alertas, chat com fonte.

**Plano B de IA:** se a API cair ou estourar custo na demo, ativar `MODO_DEMO` com respostas pré-gravadas das 6 etapas (deixar claro no vídeo que a gravação é de reserva).

---

## 11. Roteiro da demo e do pitch (3 a 5 min)

1. **Gancho (20s):** "A Dona Marta tem uma lojinha, perdeu o prazo do DAS e nem sabe que está perto do limite do MEI."
2. Onboarding em 30s (MEI, comércio, SP).
3. **Foto da nota de estoque** → rascunho → confirmar.
4. **Áudio:** "Contador, hoje vendi 1.200 no cartão e paguei 300 de frete." → dois lançamentos.
5. **Dashboard:** medidor do MEI em 78%, alerta amarelo e DAS vencendo.
6. **Chat CFO:** "Posso pegar R$ 10 mil emprestado para comprar estoque?" → simulação, risco, fonte e "valide com contador".
7. **Chat jurídico:** "Vou precisar emitir nota em 2027?" → resposta citando fonte e data.
8. **Mercado e negócio (30s):** milhões de MEIs no Brasil (confirmar número atual no Sebrae/Receita antes de citar); modelo freemium e plano pago (sugestão: R$ 29 a R$ 49/mês); roadmap: WhatsApp, Open Finance, contador parceiro.

---

## 12. Riscos principais

| Risco | Prob. | Mitigação |
| --- | --- | --- |
| Escopo grande para 8 dias | Alta | Cortes da seção 10, freeze no sábado |
| Murilo/Frigeri travarem e bloquearem | Média | Tarefas fechadas, par com Arthur/Gui 30 min por dia, contratos e mocks |
| IA errar valor/categoria | Alta | Rascunho + confirmação, confiança por campo, avaliação |
| IA inventar lei | Média | Só `/kb`, fonte obrigatória, "não sei" permitido |
| Custo/limite de API | Média | Um provedor, limite por usuário, modo demo |
| Regulamento proibir algo (IA, código prévio) | Baixa/Média | Ler hoje; ajustar |
| Conflito de merge | Média | Pastas por dono, PR pequeno diário |
| Falha de último minuto no deploy | Média | Deploy de teste desde o Dia 0; freeze em 29/11 |

---

## 13. Dia 0: checklist de hoje (22/11)

- [ ] Colar o regulamento do Hack Brasil no chat; confirmar prazo, nº de integrantes, formato e critérios.
- [ ] Confirmar os 4 nomes no cadastro oficial.
- [ ] Decidir provedor de IA e quem cria a chave (Gui ou Arthur); colocar limite de gasto.
- [ ] Arthur: criar repo no GitHub, projeto Supabase e projeto Vercel; `.env.example`; branch protegida; convidar todos.
- [ ] Todos: instalar Node 20+, clonar, rodar `npm run dev`, confirmar que abre.
- [ ] Combinar horários fixos: daily às 20h30; sábado e domingo blocos de 6h.
- [ ] Frigeri: juntar 15 fotos de notas fiscais/cupons de teste (anonimizadas) e gravar 5 áudios.

---

## 14. Perguntas em aberto (respondam e eu ajusto o plano)

1. Qual o regulamento: presencial ou online? Há pitch ao vivo?
2. Há tema/desafio obrigatório ou vale qualquer ideia?
3. Vocês têm crédito de API (Gemini/Claude/OpenAI) ou vamos de camada gratuita?
4. Frigeri e Murilo: o que cada um já fez (HTML/CSS, Git, algum backend)?
5. Quantas horas reais por dia cada um tem de verdade?

*Posso, em seguida, gerar: os tipos TypeScript e o scaffold do repositório, o prompt-sistema do chat, os 8 arquivos da base legal, os modelos de Termos e Privacidade e os slides do pitch.*
