-- Plano de professor auxiliar devolvido pela CPA/Pró-Reitoria volta para o
-- coordenador do curso (status aguardando_coordenador, com o comentário), nunca
-- para o próprio auxiliar. A interface já faz isso; a trava no banco garante o
-- mesmo para qualquer caminho de escrita (versão antiga da tela, sistema anterior).
create or replace function public.planos_devolucao_ao_coordenador()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'devolvido'
     and new.curso_id is not null
     and exists (select 1 from usuarios a where a.id = new.usuario_id and a.role = 'professor_auxiliar')
     and exists (
       select 1 from usuario_cursos uc join usuarios c on c.id = uc.usuario_id
       where uc.curso_id = new.curso_id and c.role = 'coordenador'
     )
  then
    new.status := 'aguardando_coordenador';
  end if;
  return new;
end;
$$;

drop trigger if exists planos_devolucao_ao_coordenador on public.planos_acao;
create trigger planos_devolucao_ao_coordenador
  before insert or update of status on public.planos_acao
  for each row execute function public.planos_devolucao_ao_coordenador();

-- Corrige as devoluções que já tinham ido para o auxiliar (mantém comentário, quem devolveu e quando)
update public.planos_acao p
set status = 'aguardando_coordenador'
where p.status = 'devolvido'
  and p.curso_id is not null
  and exists (select 1 from usuarios a where a.id = p.usuario_id and a.role = 'professor_auxiliar')
  and exists (
    select 1 from usuario_cursos uc join usuarios c on c.id = uc.usuario_id
    where uc.curso_id = p.curso_id and c.role = 'coordenador'
  );
