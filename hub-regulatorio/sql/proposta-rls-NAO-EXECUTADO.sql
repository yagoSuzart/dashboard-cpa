-- =====================================================================
--  PROPOSTA — NÃO FOI EXECUTADA. Rodar só depois de confirmar com o Yago.
--  Projeto Supabase: hub-regulatorio-unifecaf (ozqlgsolivftewmwksva)
--  Diagnóstico de 29/10/2026.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) link_overrides_pos_emec e link_overrides_curso_guia estão SEM RLS:
--    qualquer pessoa com a chave pública pode ler, alterar e APAGAR.
--    Padrão das outras tabelas: RLS ligada + política "public read" (só SELECT).
--
--    ATENÇÃO: se o Consult GRAVA nessas tabelas pelo navegador (ex.: editar um link),
--    depois disto a gravação para de funcionar. Confirmar antes de rodar.
-- ---------------------------------------------------------------------
ALTER TABLE public.link_overrides_pos_emec   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_overrides_curso_guia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON public.link_overrides_pos_emec
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read" ON public.link_overrides_curso_guia
  FOR SELECT TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------
-- 2) visitas_polos, visita_fotos e visita_anexos têm políticas que deixam
--    ANÔNIMOS inserir e apagar ("public insert" / "public delete").
--    Hoje estão vazias (0 linhas). Provável uso: app de visita virtual dos polos.
--    Se nenhum sistema grava nelas sem login, remover as políticas de escrita:
-- ---------------------------------------------------------------------
-- DROP POLICY "public insert" ON public.visitas_polos;
-- DROP POLICY "public delete" ON public.visitas_polos;
-- DROP POLICY "public insert" ON public.visita_fotos;
-- DROP POLICY "public delete" ON public.visita_fotos;
-- DROP POLICY "public insert" ON public.visita_anexos;
-- DROP POLICY "public delete" ON public.visita_anexos;

-- ---------------------------------------------------------------------
-- 3) Para o painel calcular VENCIMENTO de atos (Bloco 2), falta uma tabela
--    como esta. Só leitura pública; escrita virá com o login (Bloco 5).
-- ---------------------------------------------------------------------
-- CREATE TABLE public.atos_autorizativos (
--   id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   curso_id         uuid NOT NULL REFERENCES public.cursos(id),
--   tipo             text NOT NULL CHECK (tipo IN ('autorizacao','reconhecimento','renovacao_reconhecimento')),
--   numero_portaria  text,
--   data_publicacao  date,
--   data_validade    date,
--   link_dou         text,
--   created_at       timestamptz DEFAULT now(),
--   updated_at       timestamptz DEFAULT now()
-- );
-- ALTER TABLE public.atos_autorizativos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read" ON public.atos_autorizativos FOR SELECT TO anon, authenticated USING (true);
