-- Próxima CPA: a CPA analisa pergunta por pergunta (aprova ou reprova) antes de enviar para a Pró-Reitoria.
-- null = ainda não analisada pela CPA. O que a Pró-Reitoria já decidiu não volta para a análise da CPA.
alter table public.cpa_proposta_itens
  add column if not exists decisao_cpa text check (decisao_cpa in ('aprovada', 'reprovada'));
