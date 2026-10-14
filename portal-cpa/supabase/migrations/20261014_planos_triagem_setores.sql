-- Encaminhamento aos setores com triagem do admin (Yago): o plano que depende de outro setor só
-- chega ao setor depois de liberado; pode ir para mais de um setor; setores sem acesso no portal
-- ficam sob a responsabilidade do admin.
alter table public.planos_acao
  add column if not exists areas_extra text[] not null default '{}',
  add column if not exists triagem text check (triagem in ('liberado')),
  add column if not exists triagem_obs text,
  add column if not exists triagem_por text,
  add column if not exists triagem_em timestamptz;

alter policy setor_ve_demandas_roteadas on public.planos_acao
  using (tipo = 'curso' and externa = true and triagem = 'liberado' and exists (
    select 1 from usuarios u
    where u.id = auth.uid() and u.role = 'setor' and (u.setor_id = planos_acao.area or u.setor_id = any (planos_acao.areas_extra))
  ));
