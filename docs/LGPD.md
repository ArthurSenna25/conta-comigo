# LGPD — checklist técnico

> **Não é parecer jurídico.** Checklist de engenharia (Lei 13.709/2018). Itens marcados **REVISAR COM HUMANO** precisam de validação do Frigeri e, se possível, de um advogado ou contador.

## Papéis
- **Controlador:** o time Conta Comigo (no hackathon). **REVISAR COM HUMANO:** quem assina como pessoa responsável.
- **Operadores:** Supabase (banco, auth, storage), Vercel (hospedagem), provedor de IA (extração e chat).
- **Encarregado (DPO):** nome e e-mail publicados em `app/legal`. **REVISAR COM HUMANO:** quem será.

## Inventário de dados

| Dado | Onde | Finalidade | Base legal (art. 7º) | Retenção |
|---|---|---|---|---|
| E-mail, senha (hash) | Supabase Auth | Login | Execução de contrato (V) | Até excluir a conta |
| Perfil do negócio (nome, atividade, UF, município, data de abertura, faturamento inicial) | `perfis` | Calcular DAS, limite e alertas | Execução de contrato (V) | Até excluir a conta |
| Lançamentos (valor, data, categoria, descrição, contraparte) | `lancamentos` | Controle financeiro, dashboard | Execução de contrato (V) | Até o usuário excluir |
| Imagem de nota/print (pode conter CPF/CNPJ de terceiros) | Storage privado | Comprovante do lançamento | Execução de contrato (V) | Até excluir o lançamento ou a conta. **REVISAR COM HUMANO:** prazo máximo |
| Áudio | Só em memória | Transcrever e extrair | Execução de contrato (V) | **Nunca gravado**; descartado após a chamada |
| Texto livre e mensagens do chat | Só em memória / navegador | Extrair e responder | Execução de contrato (V) | Não persistido no servidor |
| Aceites (finalidade, versão, data) | `consentimentos` | Prova de consentimento | Obrigação legal (II) / consentimento | Enquanto a conta existir. **REVISAR COM HUMANO** |
| Uso de IA (dia, chamadas, custo) | `ai_usage` | Limite de custo | Legítimo interesse (IX) | Até excluir a conta |
| Envio ao provedor de IA | — | Extração e chat | **Consentimento** (I), específico e destacado | — |

## Minimização
- [ ] Não coletar CPF, CNPJ, telefone nem endereço do usuário.
- [ ] Remover EXIF/GPS da foto (reencode no cliente + rejeição no servidor, `AMEACAS.md` #2).
- [ ] Áudio nunca gravado; imagem só vai ao Storage ao confirmar.
- [ ] Logs sem conteúdo de nota, valores ou prompt.
- [ ] Ao provedor de IA vai só o necessário: o arquivo/texto e, no chat, o resumo do engine (sem e-mail).

## Transferência internacional (provedor de IA)
- [ ] Registrar qual provedor, região e o DPA/cláusulas-padrão contratuais dele (Resolução CD/ANPD nº 19/2024). **REVISAR COM HUMANO:** se as cláusulas do provedor atendem à resolução.
- [ ] Usar API/plano que **não treina** com os dados enviados; anotar o link da política.
- [ ] Informar na Política de Privacidade: país, finalidade e quais dados vão.

## Consentimento e transparência
- [ ] Caixa **não pré-marcada** para "envio ao provedor de IA" no onboarding, com texto simples do que vai.
- [ ] Gravar em `consentimentos` (finalidade, versão do texto, data). Sem esse aceite, a ingestão por IA fica bloqueada e só o lançamento manual funciona.
- [ ] Permitir revogar (preenche `revogado_em`).
- [ ] Termos de Uso: ferramenta de apoio, não substitui contador; a IA pode errar; o usuário confirma tudo.

## Direitos do titular (H7)
- [ ] **Exportar:** action devolve JSON com perfil, lançamentos, consentimentos e links assinados das imagens.
- [ ] **Excluir conta:** apagar arquivos no Storage → `auth.admin.deleteUser` (secret key só no servidor) → cascade no banco (`DADOS.md`). Confirmar com digitação.
- [ ] Corrigir: edição de perfil e lançamentos (M5).

## Segurança (art. 46)
- [ ] TLS em trânsito; criptografia em repouso da plataforma; RLS; sem criptografia de aplicação (ADR-004).
- [ ] Incidente: quem avisa, em quanto tempo e por onde. **REVISAR COM HUMANO.**
