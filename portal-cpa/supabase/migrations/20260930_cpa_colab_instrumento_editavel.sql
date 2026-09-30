-- Cada período guarda o próprio questionário (editável pela CPA antes da primeira resposta)
alter table public.cpa_colab_campanhas add column if not exists instrumento jsonb;
alter table public.cpa_colab_campanhas add column if not exists instrumento_atualizado_por uuid references auth.users(id);
alter table public.cpa_colab_campanhas add column if not exists instrumento_atualizado_em timestamptz;

create or replace function public.colab_trava_instrumento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.instrumento is distinct from old.instrumento
     and exists (select 1 from public.cpa_colab_respostas r where r.campanha_id = old.id) then
    raise exception 'Este período já tem respostas: o questionário não pode mais mudar. Crie um novo período.';
  end if;
  if new.instrumento is not null and length(new.instrumento::text) > 200000 then
    raise exception 'Questionário grande demais.';
  end if;
  return new;
end $$;
drop trigger if exists colab_trava_instrumento on public.cpa_colab_campanhas;
create trigger colab_trava_instrumento before update on public.cpa_colab_campanhas
  for each row execute function public.colab_trava_instrumento();

drop function if exists public.colab_campanha_publica(text);
create function public.colab_campanha_publica(p_codigo text)
returns table (titulo text, ciclo text, versao text, aberta boolean, fecha_em date, instrumento jsonb)
language sql stable security definer set search_path = public as $$
  select c.titulo, c.ciclo, c.versao, c.aberta and (c.fecha_em is null or c.fecha_em >= current_date), c.fecha_em, c.instrumento
  from public.cpa_colab_campanhas c where c.codigo = p_codigo
$$;
revoke all on function public.colab_campanha_publica(text) from public;
grant execute on function public.colab_campanha_publica(text) to anon, authenticated;
