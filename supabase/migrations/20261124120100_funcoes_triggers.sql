-- Funções e triggers. Sem handle_new_user (perfil nasce no onboarding) e sem audit_log (ADR-004).

-- (a) atualizado_em automático
create function public.set_atualizado_em() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create trigger perfis_set_atualizado_em before update on public.perfis
  for each row execute function public.set_atualizado_em();
create trigger lancamentos_set_atualizado_em before update on public.lancamentos
  for each row execute function public.set_atualizado_em();

-- (c) guarda: lançamento nunca muda de dono (vale também para quem usa a secret key)
create function public.lancamentos_guarda() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'lancamentos.user_id e imutavel' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger lancamentos_guarda before update on public.lancamentos
  for each row execute function public.lancamentos_guarda();

-- Contador de IA: única via de escrita em ai_usage. Só o servidor (service_role) chama.
create function public.registrar_uso_ia(p_user_id uuid, p_custo_centavos int) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_custo_centavos < 0 then
    raise exception 'custo negativo' using errcode = '22023';
  end if;
  insert into public.ai_usage as u (user_id, dia, chamadas, custo_centavos)
  values (p_user_id, (now() at time zone 'America/Sao_Paulo')::date, 1, p_custo_centavos)
  on conflict (user_id, dia) do update
    set chamadas = u.chamadas + 1,
        custo_centavos = u.custo_centavos + excluded.custo_centavos;
end $$;

-- Funções não são chamáveis pela Data API (RPC) por quem não deve.
revoke execute on function public.set_atualizado_em() from public, anon, authenticated;
revoke execute on function public.lancamentos_guarda() from public, anon, authenticated;
revoke execute on function public.registrar_uso_ia(uuid, int) from public, anon, authenticated;
grant execute on function public.registrar_uso_ia(uuid, int) to service_role;
