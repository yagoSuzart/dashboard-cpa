-- Controle do feedback aos alunos: registra quando cada pessoa gerou / compartilhou / baixou o feedback de um curso +
-- modalidade (e turma). Cada um só registra e lê os próprios eventos; a supervisão global lê todos.
create table if not exists public.feedback_eventos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null default auth.uid() references public.usuarios(id),
  curso_id text not null references public.cursos(id),
  turma text,
  formato text not null check (formato in ('carrossel', 'card')),
  evento text not null check (evento in ('gerado', 'compartilhado', 'baixado', 'link_copiado')),
  itens int,
  criado_em timestamptz not null default now()
);
comment on table public.feedback_eventos is 'Controle do feedback aos alunos: quando cada pessoa gerou/compartilhou o feedback de um curso + modalidade (e turma).';
create index if not exists feedback_eventos_usuario_curso on public.feedback_eventos (usuario_id, curso_id);
alter table public.feedback_eventos enable row level security;
create policy feedback_eventos_insere_proprio on public.feedback_eventos for insert to authenticated with check (auth.uid() = usuario_id);
create policy feedback_eventos_le_proprio on public.feedback_eventos for select to authenticated using (auth.uid() = usuario_id);
create policy feedback_eventos_supervisao_le on public.feedback_eventos for select to authenticated using (exists (select 1 from public.usuarios u where u.id = auth.uid() and u.role = any (array['admin','pro_reitoria','diretor_cpa','comissao_cpa'])));
grant select, insert on public.feedback_eventos to authenticated;
