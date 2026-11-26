-- (atualizada em 26/11: elegíveis, abertura programada)
-- Página aberta: participação e notas da CPA de Docentes e Técnico-administrativos, ao vivo (direto das respostas do Portal).
-- Só agregados: contagens, médias por eixo e satisfação geral. Nada de comentários.
-- Médias de um público só aparecem com 5 ou mais respostas (para ninguém ser reconhecido).
create or replace function public.colab_panorama_publico()
returns jsonb
language sql stable security definer set search_path = public as $$
  with camp as (
    select * from cpa_colab_campanhas
    order by aberta desc, criado_em desc limit 1
  ),
  resp as (select r.* from cpa_colab_respostas r join camp c on c.id = r.campanha_id),
  cont as (select publico, count(*) n from resp group by publico),
  perg as (
    select b->>'id' bloco, (b->>'eixo')::int eixo, b->>'titulo' titulo, g->>'escala' escala, p->>'id' pid
    from camp c,
      jsonb_array_elements(coalesce(c.instrumento->'blocos', '[]')) b,
      jsonb_array_elements(b->'grupos') g,
      jsonb_array_elements(g->'perguntas') p
  ),
  notas as (
    select r.publico, pg.eixo, pg.titulo, (kv.value)::text::numeric v
    from resp r cross join lateral jsonb_each(r.notas) kv join perg pg on pg.pid = kv.key
    where pg.escala = 'satisfacao' and (kv.value)::text::numeric between 1 and 5
  ),
  eixos as (
    select eixo, titulo,
      round(avg(v), 2) todos,
      case when (select n from cont where publico='docente') >= 5 then round(avg(v) filter (where publico='docente'), 2) end docente,
      case when (select n from cont where publico='tecnico') >= 5 then round(avg(v) filter (where publico='tecnico'), 2) end tecnico
    from notas group by eixo, titulo
  ),
  nps as (
    select r.publico, (r.notas->>coalesce((select instrumento->'final'->'nps'->>'id' from camp), 'g_recomenda'))::numeric v from resp r
  ),
  dias as (
    select (criado_em at time zone 'America/Sao_Paulo')::date dia, publico, count(*) n from resp group by 1, 2
  )
  select case when not exists (select 1 from camp) then null else jsonb_build_object(
    'titulo', (select titulo from camp), 'ciclo', (select ciclo from camp),
    'aberta', (select public.colab_esta_aberta(c) from cpa_colab_campanhas c where c.id = (select id from camp)), 'abre_em', (select abre_em from camp), 'fecha_em', (select fecha_em from camp),
    'elegiveis', (select jsonb_build_object('docente', elegiveis_docente, 'tecnico', elegiveis_tecnico) from camp),
    'atualizado_em', now(),
    'respostas', jsonb_build_object('docente', coalesce((select n from cont where publico='docente'), 0), 'tecnico', coalesce((select n from cont where publico='tecnico'), 0)),
    'ultima', (select max(criado_em) from resp),
    'por_dia', coalesce((select jsonb_agg(jsonb_build_object('dia', dia, 'publico', publico, 'n', n) order by dia) from dias), '[]'),
    'eixos', case when (select count(*) from resp) >= 5 then coalesce((select jsonb_agg(jsonb_build_object('eixo', eixo, 'titulo', titulo, 'todos', todos, 'docente', docente, 'tecnico', tecnico) order by eixo) from eixos), '[]') else '[]' end,
    'nps', case when (select count(*) from resp) >= 5 then jsonb_build_object(
      'todos', (select round(100.0 * (count(*) filter (where v >= 9) - count(*) filter (where v <= 6)) / nullif(count(v), 0)) from nps),
      'media', (select round(avg(v), 1) from nps),
      'docente', case when (select n from cont where publico='docente') >= 5 then (select round(100.0 * (count(*) filter (where v >= 9) - count(*) filter (where v <= 6)) / nullif(count(v), 0)) from nps where publico='docente') end,
      'tecnico', case when (select n from cont where publico='tecnico') >= 5 then (select round(100.0 * (count(*) filter (where v >= 9) - count(*) filter (where v <= 6)) / nullif(count(v), 0)) from nps where publico='tecnico') end
    ) end
  ) end;
$$;
revoke all on function public.colab_panorama_publico() from public;
grant execute on function public.colab_panorama_publico() to anon, authenticated;
notify pgrst, 'reload schema';
