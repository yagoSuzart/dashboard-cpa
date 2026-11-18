-- Página aberta: inclui as respostas parciais da CPA, somadas por modelo de oferta e questionário.
-- Nada por curso nem por professor, e nenhum comentário: só a distribuição das notas de cada pergunta.
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
  ,
  -- Respostas parciais, somadas por modelo de oferta (sem curso, sem professor, sem comentário)
  rciclo as (select ciclo from cpa_respostas_perguntas order by publicado_em desc limit 1),
  rdist as (
    select p.modalidade, p.pesquisa, p.n_pergunta, p.pergunta, p.escala, d.key as valor, sum(d.value::int) as qtd
    from cpa_respostas_perguntas p cross join lateral jsonb_each_text(p.distribuicao) d
    where p.ciclo = (select ciclo from rciclo) and p.tipo <> 'textarea'
    group by 1, 2, 3, 4, 5, 6
  ),
  rperg as (
    select modalidade, pesquisa, n_pergunta, pergunta, max(escala) as escala, jsonb_object_agg(valor, qtd) as dist
    from rdist group by 1, 2, 3, 4
  )
  select jsonb_build_object(
    'respostas', jsonb_build_object(
      'ciclo', (select ciclo from rciclo),
      'publicado_em', (select max(publicado_em) from cpa_respostas_perguntas where ciclo = (select ciclo from rciclo)),
      'pesquisas', coalesce((select jsonb_agg(jsonb_build_object('modalidade', modalidade, 'pesquisa', pesquisa, 'alunos', alunos, 'concluiram', concluiram))
                             from cpa_respostas_pesquisas where ciclo = (select ciclo from rciclo)), '[]'::jsonb),
      'perguntas', coalesce((select jsonb_agg(jsonb_build_object('modalidade', modalidade, 'pesquisa', pesquisa, 'n', n_pergunta, 'pergunta', pergunta, 'escala', escala, 'dist', dist) order by modalidade, pesquisa, n_pergunta)
                             from rperg), '[]'::jsonb)
    ),
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
comment on function public.cpa_ao_vivo_publico() is 'Página aberta do Portal: panorama da CPA ao vivo, respostas parciais por modelo de oferta (sem curso, professor ou comentário), notas gerais do ciclo anterior e números dos planos. Só agregados.';
revoke all on function public.cpa_ao_vivo_publico() from public;
grant execute on function public.cpa_ao_vivo_publico() to anon, authenticated;
