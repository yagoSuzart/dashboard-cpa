-- Quais questionários fazem parte de cada modelo de oferta (planilha "Perguntas e alternativas" 2026.1).
-- As visões de resultado contam só as respostas do questionário que pertence à modalidade do curso;
-- respostas fora do modelo continuam guardadas em cpa_resultados.
create table if not exists public.cpa_modelo_oferta (
  survey_id integer not null,
  modalidade text not null,
  primary key (survey_id, modalidade)
);
alter table public.cpa_modelo_oferta enable row level security;
create policy "leitura autenticados" on public.cpa_modelo_oferta for select to authenticated using (true);
grant select on public.cpa_modelo_oferta to authenticated;

insert into public.cpa_modelo_oferta (survey_id, modalidade) values
  (18,'PRESENCIAL'),(20,'PRESENCIAL'),(21,'PRESENCIAL'),(22,'PRESENCIAL'),(24,'PRESENCIAL'),
  (18,'SEMIPRESENCIAL'),(20,'SEMIPRESENCIAL'),(21,'SEMIPRESENCIAL'),(23,'SEMIPRESENCIAL'),(25,'SEMIPRESENCIAL'),(26,'SEMIPRESENCIAL'),
  (18,'EAD'),(20,'EAD'),(21,'EAD'),(23,'EAD'),(25,'EAD'),(26,'EAD')
on conflict do nothing;

-- cpa_resultado_geral, cpa_resultado_curso, cpa_resultado_modalidade e cpa_resultado_professor
-- foram recriadas (security_invoker = true) com:
--   from public.cpa_resultados r
--   join public.cpa_modelo_oferta m on m.survey_id = r.survey_id and m.modalidade = r.modalidade
