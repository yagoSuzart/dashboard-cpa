// Plano de ação: criar, editar e mover pelo trilho, com as mesmas regras do sistema anterior.
// Criar é direto na tabela (a regra do banco só deixa criar em nome próprio); editar, mover e excluir
// passam pela função do servidor `plano-acao-escrever`, que confere o papel de quem pede.
import { sb } from './dados.js'
import { DIMENSOES, SATISFACAO, ROLE_LABELS } from './config.js'

// Quem escreve plano de curso (precisa ter cursos vinculados)
export const ESCREVE_PLANO = ['coordenador', 'professor_auxiliar', 'diretor_nucleo', 'admin', 'diretor_cpa', 'pro_reitoria']

export const CATEGORIAS_PLANO = [...DIMENSOES, SATISFACAO]
export const PRIORIDADES = ['Alta', 'Média', 'Baixa']

// Áreas para "esta ação depende de outra área" (mesmas opções do sistema anterior)
export const AREAS = [
  { v: 'nead', t: 'AVA / NEAD' },
  { v: 'ti', t: 'T.I. / Infraestrutura' },
  { v: 'biblioteca', t: 'Biblioteca' },
  { v: 'manutencao', t: 'Manutenção' },
  { v: 'limpeza', t: 'Limpeza' },
  { v: 'polos', t: 'Polos (feedback geral sobre os polos EAD/Semipresencial)' },
  { v: 'outro', t: 'Financeiro / Outra (não roteado a um setor específico)' },
]

export function nomeArea(area, setores = []) {
  if (!area) return ''
  const s = setores.find((x) => x.id === area)
  if (s) return s.nome
  if (area === 'polos') return 'Polos (EAD/Semipresencial)'
  return AREAS.find((a) => a.v === area)?.t || 'Financeiro / Outra'
}

// Modelos prontos por dimensão ("usar modelo"), com o mesmo texto do sistema anterior
export const MODELOS = {
  'Conteúdo das Disciplinas': {
    titulo: 'Atualizar e revisar o conteúdo das disciplinas com menor avaliação',
    descricao:
      'Revisar ementas, materiais e metodologia das disciplinas apontadas com menor nota, incorporando atualizações, exemplos práticos e alinhamento às expectativas relatadas pelos alunos nos comentários.',
    indicador: 'Elevar a nota da categoria em pelo menos 0,3 ponto na próxima pesquisa CPA',
  },
  'Infraestrutura e Atendimento': {
    titulo: 'Encaminhar e acompanhar as demandas de infraestrutura mais criticadas',
    descricao:
      'Mapear os pontos de infraestrutura mais citados nos comentários dos alunos (salas, laboratórios, Wi-Fi, atendimento) e formalizar a solicitação ao setor responsável, com acompanhamento até a resolução.',
    indicador: 'Resolver as solicitações encaminhadas em até 60 dias',
  },
  'Políticas Acadêmicas': {
    titulo: 'Reforçar a comunicação institucional sobre regras e calendário',
    descricao:
      'Melhorar a clareza e a frequência da comunicação sobre calendário acadêmico, normas e prazos, usando os canais já utilizados pelos alunos (e-mail, portal, mural digital).',
    indicador: 'Reduzir em 20% as reclamações sobre comunicação na próxima pesquisa',
  },
  'Políticas de Gestão': {
    titulo: 'Aproximar a coordenação dos alunos do curso',
    descricao:
      'Ampliar os canais de contato direto entre coordenação e alunos, com horários de atendimento fixos e resposta em prazo definido às demandas levantadas.',
    indicador: 'Reduzir o tempo médio de resposta às demandas dos alunos para até 3 dias úteis',
  },
  'Docência e Tutoria': {
    titulo: 'Apoiar o desenvolvimento didático do corpo docente',
    descricao:
      'Promover formação continuada e acompanhamento pedagógico dos professores com menor avaliação, com foco nos pontos citados pelos alunos nos comentários.',
    indicador: 'Elevar a nota de Docência e Tutoria em pelo menos 0,3 ponto na próxima pesquisa',
  },
}

// Modelo do setor, a partir da pergunta com a menor nota
export function modeloSetor(perguntas) {
  const [p] = [...perguntas].sort((a, b) => Number(a.nota) - Number(b.nota))
  if (!p) return null
  const nota = Number(p.nota).toFixed(2).replace('.', ',')
  return {
    titulo: `Melhorar o ponto avaliado como "${p.pergunta}"`,
    descricao: `Elaborar um plano de ação específico para tratar o ponto de menor avaliação do setor ("${p.pergunta}", nota ${nota} de 5), com etapas claras de execução e responsáveis definidos.`,
    indicador: `Elevar a nota de "${p.pergunta}" em pelo menos 0,3 ponto na próxima pesquisa`,
  }
}

// Papéis que podem marcar "Já resolvi" nos próprios planos (autoaprovação)
export const PAPEIS_AUTONOMOS = ['diretor_nucleo', 'coordenador', 'setor']

export const TEXTO_STATUS = {
  rascunho: 'Enviado',
  enviado: 'Aguardando análise da CPA',
  aguardando_coordenador: 'Aguardando revisão do coordenador do curso',
  aguardando_pro_reitoria: 'Validado pela CPA, aguardando a Pró-Reitoria',
  aprovado: 'Aprovado',
  devolvido: 'Devolvido para ajuste',
  concluido: 'Concluído',
}

export function diasAtePrazo(data) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.round((new Date(data + 'T00:00:00') - hoje) / 86400000)
}

// Selo do prazo, como no sistema anterior
export function seloPrazo(p) {
  if (!p.prazo || ['aprovado', 'concluido'].includes(p.status)) return null
  const d = diasAtePrazo(p.prazo)
  if (d < 0) return { t: `Atrasado há ${-d} ${d === -1 ? 'dia' : 'dias'}`, c: 'laranja' }
  if (d <= 7) return { t: `Vence em ${d} ${d === 1 ? 'dia' : 'dias'}`, c: 'laranja' }
  return { t: `Em dia · ${d} dias restantes`, c: 'verde' }
}

// 0 atrasado · 1 vence em 7 dias · 2 em dia · 3 aprovado · 4 concluído
export function urgencia(p) {
  if (p.status === 'concluido') return 4
  if (p.status === 'aprovado') return 3
  if (!p.prazo) return 2
  const d = diasAtePrazo(p.prazo)
  return d < 0 ? 0 : d <= 7 ? 1 : 2
}

export function hoje() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// Sem rascunho: ao enviar, o plano já vai para a análise.
// O plano do professor auxiliar passa antes pelo coordenador do curso.
export function statusDeEnvio(perfil) {
  return perfil.role === 'professor_auxiliar' ? 'aguardando_coordenador' : 'enviado'
}

export async function criarPlano(perfil, dados) {
  const status = statusDeEnvio(perfil)
  const registro = {
    tipo: dados.tipo || 'curso',
    curso_id: dados.tipo === 'setor' ? null : dados.curso_id,
    setor_id: dados.tipo === 'setor' ? dados.setor_id : null,
    categoria: dados.categoria || null,
    titulo: dados.titulo.trim(),
    descricao: dados.descricao.trim(),
    indicador: dados.indicador?.trim() || '',
    prioridade: dados.prioridade || 'Média',
    prazo: dados.prazo,
    externa: !!dados.externa,
    area: dados.externa ? dados.area : null,
    queixa_aluno: dados.externa ? dados.queixa_aluno?.trim() || null : null,
    prazo_estimado: dados.externa && dados.prazo_estimado ? dados.prazo_estimado : null,
    comentarios_selecionados: dados.comentarios_selecionados?.length ? dados.comentarios_selecionados : null,
    status,
    usuario_id: perfil.id,
    ...(status === 'aguardando_coordenador' ? { enviado_coordenador_em: new Date().toISOString() } : {}),
  }
  const { data, error } = await sb.from('planos_acao').insert(registro).select('*').single()
  if (error) throw new Error(traduzir(error))
  return data
}

async function escrever(body) {
  const { data, error } = await sb.functions.invoke('plano-acao-escrever', { body })
  if (data?.error) throw new Error(data.error)
  if (error) {
    // A função devolve a mensagem de erro no corpo; tenta ler para mostrar a causa real
    try {
      const corpo = await error.context?.json?.()
      if (corpo?.error) throw new Error(corpo.error)
    } catch (e) {
      if (e instanceof Error && e.message) throw e
    }
    throw new Error(traduzir(error))
  }
  return true
}

export const atualizarPlano = (itemId, patch) => escrever({ acao: 'update', itemId, patch })
export const excluirPlano = (itemId) => escrever({ acao: 'delete', itemId })

// Ações de cada etapa (as mesmas que a função do servidor aceita)
export const acoes = {
  editar: (id, c) =>
    atualizarPlano(id, { titulo: c.titulo.trim(), descricao: c.descricao.trim(), indicador: c.indicador?.trim() || '', prioridade: c.prioridade, prazo: c.prazo }),
  validarCPA: (id, perfil) =>
    atualizarPlano(id, { status: 'aguardando_pro_reitoria', comentario_revisor: null, revisado_em: new Date().toISOString(), validado_por: perfil.nome }),
  aprovar: (id, perfil) =>
    atualizarPlano(id, { status: 'aprovado', comentario_revisor: null, revisado_em: new Date().toISOString(), revisado_por: perfil.nome }),
  devolver: (id, perfil, comentario) =>
    atualizarPlano(id, { status: 'devolvido', comentario_revisor: comentario.trim(), revisado_por: perfil.nome, revisado_em: new Date().toISOString() }),
  reenviar: (id) => atualizarPlano(id, { status: 'enviado' }),
  concluir: (id) => atualizarPlano(id, { status: 'concluido' }),
  jaResolvi: (id, perfil, data) =>
    atualizarPlano(id, { status: 'concluido', data_conclusao: data, revisado_por: perfil.nome + ' (autoaprovação)', revisado_em: new Date().toISOString() }),
  enviarParaValidacao: (id) => atualizarPlano(id, { status: 'enviado' }),
  puxarParaRevisao: (id) => atualizarPlano(id, { status: 'aguardando_coordenador' }),
  atendidoPeloSetor: (id, valor) => atualizarPlano(id, { atendido_pelo_setor: valor }),
}

// Quais botões cada pessoa vê em cada plano (espelha o sistema anterior e a função do servidor)
export function botoesDoPlano(p, perfil, { coordenaAutor } = {}) {
  const b = []
  const dono = p.usuario_id === perfil.id
  const r = perfil.role
  const st = p.status === 'rascunho' ? 'enviado' : p.status
  if (!dono) {
    if (st === 'enviado') {
      if (r === 'diretor_cpa') b.push('validarCPA', 'devolver')
      if (r === 'admin' || r === 'pro_reitoria') b.push('aprovar', 'devolver')
    }
    if (st === 'aguardando_pro_reitoria' && (r === 'pro_reitoria' || r === 'admin')) b.push('aprovar', 'devolver')
    if (r === 'coordenador' && coordenaAutor) {
      if (st === 'aguardando_coordenador') b.push('enviarParaValidacao', 'editar', 'excluir')
      if (st === 'enviado') b.push('editar', 'excluir', 'puxarParaRevisao')
    }
    if (r === 'setor' && p.externa && p.area && p.area === perfil.setor) b.push('atendidoPeloSetor')
    if (r === 'admin' && !b.includes('excluir')) b.push('excluir')
    return [...new Set(b)]
  }
  if (st === 'devolvido') b.push('reenviar')
  if (st === 'aprovado') b.push('concluir')
  if (PAPEIS_AUTONOMOS.includes(r) && ['enviado', 'aguardando_pro_reitoria', 'devolvido'].includes(st)) b.push('jaResolvi')
  // Quem enviou pode editar até a aprovação
  if (!['aprovado', 'concluido'].includes(st)) b.push('editar')
  b.push('excluir')
  if (r === 'diretor_cpa' && st === 'enviado') b.push('validarCPA', 'devolver')
  if ((r === 'admin' || r === 'pro_reitoria') && ['enviado', 'aguardando_pro_reitoria'].includes(st)) b.push('aprovar')
  return b
}

function traduzir(e) {
  const m = String(e?.message || e || '')
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com o servidor agora. Tente de novo em alguns segundos (nada do que você preencheu foi perdido).'
  if (/row-level security/i.test(m)) return 'Você não tem permissão para esta ação.'
  return m || 'Não foi possível salvar agora. Tente de novo em alguns segundos.'
}

export const SELO_STATUS = {
  rascunho: 'escuro',
  enviado: 'escuro',
  aguardando_coordenador: 'laranja',
  aguardando_pro_reitoria: 'laranja',
  aprovado: 'azul',
  devolvido: 'laranja',
  concluido: 'verde',
}

export function fmtData(d) {
  if (!d) return null
  const x = new Date(d.length <= 10 ? d + 'T12:00:00' : d)
  return Number.isNaN(x.getTime()) ? null : x.toLocaleDateString('pt-BR')
}

// O coordenador revisa os planos dos professores auxiliares dos cursos que coordena
export function coordenaAutor(perfil, p, base) {
  if (perfil.role !== 'coordenador' || !p.curso_id || !perfil.cursos.includes(p.curso_id)) return false
  return base.usuarios.find((u) => u.id === p.usuario_id)?.role === 'professor_auxiliar'
}

export function autorRotulo(u) {
  return u ? `${u.nome} · ${ROLE_LABELS[u.role] || u.role}` : '—'
}
