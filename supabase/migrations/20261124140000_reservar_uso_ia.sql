-- Reserva atômica de chamadas de IA (docs/DADOS.md, AMEACAS #7/#8/#21).
-- Substitui "checar e depois registrar" (corrida) por uma decisão única no banco.
-- registrar_uso_ia fica para o custo pago futuro; esta só conta chamadas.

create function public.reservar_uso_ia(p_user_id uuid, p_max_usuario int, p_max_global int)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  -- falha fechada: limite ausente/zero/negativo nega
  if p_max_usuario < 1 or p_max_global < 1 then
    return false;
  end if;

  -- Serializa as reservas (o global é uma soma entre usuários). O lock vem num comando à parte
  -- de propósito: o snapshot do comando seguinte é tirado depois de esperar o lock e enxerga
  -- o que a reserva anterior confirmou. Num CTE único o snapshot seria anterior ao lock.
  perform pg_advisory_xact_lock(hashtextextended('reservar_uso_ia', 0));

  if (select coalesce(sum(chamadas), 0) from public.ai_usage where dia = v_dia) >= p_max_global then
    return false;
  end if;

  -- incrementa só se o usuário ainda está abaixo do limite; o WHERE do DO UPDATE barra o resto
  insert into public.ai_usage as u (user_id, dia, chamadas, custo_centavos)
  values (p_user_id, v_dia, 1, 0)
  on conflict (user_id, dia) do update
    set chamadas = u.chamadas + 1
    where u.chamadas < p_max_usuario;

  return found; -- true: inseriu ou atualizou; false: o WHERE barrou
end $$;

-- Só o servidor (service_role) reserva. Sem GRANT novo de tabela: a função roda como dono.
revoke execute on function public.reservar_uso_ia(uuid, int, int) from public, anon, authenticated;
grant execute on function public.reservar_uso_ia(uuid, int, int) to service_role;
