// Banco do Plano de Ação da CPA (o mesmo que o sistema atual usa).
// A chave "publishable" é pública por natureza: quem protege os dados são as regras (RLS) do banco.
export const SUPABASE = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://marorhkoyorptmzuoswr.supabase.co',
  chave: import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_7qhkRwPXLfeqQlMKi9n2jw_o6V8IR4r',
}

// Endereços dos sistemas que continuam no ar durante a migração.
// SISTEMA_ATUAL: onde os planos são criados e aprovados até essa etapa chegar ao Portal (vazio = esconde o link).
export const LINKS = {
  sistemaAtual: import.meta.env.VITE_SISTEMA_ATUAL_URL || '',
  bancoPerguntas: 'https://perguntas-cpa.pages.dev',
}

export const ROLE_LABELS = {
  coordenador: 'Coordenador(a) de Curso',
  professor_auxiliar: 'Professor(a) Auxiliar · Coordenador(a) Adjunto(a)',
  diretor_nucleo: 'Diretor(a) de Núcleo',
  diretor_nucleo_setor: 'Supervisor(a) de Núcleo de Setores',
  pro_reitoria: 'Pró-Reitoria Acadêmica',
  diretor_cpa: 'Coordenação da CPA',
  comissao_cpa: 'Comissão CPA',
  admin: 'Gestor(a) Técnico(a) do Sistema',
  setor: 'Responsável de Setor',
}

// Mesmas regras do sistema atual
export const GLOBAL_SUPERVISOR_ROLES = ['pro_reitoria', 'diretor_cpa', 'admin', 'comissao_cpa']
export const IMPORTA_ROLES = ['admin', 'diretor_cpa']

export const MODALIDADE_LABEL = { EAD: 'EAD', PRESENCIAL: 'Presencial', SEMIPRESENCIAL: 'Semipresencial' }

// As 5 dimensões com nota de 1 a 5 e a Satisfação Geral (0 a 10), como no sistema atual
export const DIMENSOES = [
  'Conteúdo das Disciplinas',
  'Infraestrutura e Atendimento',
  'Políticas Acadêmicas',
  'Políticas de Gestão',
  'Docência e Tutoria',
]
export const SATISFACAO = 'Satisfação Geral'
export const META = 4

export const STATUS_PLANO = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aguardando_coordenador: 'Com o coordenador',
  aguardando_pro_reitoria: 'Com a Pró-Reitoria',
  aprovado: 'Aprovado',
  devolvido: 'Devolvido para ajuste',
  concluido: 'Concluído',
}
// Ordem do trilho (rascunho entra como "enviado", conforme o novo fluxo sem rascunho)
export const TRILHO = ['enviado', 'aguardando_coordenador', 'aguardando_pro_reitoria', 'aprovado', 'concluido']
