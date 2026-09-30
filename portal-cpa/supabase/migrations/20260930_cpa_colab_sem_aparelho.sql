-- Decisão da CPA: sem marca de aparelho; cada pessoa responde uma vez, pela confiança.
-- (Desfaz a coluna aparelho e a função colab_aparelho_ja_respondeu; colab_enviar volta a ter 5 parâmetros,
-- com as mesmas validações de 20260930_cpa_colaboradores.sql.)
drop function if exists public.colab_aparelho_ja_respondeu(text, text);
drop index if exists public.cpa_colab_respostas_aparelho;
alter table public.cpa_colab_respostas drop column if exists aparelho;
drop function if exists public.colab_enviar(text, text, jsonb, jsonb, jsonb, text);
