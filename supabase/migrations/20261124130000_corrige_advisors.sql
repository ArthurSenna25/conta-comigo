-- Correções dos advisors (db advisors --remote, 24/11/2026).

-- WARN 0028/0029: rls_auto_enable() é o gatilho de "RLS automático" da plataforma (SECURITY DEFINER)
-- e estava exposta em /rest/v1/rpc. Gatilho de evento não precisa de EXECUTE do chamador.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Achado no teste de RLS: o check comparava revogado_em (horário do app) com aceito_em (now() do banco).
-- Com o relógio do app ~0,8 s atrás, revogar logo após aceitar violava o check. O banco não precisa dele.
alter table public.consentimentos drop constraint consentimentos_check;

-- INFO 0001: o linter não conta índice parcial como cobertura da FK composta
-- (documento_id, user_id). Troca pelo índice completo, que serve ao ON DELETE SET NULL.
drop index public.lancamentos_documento_idx;
create index lancamentos_documento_user_idx on public.lancamentos (documento_id, user_id);
