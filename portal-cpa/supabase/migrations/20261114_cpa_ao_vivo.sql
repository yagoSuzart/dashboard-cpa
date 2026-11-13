-- CPA ao vivo: o panorama aberto do Portal (sem login) e o ranking de professores (só para a coordenação).
-- Os números vêm dos CSVs do painel da avaliação, que a CPA sobe pelo Portal (Admin → Atualizar CPA ao vivo).
-- Nada de aluno entra aqui: só contagens por curso e médias por professor.

-- 1) Panorama publicado (uma linha por publicação; vale a mais recente)
create table if not exists public.cpa_ao_vivo (
  id bigint generated always as identity primary key,
  ciclo text not null,
  dados jsonb not null,
  publicado_por uuid references auth.users(id) default auth.uid(),
  publicado_em timestamptz not null default now()
);
comment on table public.cpa_ao_vivo is 'Panorama da CPA ao vivo (respondentes e adesão por curso e modelo de oferta), publicado pela CPA a partir dos CSVs do painel.';
alter table public.cpa_ao_vivo enable row level security;
create policy cpa_ao_vivo_le on public.cpa_ao_vivo for select to authenticated
  using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa','pro_reitoria','comissao_cpa'])));
create policy cpa_ao_vivo_publica on public.cpa_ao_vivo for insert to authenticated
  with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa'])));
grant select, insert on public.cpa_ao_vivo to authenticated;

-- 2) Ajustes que a CPA faz na conferência (cursos que não existem na modalidade, elegíveis corrigidos) e que valem
--    para as próximas atualizações
create table if not exists public.cpa_ao_vivo_config (
  id int primary key default 1 check (id = 1),
  config jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.cpa_ao_vivo_config enable row level security;
create policy cpa_ao_vivo_config_tudo on public.cpa_ao_vivo_config for all to authenticated
  using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa'])))
  with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa'])));
grant select, insert, update on public.cpa_ao_vivo_config to authenticated;

-- 3) Professores: média e número de avaliações por curso (questionário Docente). Sem comentários.
--    Vê: a supervisão global e quem está vinculado ao curso (coordenação, adjunto, diretor de núcleo).
create table if not exists public.cpa_ao_vivo_professores (
  ciclo text not null,
  curso_id text not null references public.cursos(id),
  docente text not null,
  disciplinas text[] not null default '{}',
  alunos int not null,
  respostas int not null,
  media numeric(4, 2),
  publicado_em timestamptz not null default now(),
  primary key (ciclo, curso_id, docente)
);
comment on table public.cpa_ao_vivo_professores is 'Ranking de professores da CPA ao vivo: média (1 a 5) e quantidade de avaliações por curso. Só números, sem comentários.';
alter table public.cpa_ao_vivo_professores enable row level security;
create policy cpa_ao_vivo_prof_le on public.cpa_ao_vivo_professores for select to authenticated
  using (
    exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa','pro_reitoria','comissao_cpa']))
    or exists (select 1 from public.usuario_cursos uc where uc.usuario_id = auth.uid() and uc.curso_id = cpa_ao_vivo_professores.curso_id)
  );
create policy cpa_ao_vivo_prof_escreve on public.cpa_ao_vivo_professores for all to authenticated
  using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa'])))
  with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa'])));
grant select, insert, update, delete on public.cpa_ao_vivo_professores to authenticated;

-- 4) O que a página aberta lê (sem login): o último panorama publicado, as notas gerais do ciclo anterior
--    (média da UniFECAF por dimensão, ponderada pelos respondentes de cada curso) e os números dos planos de ação.
create or replace function public.cpa_ao_vivo_publico()
returns jsonb
language sql stable security definer set search_path = public as $$
  with ult as (select ciclo, dados, publicado_em from cpa_ao_vivo order by publicado_em desc limit 1),
  imp as (select ciclo from cpa_importacoes where status = 'concluida' order by importado_em desc limit 1),
  dims as (
    select cc.categoria, round(sum(cc.nota * coalesce(r.respondentes, 1)) / nullif(sum(coalesce(r.respondentes, 1)), 0), 2) as nota
    from curso_categorias cc left join curso_respondentes r on r.curso_id = cc.curso_id
    where cc.nota is not null
    group by cc.categoria
  )
  select jsonb_build_object(
    'ao_vivo', (select jsonb_build_object('ciclo', ciclo, 'dados', dados, 'publicado_em', publicado_em) from ult),
    'historico', jsonb_build_object(
      'ciclo', (select ciclo from imp),
      'respondentes', (select sum(respondentes) from curso_respondentes),
      'dimensoes', coalesce((select jsonb_agg(jsonb_build_object('categoria', categoria, 'nota', nota)) from dims), '[]'::jsonb)
    ),
    'planos', (select jsonb_build_object(
      'aprovados', count(*) filter (where status in ('aprovado', 'concluido')),
      'concluidos', count(*) filter (where status = 'concluido'),
      'cursos', count(distinct curso_id) filter (where status in ('aprovado', 'concluido')))
      from planos_acao where coalesce(tipo, 'curso') <> 'setor')
  );
$$;
comment on function public.cpa_ao_vivo_publico() is 'Página aberta do Portal: panorama da CPA ao vivo, notas gerais do ciclo anterior e números dos planos. Só agregados.';
revoke all on function public.cpa_ao_vivo_publico() from public;
grant execute on function public.cpa_ao_vivo_publico() to anon, authenticated;
