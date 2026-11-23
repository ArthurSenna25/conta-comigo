# ADR-003 · IA com saída validada; cálculo só no engine determinístico
Data: 23/11/2026 · Status: aceita

**Contexto:** LLM erra conta e inventa regra. Erro de imposto ou limite do MEI prejudica o usuário e a credibilidade do produto.
**Alternativas:** 1) IA calcula e responde tudo 2) IA extrai/explica e o `lib/engine` calcula 3) sem IA (só formulário).
**Decisão:** opção 2. A IA devolve JSON validado com Zod (`IngestResponse`, `ChatResponse`); vira rascunho que o usuário confirma; números do chat chegam prontos do engine via `ContextoChat`; lei só de `kb/` com fonte e data.
**Consequências:** engine testado em Vitest é a fonte da verdade; a IA não tem ferramenta de escrita; trocar de provedor = nova implementação de `AiProvider`.
**Gatilho para revisitar:** precisar de agente que execute ações (ex.: emitir guia), o que exige aprovação humana por ação.
