# Portal CPA · Inventário de tudo o que o Plano de Ação faz hoje

Esta é a lista de conferência da migração do **Plano de Ação da CPA** (o `index.html` publicado no
Cloudflare) para o **Portal CPA**. Nenhum item sai daqui sem ter sido refeito **e conferido** no Portal.
O sistema atual continua no ar até todos os itens estarem marcados.

Legenda: ⬜ a fazer · 🟨 feito, aguardando conferência · ✅ conferido no Portal

## Andamento

- **Portal v0.1 (24/09/2026):** login, visão geral, cursos (com mapa de calor e professores), pergunta por pergunta,
  comentários, planos (leitura, com trilho de aprovação), setores e importação da planilha da CPA com conferência.
  Os itens 🟨 abaixo estão prontos e aguardam a conferência lado a lado com o sistema atual.
- **Portal v0.3 (25/09/2026):** tudo o que o sistema anterior faz entrou no Portal: plano de ação completo (sem rascunho),
  revisão da equipe, acompanhamento da supervisão, núcleos, setores, agenda e prazos, PDFs, feedback para os alunos,
  solicitar acesso, primeiro acesso e administração. Testado com um banco simulado em todos os perfis (computador e
  celular). O sistema anterior continua em `/antigo/` até a conferência terminar.

## Regras da migração

1. **Os dados não mudam de lugar.** O Portal usa o mesmo banco (Supabase *Plano de Ação - CPA*): as mesmas
   tabelas de usuários, cursos, planos, comentários e agenda. Nenhum plano, usuário ou comentário é apagado ou
   reescrito.
2. **Números e comentários sempre literais.** O Portal mostra os comentários como os alunos escreveram e as
   notas exatamente como estão na fonte. Nenhum texto é resumido ou corrigido.
3. **Toda importação gera um relatório de conferência.** Ao importar a planilha de respostas da CPA, o Portal
   mostra quantas linhas leu, quantas respostas e quantos comentários entraram, por questionário e por curso, para
   bater com a planilha original. Se algo não bater, a importação não é gravada.
4. **Dados pessoais não sobem.** CPF, RA e identificadores de alunos e professores são descartados no
   computador de quem importa, antes de qualquer envio.
5. **Troca só com as duas versões lado a lado.** Antes de desligar o sistema atual, as telas do Portal são
   comparadas com as atuais, curso a curso, usando o mesmo login.

## Pendências encontradas na análise (resolver antes da troca)

- ⬜ **Comentários: 23.184 no `index.html` × 22.309 no banco.** Causa encontrada: os 875 que faltam são todos de
  *Docência e Tutoria*, com professor, e têm menos de 10 caracteres ("." sozinho em 420 deles, "ok", "bom"...). Eles
  ficaram de fora quando o banco foi carregado. Falta a decisão de inserir esses 875 no banco, como os alunos escreveram.
- 🟨 **"Ações da direção" do(a) diretor(a) de núcleo não estavam sendo salvas** (o sistema anterior gravava numa tabela
  `app_storage` que não existe). Agora têm tabela própria, `acoes_direcao`, com regras de acesso.
- ⬜ **Alunos respondentes por curso e notas de Lives e Tutoria** só existem dentro do `index.html` antigo (números por
  curso, sem dado pessoal). Falta a decisão de levar esses números para o banco; até lá, esses cartões não aparecem.
- ⬜ **Comentários por setor no PDF do setor:** o `index.html` antigo tinha só 9 frases de exemplo fixas no código. O Portal
  usa a busca por palavras-chave nos comentários de Infraestrutura.
- 🟨 **Dados embutidos no `index.html`:** no Portal, notas e comentários vêm do banco, carregados depois do login.

## Perfis (9) — cada um continua vendo exatamente o que vê hoje

| Perfil | Rótulo no sistema |
| --- | --- |
| `coordenador` | Coordenador de Curso |
| `professor_auxiliar` | Professor(a) Auxiliar · Coordenador Adjunto |
| `diretor_nucleo` | Diretor(a) de Núcleo |
| `diretor_nucleo_setor` | Supervisor(a) de Núcleo de Setores |
| `pro_reitoria` | Pró-reitoria Acadêmica |
| `diretor_cpa` | Coordenadora da CPA |
| `comissao_cpa` | Comissão CPA (membro) |
| `admin` | Gestor(a) Técnico(a) do Sistema |
| `setor` | Responsável de Setor |

- 🟨 Escopo de cursos por pessoa (`usuario_cursos`), com a regra atual do diretor de núcleo (nas telas gerais só os
  cursos que coordena; visão ampla na aba do núcleo)
- 🟨 Supervisão por papel: `pro_reitoria`, `diretor_cpa`, `diretor_nucleo`, `admin` (supervisores) e
  `pro_reitoria`, `diretor_cpa`, `admin`, `comissao_cpa` (visão global)

## Acesso e conta

- 🟨 Login com e-mail e senha (Supabase Auth) — sem login com Google
- 🟨 Primeiro acesso: trocar a senha ou manter
- 🟨 Mostrar/ocultar senha
- 🟨 Esqueci a senha (e-mail com link) e tela de redefinição
- 🟨 Solicitar acesso: nome, e-mail, senha, setor/cargo, perfil, cursos, setor de infraestrutura, núcleo de setores
- 🟨 Sair

## Resultados (coordenação, direção, CPA, Pró-Reitoria)

- 🟨 Visão geral: filtros de modalidade e curso, anel de progresso, nota geral, indicadores
- 🟨 Quadro (kanban) dos planos por situação
- 🟨 Pontos fortes e oportunidades por dimensão, com as mensagens atuais
- 🟨 Top cursos
- 🟨 Visão executiva: ranking de cursos críticos, professores críticos, comentários críticos (acordeões)
- 🟨 Barras por dimensão
- 🟨 Os 6 questionários como itens próprios do menu: Conteúdo das Disciplinas, Infraestrutura e Atendimento,
  Políticas Acadêmicas, Políticas de Gestão, Docência e Tutoria, Satisfação Geral
- 🟨 Por turma (notas por turma e dimensão)
- 🟨 Por professor: resumo, pontos a melhorar, busca, "ver todos", paginação de 8, comentários por professor
  (não aparece para professor auxiliar)
- ⬜ Lives e tutoria (notas e respondentes)
- ⬜ Alunos respondentes por curso
- 🟨 Comentários: filtros de modalidade, curso e categoria; selos de sentimento (bom, atenção, ruim); marcação de
  comentários negativos por palavras-chave; paginação
- 🟨 **Novo:** nota de cada pergunta do questionário, com a distribuição das respostas, a partir da planilha da CPA.
  Escala de 1 a 5, mostrada só como número, sem nome para nenhuma nota ("X alunos deram 1 para a
  pergunta Y"). A resposta 6 (aluno que não usa aquele espaço ou serviço) aparece contada à parte e fica
  fora da média.
- ⬜ **Novo:** taxa de participação por curso (`respondentes-cpa-G.2026_1.csv`)

## Núcleos e setores

- 🟨 Aba do núcleo (Saúde; Engenharias e Tecnologia): cursos do núcleo, planos dos coordenadores
- 🟨 Ações da direção por curso: curso, título, descrição, prioridade, prazo, lista (ver pendência acima)
- 🟨 Setor — visão geral: anel, nota, kanban, oportunidades, ranking dos setores, barras, comentários do setor, busca
  por palavras-chave (várias separadas por vírgula)
- 🟨 Setor — demandas recebidas dos cursos (planos encaminhados para o setor), com edição
- 🟨 Setor — plano de melhoria do setor, com modelo automático a partir do ponto mais frágil
- 🟨 Supervisor(a) de núcleo de setores (Facilities: Limpeza, Manutenção, Segurança): visão geral e demandas

## Plano de ação

- 🟨 Criar item: dimensões marcadas, título, descrição, indicador, prioridade, prazo, comentários selecionados
- 🟨 Modelos prontos por dimensão ("usar modelo")
- 🟨 Dependência de outro setor (demanda externa → área, queixa do aluno, prazo estimado, "atendido pelo setor")
- 🟨 Lembrete do plano e contexto causa → efeito
- 🟨 Revisão dos planos dos professores auxiliares pelo coordenador (puxar para revisão, enviar para validação)
- 🟨 Aprovar, devolver com comentário, reenviar, editar, marcar como resolvido/concluído, excluir
- 🟨 Conversa sobre cada plano (coordenador ou setor)
- 🟨 Supervisão: planos de todos os cursos e de todos os setores
- 🟨 Selo de situação, prazo e urgência (atrasado, vence em 7 dias, em dia, aprovado)
- 🟨 Escrita pelas funções do servidor (`plano-acao-escrever`), como hoje
- 🟨 **Mudança pedida:** sem rascunho. O plano é escrito dentro de cada questionário e, ao enviar, já vai para a
  análise. Quem enviou continua podendo editar até a aprovação. O coordenador aprova só os planos da equipe
  (professores auxiliares). O único rascunho que existe hoje vira "enviado".

## Documentos e comunicação

- 🟨 PDF do curso, PDF geral, PDF do setor, PDF de todos os planos, PDF "meu plano" (mesmo conteúdo dos atuais)
- 🟨 Envio de feedback para os alunos: peça visual gerada a partir dos itens do plano (capa, itens, encerramento,
  logo, foto do campus)
- 🟨 Agenda de entregas: criar entrega, mudar prazo, cobrar de novo, conferir cumprimento, cobrança dos
  auxiliares, e-mail pela função `notificar-entrega`
- 🟨 Prazos (admin): resumo de atrasados, vencendo, em dia e aprovados

## Administração

- 🟨 Aprovações pendentes: aprovar ou recusar solicitações de acesso (`admin-aprovar-solicitacao`)
- 🟨 Gerenciar usuários: editar (`admin-editar-usuario`), excluir (`admin-excluir-usuario`), resetar senha
  (`admin-resetar-senha`)

## Banco de perguntas (vem do Perguntas-CPA)

- ⬜ Tudo o que o Perguntas-CPA faz hoje (visão geral, perguntas de hoje, montar a base, cobertura, setores,
  relatório para o T.I, visão consolidada, sobre), dentro do Portal e com o login do Portal
