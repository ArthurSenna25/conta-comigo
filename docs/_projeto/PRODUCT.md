# PRODUCT — Conta Comigo

1. **Objetivo e métrica:** MEI controla receitas e despesas sem planilha e sem contador no dia a dia. Métrica da demo: do envio de uma foto, áudio ou texto até o lançamento confirmado em menos de 30 s.
2. **CTA único:** enviar um comprovante (foto, áudio ou texto).
3. **Público/persona:** MEI com pouca familiaridade contábil, usa o celular. Objeção: medo de errar imposto e de entregar dados financeiros.
4. **Proposta de valor:** a IA organiza; o motor de regras calcula. Cada resposta do chat cita a fonte.
5. **Entrega:** login · envio de foto, áudio e texto · lançamentos em rascunho com confirmação · dashboard com limite do MEI e DAS · alertas · chat com fonte.
6. **Premissas:** web mobile-first (PWA); banco e auth no Supabase; Zod em toda fronteira; IA com orçamento diário.
7. **Fora de escopo (Won't):** emitir nota ou DAS, integração gov.br, Open Finance, app nativo.

— N2+ —
10. **RF/RNF:** a detalhar na fase de arquitetura (P3), a partir de `docs/projeto/`.
11. **Modelo de dados:** fase de banco.
12. **Riscos:** prazo curto (freeze 29/11 18h); dado financeiro e pessoal (LGPD); alucinação da IA em tema fiscal (mitigada por `lib/engine` e fonte citada).

**Stack:** Next.js 16 (App Router), TypeScript strict, Tailwind v4, shadcn, Supabase, Zod, Vitest.
**Fases:** setup → arquitetura → banco → segurança → handoff.
**Triagem aprovada:** Nível N2, com segurança e LGPD reforçadas · 23/11/2026 · o que subiria o nível: pagamento, multi-tenant ou integração fiscal oficial (N3).
