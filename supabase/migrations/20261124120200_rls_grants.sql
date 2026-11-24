-- RLS + GRANT explícito. O projeto tem acesso automático a novas tabelas DESLIGADO:
-- sem GRANT para authenticated a consulta dá "permission denied", mesmo com policy.
-- Negar por padrão: anon não recebe nada; service_role (servidor) ignora RLS.

alter table public.perfis enable row level security;
alter table public.documentos enable row level security;
alter table public.lancamentos enable row level security;
alter table public.consentimentos enable row level security;
alter table public.ai_usage enable row level security;

revoke all on public.perfis, public.documentos, public.lancamentos,
  public.consentimentos, public.ai_usage from anon;

-- perfis: CRUD do próprio usuário
grant select, insert, update, delete on public.perfis to authenticated;
create policy perfis_select on public.perfis for select to authenticated
  using ((select auth.uid()) = user_id);
create policy perfis_insert on public.perfis for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy perfis_update on public.perfis for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy perfis_delete on public.perfis for delete to authenticated
  using ((select auth.uid()) = user_id);

-- lancamentos: CRUD do próprio usuário
grant select, insert, update, delete on public.lancamentos to authenticated;
create policy lancamentos_select on public.lancamentos for select to authenticated
  using ((select auth.uid()) = user_id);
create policy lancamentos_insert on public.lancamentos for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy lancamentos_update on public.lancamentos for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy lancamentos_delete on public.lancamentos for delete to authenticated
  using ((select auth.uid()) = user_id);

-- documentos: sem update. DELETE é necessário: a action apaga a linha ao excluir o último lançamento que a usa.
grant select, insert, delete on public.documentos to authenticated;
create policy documentos_select on public.documentos for select to authenticated
  using ((select auth.uid()) = user_id);
create policy documentos_insert on public.documentos for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy documentos_delete on public.documentos for delete to authenticated
  using ((select auth.uid()) = user_id);

-- consentimentos: só insert; o único update permitido é revogado_em (GRANT por coluna)
grant select, insert on public.consentimentos to authenticated;
grant update (revogado_em) on public.consentimentos to authenticated;
create policy consentimentos_select on public.consentimentos for select to authenticated
  using ((select auth.uid()) = user_id);
create policy consentimentos_insert on public.consentimentos for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy consentimentos_update on public.consentimentos for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ai_usage: usuário só lê; escrita só por registrar_uso_ia() (service_role)
grant select on public.ai_usage to authenticated;
create policy ai_usage_select on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);
