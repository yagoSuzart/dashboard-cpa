-- CPA Docentes e Administrativo: controle total da Coordenação da CPA.
-- 1) Abertura programada (abre_em) além do fechamento (fecha_em); antes de abrir, só admin/Coordenação da CPA respondem (teste).
-- 2) Número de elegíveis por público, para a página aberta mostrar a % de participação.
-- 3) Texto das perguntas editável mesmo com respostas; estrutura (perguntas, escalas, públicos) só sem respostas.
-- 4) Zerar respostas só pela função colab_zerar (admin/Coordenação da CPA, com confirmação), registrado em auditoria.
-- 5) Respostas imutáveis: ninguém altera; apagar só pelo colab_zerar.

alter table public.cpa_colab_campanhas
  add column if not exists abre_em timestamptz,
  add column if not exists elegiveis_docente int check (elegiveis_docente is null or elegiveis_docente >= 0),
  add column if not exists elegiveis_tecnico int check (elegiveis_tecnico is null or elegiveis_tecnico >= 0);

-- Auditoria: quem abriu, fechou, mudou datas, editou o questionário ou zerou respostas
create table if not exists public.cpa_colab_auditoria (
  id bigint generated always as identity primary key,
  campanha_id uuid,
  acao text not null,
  detalhe jsonb not null default '{}'::jsonb,
  usuario_id uuid default auth.uid(),
  em timestamptz not null default now()
);
alter table public.cpa_colab_auditoria enable row level security;
drop policy if exists colab_auditoria_le on public.cpa_colab_auditoria;
create policy colab_auditoria_le on public.cpa_colab_auditoria for select to authenticated
  using (public.cpa_papel() = any (array['admin','diretor_cpa','pro_reitoria']));
grant select on public.cpa_colab_auditoria to authenticated;
revoke insert, update, delete on public.cpa_colab_auditoria from anon, authenticated;

-- Está aberta agora? (aberta, depois da abertura programada e antes do fechamento)
create or replace function public.colab_esta_aberta(c public.cpa_colab_campanhas)
returns boolean language sql stable set search_path = public as $$
  select c.aberta and (c.abre_em is null or c.abre_em <= now()) and (c.fecha_em is null or c.fecha_em >= (now() at time zone 'America/Sao_Paulo')::date)
$$;

create or replace function public.colab_pode_testar()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.cpa_papel() = any (array['admin','diretor_cpa']), false)
$$;

-- Assinatura da estrutura: ids, públicos e escalas (o texto pode mudar sem mexer nas respostas)
create or replace function public.colab_estrutura(inst jsonb)
returns text language sql immutable as $$
  select coalesce(string_agg(x, '|' order by x), '') from (
    select (p->>'id') || ':' || coalesce(p->>'p', '') || ':' || coalesce(g->>'escala', '') x
    from jsonb_array_elements(coalesce(inst->'blocos', '[]')) b, jsonb_array_elements(b->'grupos') g, jsonb_array_elements(g->'perguntas') p
    union all select 'nps:' || coalesce(inst->'final'->'nps'->>'id', '')
    union all select 'aberta:' || (a->>'id') from jsonb_array_elements(coalesce(inst->'final'->'abertas', '[]')) a
    union all select 'bloco:' || (b->>'id') from jsonb_array_elements(coalesce(inst->'blocos', '[]')) b
  ) t
$$;

create or replace function public.colab_trava_instrumento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.instrumento is distinct from old.instrumento
     and exists (select 1 from public.cpa_colab_respostas r where r.campanha_id = old.id)
     and public.colab_estrutura(new.instrumento) is distinct from public.colab_estrutura(old.instrumento) then
    raise exception 'Este período já tem respostas: dá para corrigir textos, mas não acrescentar, excluir ou trocar o público/escala de perguntas. Zere as respostas de teste ou crie um novo período.';
  end if;
  if new.instrumento is not null and length(new.instrumento::text) > 200000 then
    raise exception 'Questionário grande demais.';
  end if;
  -- auditoria
  if new.aberta is distinct from old.aberta then
    insert into public.cpa_colab_auditoria (campanha_id, acao) values (new.id, case when new.aberta then 'abriu para respostas' else 'fechou para respostas' end);
  end if;
  if new.abre_em is distinct from old.abre_em or new.fecha_em is distinct from old.fecha_em then
    insert into public.cpa_colab_auditoria (campanha_id, acao, detalhe) values (new.id, 'mudou as datas', jsonb_build_object('abre_em', new.abre_em, 'fecha_em', new.fecha_em));
  end if;
  if new.instrumento is distinct from old.instrumento then
    insert into public.cpa_colab_auditoria (campanha_id, acao) values (new.id, 'editou o questionário');
  end if;
  if new.elegiveis_docente is distinct from old.elegiveis_docente or new.elegiveis_tecnico is distinct from old.elegiveis_tecnico then
    insert into public.cpa_colab_auditoria (campanha_id, acao, detalhe) values (new.id, 'mudou o número de elegíveis', jsonb_build_object('docente', new.elegiveis_docente, 'administrativo', new.elegiveis_tecnico));
  end if;
  return new;
end $$;

-- Respostas imutáveis: nunca se alteram; só o colab_zerar apaga
create or replace function public.colab_respostas_protege()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'Respostas não podem ser alteradas.';
  end if;
  if tg_op = 'DELETE' and coalesce(current_setting('cpa.zerando', true), '') <> 'sim' then
    raise exception 'Respostas só podem ser apagadas pelo botão “Zerar respostas” da Coordenação da CPA.';
  end if;
  return old;
end $$;
drop trigger if exists colab_respostas_protege on public.cpa_colab_respostas;
create trigger colab_respostas_protege before update or delete on public.cpa_colab_respostas
  for each row execute function public.colab_respostas_protege();

-- Link público: o questionário e o estado (aberta agora, abre em, fecha em, se quem abriu pode testar)
drop function if exists public.colab_campanha_publica(text);
create function public.colab_campanha_publica(p_codigo text)
returns table(titulo text, ciclo text, versao text, aberta boolean, abre_em timestamptz, fecha_em date, instrumento jsonb, pode_testar boolean)
language sql stable security definer set search_path = public as $$
  select c.titulo, c.ciclo, c.versao, public.colab_esta_aberta(c), c.abre_em, c.fecha_em, c.instrumento, public.colab_pode_testar()
  from public.cpa_colab_campanhas c where c.codigo = p_codigo
$$;
revoke all on function public.colab_campanha_publica(text) from public;
grant execute on function public.colab_campanha_publica(text) to anon, authenticated;

create or replace function public.colab_enviar(p_codigo text, p_publico text, p_perfil jsonb, p_notas jsonb, p_abertas jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  camp public.cpa_colab_campanhas%rowtype;
  k text; v jsonb;
begin
  select * into camp from public.cpa_colab_campanhas where codigo = p_codigo;
  if not found then raise exception 'Avaliação não encontrada.'; end if;
  -- Antes de abrir (ou fechada), só a Coordenação da CPA consegue responder, para testar
  if not public.colab_esta_aberta(camp) and not public.colab_pode_testar() then
    if camp.abre_em is not null and camp.abre_em > now() then
      raise exception 'Esta avaliação abre em %.', to_char(camp.abre_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI');
    end if;
    raise exception 'Esta avaliação não está aberta.';
  end if;
  if p_publico not in ('docente', 'tecnico') then raise exception 'Público inválido.'; end if;
  if jsonb_typeof(p_notas) <> 'object' or jsonb_typeof(p_abertas) <> 'object' or jsonb_typeof(p_perfil) <> 'object' then
    raise exception 'Formato inválido.';
  end if;
  if (select count(*) from jsonb_object_keys(p_notas)) > 150 or (select count(*) from jsonb_object_keys(p_abertas)) > 40
     or length(p_perfil::text) > 600 or length(p_abertas::text) > 200000 then
    raise exception 'Resposta grande demais.';
  end if;
  if (select count(*) from jsonb_object_keys(p_notas)) = 0 then raise exception 'Nenhuma resposta.'; end if;
  for k, v in select * from jsonb_each(p_notas) loop
    if k !~ '^[a-z0-9_]{1,40}$' or jsonb_typeof(v) <> 'number' or (v::text)::numeric not in (0,1,2,3,4,5,6,7,8,9,10) then
      raise exception 'Resposta inválida.';
    end if;
  end loop;
  for k, v in select * from jsonb_each(p_abertas) loop
    if k !~ '^[a-z0-9_]{1,40}$' or jsonb_typeof(v) <> 'string' or length(v #>> '{}') > 4000 then
      raise exception 'Comentário inválido.';
    end if;
  end loop;
  insert into public.cpa_colab_respostas (campanha_id, publico, versao, perfil, notas, abertas)
    values (camp.id, p_publico, camp.versao, p_perfil, p_notas, p_abertas);
  return true;
end $$;
revoke all on function public.colab_enviar(text, text, jsonb, jsonb, jsonb) from public;
grant execute on function public.colab_enviar(text, text, jsonb, jsonb, jsonb) to anon, authenticated;

-- Zerar as respostas de um período (só admin/Coordenação da CPA, digitando ZERAR). Fica na auditoria.
create or replace function public.colab_zerar(p_campanha uuid, p_confirma text)
returns int language plpgsql security definer set search_path = public as $$
declare n int; d int; t int;
begin
  if not public.colab_pode_testar() then raise exception 'Só a Coordenação da CPA pode zerar as respostas.'; end if;
  if p_confirma is distinct from 'ZERAR' then raise exception 'Digite ZERAR para confirmar.'; end if;
  select count(*), count(*) filter (where publico = 'docente'), count(*) filter (where publico = 'tecnico') into n, d, t
    from public.cpa_colab_respostas where campanha_id = p_campanha;
  perform set_config('cpa.zerando', 'sim', true);
  delete from public.cpa_colab_respostas where campanha_id = p_campanha;
  perform set_config('cpa.zerando', '', true);
  insert into public.cpa_colab_auditoria (campanha_id, acao, detalhe) values (p_campanha, 'zerou as respostas', jsonb_build_object('apagadas', n, 'docentes', d, 'administrativo', t));
  return n;
end $$;
revoke all on function public.colab_zerar(uuid, text) from public;
grant execute on function public.colab_zerar(uuid, text) to authenticated;

notify pgrst, 'reload schema';

-- Permissões finas (verificador de segurança do Supabase)
alter function public.colab_estrutura(jsonb) set search_path = public;
revoke execute on function public.colab_zerar(uuid, text) from anon;
revoke execute on function public.colab_trava_instrumento() from anon, authenticated, public;
revoke execute on function public.colab_pode_testar() from anon, authenticated, public;
revoke execute on function public.colab_respostas_protege() from anon, authenticated, public;
