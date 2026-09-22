# Portal CPA UniFECAF

Sistema de acompanhamento da CPA (Comissão Própria de Avaliação) da UniFECAF:
cada coordenador analisa os resultados do próprio curso, monta um plano de
ação em cima dos comentários reais dos alunos, e esse plano passa por uma
cadeia de aprovação (Coordenador → CPA → Pró-Reitoria) até virar um PDF
institucional e uma peça de comunicação de retorno para os alunos.

Mantido por Yago Carvalho de Brito (Analista de Regulatório / CPA), com
apoio do Claude.

## Arquitetura

- **Frontend**: `index.html` — site inteiro em um único arquivo estático,
  sem build. Hospedado no **Cloudflare Workers**
  (`cpa-unifecaf.yago-brito.workers.dev`).
- **Backend**: **Supabase** (Postgres / SQL) para dados operacionais —
  usuários, planos de ação, permissões. Escrita em `planos_acao` passa pela
  Edge Function `plano-acao-escrever`, que valida no servidor quem pode
  escrever em cada item (dono do item, papéis de acesso amplo, ou vínculo
  real de coordenação de curso).
- **PDF institucional**: gerado no client com jsPDF a partir dos planos de
  ação aprovados.
- **Dados da pesquisa CPA** (notas, comentários dos alunos, avaliação por
  professor): hoje embutidos como listas JavaScript (`CURSOS`,
  `COMENTARIOS`) dentro do próprio `index.html` — por isso o arquivo passa
  de 7MB. Foram gerados uma vez a partir de um Excel exportado da pesquisa
  original. **Isso é uma dívida técnica conhecida**: não há suporte a
  múltiplos ciclos de CPA nem forma de atualizar sem reconstruir o arquivo
  inteiro. O plano é migrar esses dados para tabelas no Supabase com campo
  de ciclo (ex: `"2026.1"`).

## `templates/post-cpa/`

Gerador da peça visual de retorno da CPA para redes sociais (Instagram/
WhatsApp), independente do portal principal:

- `template.html` — layout 1080×1350px autocontido (paleta oficial
  navy `#12395E` / azul `#1C6DB3` / verde `#2FAE60`, fontes Poppins +
  Work Sans).
- `render.cjs` — script Node + Playwright que injeta os dados de um curso
  (JSON) no template e exporta a imagem final em PNG.
- `exemplo-odontologia.json` — exemplo do formato de dados por curso.

Uso: duplicar o JSON de exemplo com os dados do curso e rodar
`node render.cjs meu-curso.json`.

## Pendências conhecidas

Ver histórico de conversas com o Claude para o detalhamento completo. Os
pontos mais importantes em aberto:

- Migrar os dados da pesquisa CPA (hoje no HTML) para o Supabase, com
  suporte a múltiplos ciclos.
- Confirmar se a Edge Function `admin-resetar-senha` força troca de senha
  no próximo login.
- Fila única / aprovação em lote para Pró-Reitoria e CPA.
- Revisão do questionário da CPA para cobrir os eixos SINAES ainda fracos
  (Planejamento/Avaliação Institucional e Desenvolvimento Institucional).
