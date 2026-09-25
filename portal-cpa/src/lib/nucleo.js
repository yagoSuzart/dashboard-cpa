// Núcleos (de cursos e de setores), ações da direção e demandas dos setores.
// Mesmas regras do sistema anterior (renderNucleo, renderSetorGeral, getDemandasParaSetor, renderNucleoSetorGeral).
import { sb } from './dados.js'
import { atualizarPlano, statusDeEnvio } from './planos.js'

export const NUCLEO_LABELS = { saude: 'Núcleo de Saúde', engenharias_tech: 'Núcleo de Engenharias e Tecnologia' }
export const NUCLEO_SETOR_LABELS = { facilities: 'Núcleo de Facilities' }
// Reserva caso a tabela nucleos_setores não responda (mesma regra do sistema anterior)
export const NUCLEO_SETORES = { facilities: ['limpeza', 'manutencao', 'seguranca'] }

export const nomeNucleo = (n) => NUCLEO_LABELS[n] || 'núcleo'
export const nomeNucleoSetor = (n) => NUCLEO_SETOR_LABELS[n] || 'núcleo'

export async function cursosDoNucleo(nucleo) {
  const { data, error } = await sb.from('nucleos_cursos').select('curso_id').eq('nucleo', nucleo)
  if (error) throw error
  return (data || []).map((x) => x.curso_id)
}

export async function nucleosDeCursos() {
  const { data, error } = await sb.from('nucleos_cursos').select('nucleo')
  if (error) throw error
  return [...new Set((data || []).map((x) => x.nucleo))]
}

export async function setoresDoNucleo(nucleoSetor) {
  try {
    const { data, error } = await sb.from('nucleos_setores').select('setor_id').eq('nucleo', nucleoSetor)
    if (error) throw error
    if (data?.length) return data.map((x) => x.setor_id)
  } catch {
    // usa a lista de reserva
  }
  return NUCLEO_SETORES[nucleoSetor] || []
}

// Posição do setor no ranking: terço de cima, do meio ou de baixo
export function rankClasseSetor(posicao, total) {
  if (posicao < total / 3) return 'setor-top'
  if (posicao < (total / 3) * 2) return 'setor-mid'
  return 'setor-low'
}

const ORDEM_STATUS = { enviado: 0, rascunho: 0, aguardando_coordenador: 0, devolvido: 1, aguardando_pro_reitoria: 1, aprovado: 2, concluido: 3 }
export const ordemStatus = (p) => ORDEM_STATUS[p.status] ?? 0
export const porStatus = (a, b) => ordemStatus(a) - ordemStatus(b)

// Demandas que coordenadores, auxiliares e diretores de núcleo encaminharam a um setor
export function demandasParaSetor(planos, usuarios, setorId) {
  const papeis = new Set(['coordenador', 'professor_auxiliar', 'diretor_nucleo'])
  const papel = Object.fromEntries(usuarios.map((u) => [u.id, u.role]))
  return planos
    .filter((p) => p.externa && p.area === setorId && papeis.has(papel[p.usuario_id]))
    .sort((a, b) => {
      if (!!a.atendido_pelo_setor !== !!b.atendido_pelo_setor) return a.atendido_pelo_setor ? 1 : -1
      return porStatus(a, b)
    })
}

// Planos de melhoria registrados pelos responsáveis de um conjunto de setores
export function planosDosSetores(planos, usuarios, setores) {
  const ids = new Set(setores)
  const responsaveis = new Set(usuarios.filter((u) => u.role === 'setor' && ids.has(u.setor_id)).map((u) => u.id))
  return planos.filter((p) => responsaveis.has(p.usuario_id) || (p.tipo === 'setor' && ids.has(p.setor_id))).sort(porStatus)
}

// Colunas do fluxo dos planos (sem rascunho: o rascunho antigo conta como "ainda não foi visto")
export const COLUNAS_FLUXO = [
  { t: 'Precisa de ajuste', s: ['devolvido'], cor: 'var(--ember)' },
  { t: 'Ainda não foi visto', s: ['enviado', 'rascunho', 'aguardando_coordenador'], cor: 'var(--amber)' },
  { t: 'Validado · aguardando Pró-Reitoria', s: ['aguardando_pro_reitoria'], cor: 'var(--blue)' },
  { t: 'Em andamento', s: ['aprovado'], cor: 'var(--navy)' },
  { t: 'Concluído', s: ['concluido'], cor: 'var(--green)' },
]

// Sugestões de palavras-chave por setor para achar comentários de Infraestrutura
export const PALAVRAS_SETOR = {
  ti: 'wi-fi, wifi, internet, computador, laboratório, sistema',
  biblioteca: 'biblioteca, livro, acervo',
  cantina: 'cantina, lanche, comida, preço',
  limpeza: 'limpeza, banheiro, sujo, papel, sabonete',
  seguranca: 'segurança, portaria, catraca, entrada',
  manutencao: 'manutenção, ar condicionado, cadeira, projetor, elevador, sala de aula',
  nead: 'ava, plataforma, ead, aula gravada, material',
  carreiras: 'carreira, estágio, emprego, vaga',
  agiliza: 'agiliza, secretaria, documento, atendimento',
}

// Cria o item do plano de melhoria do setor a partir de uma demanda e marca a demanda como assumida.
// Sem rascunho: já vai para análise.
export async function criarPlanoDaDemanda(perfil, demanda, f, comentarios = []) {
  const registro = {
    tipo: 'setor',
    curso_id: null,
    setor_id: perfil.setor,
    categoria: null,
    titulo: f.titulo.trim(),
    descricao: f.descricao.trim(),
    indicador: f.indicador?.trim() || '',
    prioridade: f.prioridade || 'Média',
    prazo: f.prazo,
    externa: false,
    area: null,
    status: statusDeEnvio(perfil),
    usuario_id: perfil.id,
    origem_plano_id: demanda.id,
    comentarios_selecionados: comentarios.length ? comentarios : null,
  }
  const { data, error } = await sb.from('planos_acao').insert(registro).select('*').single()
  if (error) throw new Error(/row-level security/i.test(error.message) ? 'Você não tem permissão para esta ação.' : error.message)
  await atualizarPlano(demanda.id, { atendido_pelo_setor: true })
  return data
}

// ---------- Ações da direção (tabela acoes_direcao) ----------
export async function listarAcoesDirecao() {
  const { data, error } = await sb.from('acoes_direcao').select('*').order('criado_em', { ascending: false })
  if (error) throw error
  return data || []
}

function erroAcao(error) {
  const m = String(error?.message || '')
  if (/row-level security/i.test(m)) return 'Você não tem permissão para esta ação.'
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com o servidor agora. Tente de novo em alguns segundos.'
  return m || 'Não foi possível salvar agora.'
}

const camposAcao = (f) => ({
  curso_id: f.curso_id,
  titulo: f.titulo.trim(),
  descricao: f.descricao.trim(),
  prioridade: f.prioridade || 'Média',
  prazo: f.prazo,
})

export function validarAcao(f) {
  if (!f.curso_id || !f.titulo.trim() || !f.descricao.trim() || !f.prazo) return 'Preencha o curso, o título, a descrição e o prazo da ação.'
  return null
}

export async function criarAcaoDirecao(f) {
  const { data, error } = await sb.from('acoes_direcao').insert(camposAcao(f)).select('*').single()
  if (error) throw new Error(erroAcao(error))
  return data
}

export async function editarAcaoDirecao(id, f) {
  const { data, error } = await sb.from('acoes_direcao').update(camposAcao(f)).eq('id', id).select('id')
  if (error) throw new Error(erroAcao(error))
  if (!data?.length) throw new Error('Só quem registrou a ação pode editá-la.')
}

export async function excluirAcaoDirecao(id) {
  const { data, error } = await sb.from('acoes_direcao').delete().eq('id', id).select('id')
  if (error) throw new Error(erroAcao(error))
  if (!data?.length) throw new Error('Só quem registrou a ação pode excluí-la.')
}
