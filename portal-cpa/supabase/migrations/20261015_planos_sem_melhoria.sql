-- Declaração "sem pontos a melhorar": o coordenador sinaliza que, naquele curso/modalidade/questionário,
-- não identificou pontos de melhoria. Fica em planos_acao (mesmo fluxo de envio e análise da CPA) e conta
-- como entrega no acompanhamento.
alter table public.planos_acao add column if not exists sem_melhoria boolean not null default false;
comment on column public.planos_acao.sem_melhoria is 'Declaração do coordenador: neste curso/modalidade/questionário não há pontos a melhorar. Conta como entrega e passa pela mesma análise da CPA.';
