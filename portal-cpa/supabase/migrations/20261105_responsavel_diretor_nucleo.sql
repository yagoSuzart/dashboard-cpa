-- Quem responde pelo curso: o coordenador ou, nos cursos sem coordenador, o diretor de núcleo vinculado.
-- Plano de professor auxiliar devolvido volta para essa pessoa (antes só voltava se houvesse role 'coordenador').
CREATE OR REPLACE FUNCTION public.planos_devolucao_ao_coordenador()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if new.status = 'devolvido'
     and new.curso_id is not null
     and exists (select 1 from usuarios a where a.id = new.usuario_id and a.role = 'professor_auxiliar')
     and exists (
       select 1 from usuario_cursos uc join usuarios c on c.id = uc.usuario_id
       where uc.curso_id = new.curso_id and c.role in ('coordenador', 'diretor_nucleo')
     )
  then
    new.status := 'aguardando_coordenador';
  end if;
  return new;
end;
$function$;
