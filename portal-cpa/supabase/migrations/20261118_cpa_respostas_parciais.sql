-- Respostas parciais da CPA, pergunta por pergunta: tudo o que foi respondido em cada modelo de oferta.
-- Vem do CSV "Respostas" do painel da avaliação (Exportar → Respostas), que a CPA sobe pelo Portal, um por modelo de oferta.
-- O navegador agrega o arquivo e só manda contagens: nenhum código de aluno, nome ou comentário entra no banco.
-- Cada envio substitui apenas os modelos de oferta que vieram nos arquivos.

-- 1) Uma linha por pergunta (e por curso, quando o painel informa o curso, como no questionário Docente)
create table if not exists public.cpa_respostas_perguntas (
  ciclo text not null,
  modalidade text not null check (modalidade in ('PRESENCIAL', 'SEMIPRESENCIAL', 'EAD')),
  pesquisa text not null,
  curso_id text not null default '',          -- '' = a pergunta vale para todos os cursos da modalidade
  n_pergunta int not null,
  pergunta text not null,
  tipo text not null,                         -- rating_scale | textarea
  escala text,                                -- likert_5 (6 = não sei) | nps_0_10 | null (texto)
  respostas int not null default 0,
  alunos int not null default 0,
  distribuicao jsonb not null default '{}'::jsonb,  -- {"1": 10, "2": 4, ...}
  media numeric(5, 2),
  publicado_em timestamptz not null default now(),
  primary key (ciclo, modalidade, pesquisa, curso_id, n_pergunta)
);
comment on table public.cpa_respostas_perguntas is 'Respostas parciais da CPA por pergunta: distribuição das notas e média. Só contagens; sem alunos e sem comentários.';

-- 2) Uma linha por questionário: quantos alunos iniciaram e concluíram
create table if not exists public.cpa_respostas_pesquisas (
  ciclo text not null,
  modalidade text not null check (modalidade in ('PRESENCIAL', 'SEMIPRESENCIAL', 'EAD')),
  pesquisa text not null,
  alunos int not null default 0,
  concluiram int not null default 0,
  perguntas int not null default 0,
  publicado_em timestamptz not null default now(),
  primary key (ciclo, modalidade, pesquisa)
);
comment on table public.cpa_respostas_pesquisas is 'Respostas parciais da CPA por questionário: alunos que iniciaram e concluíram.';

alter table public.cpa_respostas_perguntas enable row level security;
alter table public.cpa_respostas_pesquisas enable row level security;

-- Lê: a supervisão global vê tudo; quem está vinculado a um curso vê as perguntas gerais e as do próprio curso
drop policy if exists cpa_resp_perg_le on public.cpa_respostas_perguntas;
create policy cpa_resp_perg_le on public.cpa_respostas_perguntas for select to authenticated
  using (
    exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa','pro_reitoria','comissao_cpa']))
    or (curso_id = '' and exists (select 1 from public.usuario_cursos uc where uc.usuario_id = auth.uid()))
    or exists (select 1 from public.usuario_cursos uc where uc.usuario_id = auth.uid() and uc.curso_id = cpa_respostas_perguntas.curso_id)
  );
drop policy if exists cpa_resp_perg_escreve on public.cpa_respostas_perguntas;
create policy cpa_resp_perg_escreve on public.cpa_respostas_perguntas for all to authenticated
  using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa'])))
  with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa'])));

drop policy if exists cpa_resp_pesq_le on public.cpa_respostas_pesquisas;
create policy cpa_resp_pesq_le on public.cpa_respostas_pesquisas for select to authenticated
  using (
    exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa','pro_reitoria','comissao_cpa']))
    or exists (select 1 from public.usuario_cursos uc where uc.usuario_id = auth.uid())
  );
drop policy if exists cpa_resp_pesq_escreve on public.cpa_respostas_pesquisas;
create policy cpa_resp_pesq_escreve on public.cpa_respostas_pesquisas for all to authenticated
  using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa'])))
  with check (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','diretor_cpa'])));

grant select, insert, update, delete on public.cpa_respostas_perguntas to authenticated;
grant select, insert, update, delete on public.cpa_respostas_pesquisas to authenticated;

notify pgrst, 'reload schema';
