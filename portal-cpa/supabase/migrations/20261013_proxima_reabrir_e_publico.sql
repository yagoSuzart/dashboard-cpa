-- Próxima CPA: (1) "quem responde" de cada questionário (ex.: só turmas que atendem na clínica-escola),
-- que vai junto para o T.I; (2) a CPA pode reabrir uma proposta aprovada ou já enviada ao T.I
-- para incluir perguntas (as decisões da Pró-Reitoria em cada pergunta continuam gravadas).
alter table public.cpa_questionarios add column if not exists publico text;

create policy atualiza_questionario on public.cpa_questionarios
  for update
  using (cpa_papel() = any (array['admin', 'diretor_cpa', 'pro_reitoria']))
  with check (cpa_papel() = any (array['admin', 'diretor_cpa', 'pro_reitoria']));

alter policy cpa_atualiza_proposta on public.cpa_propostas
  using ((cpa_papel() = any (array['admin', 'diretor_cpa'])) and status = any (array['montagem', 'devolvida', 'aprovada', 'enviada_ti']));
