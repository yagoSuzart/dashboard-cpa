-- Catálogo das perguntas como o T.I as exporta (um ID por pergunta e modalidade),
-- só com o que identifica a pergunta: sem respostas e sem nada de aluno.
-- Usado para devolver ao T.I a planilha da próxima CPA no mesmo formato que ele mandou.
create or replace function public.cpa_perguntas_ti()
returns table (ciclo text, survey_id integer, pesquisa text, pergunta_posicao integer, pergunta_id integer, modalidade text, pergunta text)
language sql
stable
set search_path = public
as $$
  -- Só as modalidades oficiais de cada questionário (a extração traz alunos que responderam fora do seu
  -- modelo de oferta) e, para cada pergunta e modalidade, o ID com mais respostas
  with base as (
    select r.ciclo, r.survey_id, r.pesquisa, r.pergunta_posicao, r.pergunta_id, r.modalidade, max(r.pergunta) as pergunta, sum(r.n) as respostas
    from cpa_resultados r
    where r.ciclo = (select max(ciclo) from cpa_resultados)
      and r.pergunta_id is not null
      and exists (select 1 from cpa_modelo_oferta m where m.survey_id = r.survey_id and m.modalidade = r.modalidade)
    group by 1, 2, 3, 4, 5, 6
  )
  select distinct on (b.survey_id, b.pergunta_posicao, b.modalidade)
    b.ciclo, b.survey_id, b.pesquisa, b.pergunta_posicao, b.pergunta_id, b.modalidade, b.pergunta
  from base b
  order by b.survey_id, b.pergunta_posicao, b.modalidade, b.respostas desc, b.pergunta_id
$$;

revoke all on function public.cpa_perguntas_ti() from public, anon;
grant execute on function public.cpa_perguntas_ti() to authenticated;
