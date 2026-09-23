// Conexão com o Supabase (login com Google e escolhas de cada pessoa).
// A chave "publishable" é pública por natureza: a proteção dos dados é feita pelas regras (RLS) do banco.
export const SUPABASE = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://ozqlgsolivftewmwksva.supabase.co',
  chave: import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_8mqFeW0LZ2PjKB5cDPD9rw_7-04XN7n',
  // domínio sugerido na tela de escolha de conta do Google
  dominio: 'fecaf.com.br',
}

// Informações do projeto exibidas na página "Sobre o sistema". Edite à vontade.
export const PROJETO = {
  nome: 'Perguntas-CPA',
  versao: '1.2',
  autor: 'Yago Brito',
  cargo: 'Analista de Regulatório · CPA UniFECAF',
  nota: 'Idealizado e desenvolvido com apoio de IA (Claude Code).',
}

export const NOVIDADES = [
  {
    versao: '1.2',
    itens: [
      'Login com a conta Google institucional (Supabase), sem senha nova e sem cartão de crédito',
      'Tela “Quem pode entrar” para o administrador liberar ou remover acessos pelo próprio painel',
    ],
  },
  {
    versao: '1.1',
    itens: [
      'Gabarito SINAES na visão consolidada: mostra se todos os eixos e dimensões foram atendidos',
      'Editar a redação de qualquer pergunta proposta, mantendo o original da planilha',
      'Criar perguntas escolhendo eixo, dimensão e tipo de resposta',
      'Busca rápida (Ctrl + K) em todas as perguntas',
      'Em “Montar a base”, as perguntas que já usamos aparecem em cada eixo e dimensão, e cada proposta mostra se cobre uma lacuna',
    ],
  },
  {
    versao: '1.0',
    itens: [
      'Mapa SINAES com as perguntas do instrumento 2026.1',
      'Curadoria com leitura às cegas, login por e-mail e relatório para o T.I',
    ],
  },
]
