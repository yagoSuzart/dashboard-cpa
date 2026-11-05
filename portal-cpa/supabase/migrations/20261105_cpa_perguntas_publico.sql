-- Perguntas da próxima CPA: página pública (sem login) para os coordenadores verem, por modalidade, quais
-- questionários e perguntas os alunos vão responder. Devolve SÓ a proposta mais recente e SÓ as perguntas que
-- entram (mantidas pela CPA e não reprovadas pela Pró-Reitoria), sem histórico, observações ou autores.
create or replace function public.cpa_perguntas_publico()
returns jsonb
language sql stable security definer set search_path = public as $$
  with p as (select id, status from cpa_propostas order by id desc limit 1)
  select jsonb_build_object(
    'status', (select status from p),
    'questionarios', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'nome', q.nome, 'ordem', q.ordem, 'origem', q.origem) order by q.ordem) from cpa_questionarios q), '[]'),
    'itens', coalesce((select jsonb_agg(jsonb_build_object('questionario_id', i.questionario_id, 'posicao', i.posicao, 'texto', i.texto,
        'texto_original', i.texto_original, 'origem', i.origem, 'atual_id', i.atual_id, 'tipo', i.tipo, 'modalidades', i.modalidades,
        'decisao_pr', i.decisao_pr) order by i.posicao)
      from cpa_proposta_itens i where i.proposta_id = (select id from p) and i.incluida and coalesce(i.decisao_pr, '') <> 'reprovada'), '[]'),
    'prefixos', coalesce((select jsonb_agg(jsonb_build_object('questionario_id', r.questionario_id, 'modalidade', r.modalidade, 'texto', r.texto))
      from cpa_proposta_prefixos r where r.proposta_id = (select id from p)), '[]')
  );
$$;
comment on function public.cpa_perguntas_publico() is 'Perguntas da próxima CPA (página pública para os coordenadores): só o que entra no instrumento, sem dados internos.';
revoke all on function public.cpa_perguntas_publico() from public;
grant execute on function public.cpa_perguntas_publico() to anon, authenticated;
