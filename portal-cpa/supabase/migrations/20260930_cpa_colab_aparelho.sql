-- Marca técnica do aparelho (hash SHA-256 das características do navegador + código do período):
-- não identifica a pessoa; serve para avisar "este aparelho já respondeu" e para mostrar possíveis duplicadas.
alter table public.cpa_colab_respostas add column if not exists aparelho text;
create index if not exists cpa_colab_respostas_aparelho on public.cpa_colab_respostas (campanha_id, aparelho);

create or replace function public.colab_aparelho_ja_respondeu(p_codigo text, p_aparelho text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.cpa_colab_respostas r join public.cpa_colab_campanhas c on c.id = r.campanha_id
    where c.codigo = p_codigo and p_aparelho ~ '^[a-f0-9]{64}$' and r.aparelho = p_aparelho)
$$;
revoke all on function public.colab_aparelho_ja_respondeu(text, text) from public;
grant execute on function public.colab_aparelho_ja_respondeu(text, text) to anon, authenticated;

-- colab_enviar ganhou o parâmetro p_aparelho (opcional, validado como hash de 64 caracteres hexadecimais)
-- e grava o valor na coluna aparelho. O restante das validações é o mesmo de 20260930_cpa_colaboradores.sql.
