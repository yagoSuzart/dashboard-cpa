-- CPA do corpo docente e do corpo técnico-administrativo: link público e anônimo;
-- resultados só para admin, diretor_cpa e pro_reitoria. Ninguém grava direto na tabela de respostas:
-- o envio passa por colab_enviar, que valida o link aberto, o público e o formato de cada resposta.
create table if not exists public.cpa_colab_campanhas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  ciclo text not null,
  codigo text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  versao text not null default 'v1',
  aberta boolean not null default false,
  fecha_em date,
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now()
);
create table if not exists public.cpa_colab_respostas (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.cpa_colab_campanhas(id) on delete cascade,
  publico text not null check (publico in ('docente', 'tecnico')),
  versao text not null,
  perfil jsonb not null default '{}'::jsonb,
  notas jsonb not null default '{}'::jsonb,
  abertas jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists cpa_colab_respostas_campanha on public.cpa_colab_respostas (campanha_id);
alter table public.cpa_colab_campanhas enable row level security;
alter table public.cpa_colab_respostas enable row level security;
create policy colab_campanhas_le on public.cpa_colab_campanhas for select to authenticated
  using (public.cpa_papel() = any (array['admin', 'diretor_cpa', 'pro_reitoria']));
create policy colab_campanhas_cria on public.cpa_colab_campanhas for insert to authenticated
  with check (public.cpa_papel() = any (array['admin', 'diretor_cpa']));
create policy colab_campanhas_edita on public.cpa_colab_campanhas for update to authenticated
  using (public.cpa_papel() = any (array['admin', 'diretor_cpa']))
  with check (public.cpa_papel() = any (array['admin', 'diretor_cpa']));
create policy colab_respostas_le on public.cpa_colab_respostas for select to authenticated
  using (public.cpa_papel() = any (array['admin', 'diretor_cpa', 'pro_reitoria']));
grant select, insert, update on public.cpa_colab_campanhas to authenticated;
grant select on public.cpa_colab_respostas to authenticated;
revoke all on public.cpa_colab_respostas from anon;
revoke all on public.cpa_colab_campanhas from anon;

create or replace function public.colab_campanha_publica(p_codigo text)
returns table (titulo text, ciclo text, versao text, aberta boolean, fecha_em date)
language sql stable security definer set search_path = public as $$
  select c.titulo, c.ciclo, c.versao, c.aberta and (c.fecha_em is null or c.fecha_em >= current_date), c.fecha_em
  from public.cpa_colab_campanhas c where c.codigo = p_codigo
$$;

create or replace function public.colab_enviar(p_codigo text, p_publico text, p_perfil jsonb, p_notas jsonb, p_abertas jsonb)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  camp public.cpa_colab_campanhas%rowtype;
  k text; v jsonb;
begin
  select * into camp from public.cpa_colab_campanhas where codigo = p_codigo;
  if not found or not camp.aberta or (camp.fecha_em is not null and camp.fecha_em < current_date) then
    raise exception 'Esta avaliação não está aberta.';
  end if;
  if p_publico not in ('docente', 'tecnico') then raise exception 'Público inválido.'; end if;
  if jsonb_typeof(p_notas) <> 'object' or jsonb_typeof(p_abertas) <> 'object' or jsonb_typeof(p_perfil) <> 'object' then
    raise exception 'Formato inválido.';
  end if;
  if (select count(*) from jsonb_object_keys(p_notas)) > 150 or (select count(*) from jsonb_object_keys(p_abertas)) > 40
     or length(p_perfil::text) > 600 or length(p_abertas::text) > 60000 then
    raise exception 'Resposta grande demais.';
  end if;
  if (select count(*) from jsonb_object_keys(p_notas)) = 0 then raise exception 'Nenhuma resposta.'; end if;
  for k, v in select * from jsonb_each(p_notas) loop
    if k !~ '^[a-z0-9_]{1,40}$' or jsonb_typeof(v) <> 'number' or (v::text)::numeric not in (0,1,2,3,4,5,6,7,8,9,10) then
      raise exception 'Resposta inválida.';
    end if;
  end loop;
  for k, v in select * from jsonb_each(p_abertas) loop
    if k !~ '^[a-z0-9_]{1,40}$' or jsonb_typeof(v) <> 'string' or length(v #>> '{}') > 4000 then
      raise exception 'Comentário inválido.';
    end if;
  end loop;
  insert into public.cpa_colab_respostas (campanha_id, publico, versao, perfil, notas, abertas)
    values (camp.id, p_publico, camp.versao, p_perfil, p_notas, p_abertas);
  return true;
end $$;
revoke all on function public.colab_campanha_publica(text) from public;
revoke all on function public.colab_enviar(text, text, jsonb, jsonb, jsonb) from public;
grant execute on function public.colab_campanha_publica(text) to anon, authenticated;
grant execute on function public.colab_enviar(text, text, jsonb, jsonb, jsonb) to anon, authenticated;
