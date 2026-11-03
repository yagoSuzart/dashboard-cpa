-- Retorno da CPA aos alunos: página pública (sem login) por curso e modalidade, aberta pelo QR code / link do
-- card-resumo do feedback. Função SECURITY DEFINER que devolve SÓ planos aprovados/concluídos dos questionários com
-- plano do coordenador e SÓ campos públicos (sem comentários anexados, autor, rascunhos ou demandas de setor).
create or replace function public.cpa_retorno_publico(p_curso text)
returns table (curso_id text, curso_nome text, modalidade text, questionario text, titulo text, descricao text, prazo date, status text, sem_melhoria boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.nome, c.modalidade, split_part(coalesce(p.categoria, ''), ',', 1), p.titulo, p.descricao, p.prazo, p.status, p.sem_melhoria
  from cursos c
  left join planos_acao p
    on p.curso_id = c.id and coalesce(p.tipo, 'curso') <> 'setor' and p.status in ('aprovado', 'concluido')
   and split_part(coalesce(p.categoria, ''), ',', 1) in ('Conteúdo das Disciplinas', 'Infraestrutura e Atendimento', 'Políticas Acadêmicas', 'Políticas de Gestão')
  where c.id = p_curso
  order by p.categoria, p.criado_em;
$$;
comment on function public.cpa_retorno_publico(text) is 'Retorno da CPA aos alunos (página pública por curso e modalidade): só planos aprovados/concluídos e só campos públicos.';
revoke all on function public.cpa_retorno_publico(text) from public;
grant execute on function public.cpa_retorno_publico(text) to anon, authenticated;
