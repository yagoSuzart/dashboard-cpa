-- Análise rica do CSV de Respostas, por modelo de oferta: funil, semestre, curso (Presencial), horários,
-- tempo de resposta, turmas de entrada, abandono e nº de comentários. Só agregados (nenhum aluno, nenhum texto).
-- Todos que entram no Portal veem tudo; a página aberta vê tudo menos as médias por curso.
create table if not exists public.cpa_respostas_resumo (
  ciclo text not null,
  modalidade text not null check (modalidade in ('PRESENCIAL', 'SEMIPRESENCIAL', 'EAD')),
  dados jsonb not null,
  publicado_em timestamptz not null default now(),
  primary key (ciclo, modalidade)
);
alter table public.cpa_respostas_resumo enable row level security;
drop policy if exists cpa_resp_resumo_le on public.cpa_respostas_resumo;
create policy cpa_resp_resumo_le on public.cpa_respostas_resumo for select to authenticated using (true);
drop policy if exists cpa_resp_resumo_escreve on public.cpa_respostas_resumo;
create policy cpa_resp_resumo_escreve on public.cpa_respostas_resumo for all to authenticated
  using (public.cpa_papel() = any (array['admin','diretor_cpa']))
  with check (public.cpa_papel() = any (array['admin','diretor_cpa']));
grant select, insert, update, delete on public.cpa_respostas_resumo to authenticated;

-- Página aberta: o resumo do último ciclo, sem as médias por curso (só alunos e conclusão por curso)
create or replace function public.cpa_resumo_publico()
returns jsonb language sql stable security definer set search_path = public as $$
  with ult as (select ciclo from cpa_respostas_resumo order by publicado_em desc limit 1)
  select coalesce(jsonb_object_agg(r.modalidade,
    jsonb_set(r.dados, '{cursos}', coalesce((select jsonb_agg(c - 'medias' - 'media') from jsonb_array_elements(r.dados->'cursos') c), '[]'))
    || jsonb_build_object('publicado_em', r.publicado_em)), '{}')
  from cpa_respostas_resumo r where r.ciclo = (select ciclo from ult)
$$;
revoke all on function public.cpa_resumo_publico() from public;
grant execute on function public.cpa_resumo_publico() to anon, authenticated;
notify pgrst, 'reload schema';
