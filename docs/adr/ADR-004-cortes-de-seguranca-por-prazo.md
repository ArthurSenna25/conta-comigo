# ADR-004 · Sem criptografia de aplicação e sem audit_log (cortes conscientes por prazo)
Data: 23/11/2026 · Status: aceita

**Contexto:** dado financeiro e pessoal de MEI, 8 dias de prazo. Criptografar colunas e manter trilha de auditoria custam dias e complicam consulta e exclusão.
**Alternativas:** 1) criptografia de coluna + audit_log por trigger 2) TLS + criptografia em repouso da plataforma + RLS + minimização, sem audit_log.
**Decisão:** opção 2. **O corte do audit_log é decisão consciente por prazo**, não esquecimento: lançamento confirmado é editado/excluído direto, com `atualizado_em`.
**Consequências:** quem tiver a secret key ou acesso ao painel lê os dados (mitigado por segredo só no servidor e acesso restrito); não há histórico de edições (AMEACAS #12).
**Gatilho para revisitar:** usuários reais fora da demo, dado sensível novo (CPF, conta bancária), contador/terceiro acessando dados do MEI, ou exigência de auditoria → audit_log vem primeiro (está no Backlog).
