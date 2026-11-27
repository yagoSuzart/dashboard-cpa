-- Análise rica do CSV de Respostas, por modelo de oferta: funil, semestre, curso (Presencial), horários,
-- tempo de resposta, turmas de entrada, abandono e nº de comentários. Só agregados (nenhum aluno, nenhum texto).
create table if not exists public.cpa_respostas_resumo (
  ciclo text not null,
  modalidade text not null check (modalidade in ('PRESENCIAL', 'SEMIPRESENCIAL', 'EAD')),
  dados jsonb not null,
  publicado_em timestamptz not null default now(),
  primary key (ciclo, modalidade)
);
alter table public.cpa_respostas_resumo enable row level security;
drop policy if exists cpa_resp_resumo_le on public.cpa_respostas_resumo;
create policy cpa_resp_resumo_le on public.cpa_respostas_resumo for select to authenticated
  using (public.cpa_papel() = any (array['admin','diretor_cpa','pro_reitoria','comissao_cpa']));
drop policy if exists cpa_resp_resumo_escreve on public.cpa_respostas_resumo;
create policy cpa_resp_resumo_escreve on public.cpa_respostas_resumo for all to authenticated
  using (public.cpa_papel() = any (array['admin','diretor_cpa']))
  with check (public.cpa_papel() = any (array['admin','diretor_cpa']));
grant select, insert, update, delete on public.cpa_respostas_resumo to authenticated;
notify pgrst, 'reload schema';
