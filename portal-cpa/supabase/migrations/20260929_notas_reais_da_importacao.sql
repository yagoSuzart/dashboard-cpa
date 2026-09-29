-- Troca as notas vindas do sistema antigo pelas notas calculadas da importação 2026.1:
-- só o questionário do modelo de oferta do curso (cpa_modelo_oferta) e sem o 6 ("Não sei / Não utilizo") na média.
-- As notas antigas ficam em bkp_curso_categorias_antigo, bkp_curso_turmas_antigo,
-- bkp_curso_lives_tutoria_antigo e bkp_curso_professores_antigo.
create table if not exists public.bkp_curso_categorias_antigo as table public.curso_categorias;
create table if not exists public.bkp_curso_turmas_antigo as table public.curso_turmas;
create table if not exists public.bkp_curso_lives_tutoria_antigo as table public.curso_lives_tutoria;
create table if not exists public.bkp_curso_professores_antigo as table public.curso_professores;
alter table public.bkp_curso_categorias_antigo enable row level security;
alter table public.bkp_curso_turmas_antigo enable row level security;
alter table public.bkp_curso_lives_tutoria_antigo enable row level security;
alter table public.bkp_curso_professores_antigo enable row level security;

create temp table _base on commit drop as
  select r.* from public.cpa_resultados r
  join public.cpa_modelo_oferta m on m.survey_id = r.survey_id and m.modalidade = r.modalidade
  where r.ciclo = '2026.1' and r.n > 0;

create temp table _cat on commit drop as
  select *, case survey_id when 18 then 'Satisfação Geral' when 20 then 'Políticas Acadêmicas' when 21 then 'Políticas de Gestão'
    when 22 then 'Infraestrutura e Atendimento' when 23 then 'Conteúdo das Disciplinas' else 'Docência e Tutoria' end as categoria
  from _base;

delete from public.curso_categorias;
insert into public.curso_categorias (curso_id, categoria, nota)
  select curso_id, categoria, round(sum(soma) / sum(n), 2) from _cat group by 1, 2;

delete from public.curso_turmas;
insert into public.curso_turmas (curso_id, turma, categoria, nota)
  select curso_id, turma, categoria, round(sum(soma) / sum(n), 2)
  from _cat where turma is not null and turma <> '' group by curso_id, turma, categoria;

delete from public.curso_lives_tutoria;
insert into public.curso_lives_tutoria (curso_id, tipo, nota, respondentes)
  select curso_id, case survey_id when 25 then 'lives' else 'tutoria' end, round(sum(soma) / sum(n), 2), sum(n)::int
  from _base where survey_id in (25, 26) group by 1, 2;

delete from public.curso_professores;
insert into public.curso_professores (curso_id, nome, disciplina, nota, respondentes)
  select curso_id, professor, disciplina, round(sum(soma) / sum(n), 2), sum(n)::int
  from _base where professor is not null and professor <> '' and escala = '1a5' group by curso_id, professor, disciplina;
