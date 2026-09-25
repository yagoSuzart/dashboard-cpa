// Próxima CPA: a proposta de perguntas que a CPA monta e a Pró-Reitoria aprova.
import { sb } from './dados.js'
import instrumento from '../data/instrumento-atual.json'
import banco from '../data/banco-perguntas.json'

export const ATUAIS = instrumento.perguntas
export const ATUAL_POR_ID = Object.fromEntries(ATUAIS.map((p) => [p.id, p]))
export const BANCO = banco.perguntas
export const BANCO_POR_ID = Object.fromEntries(BANCO.map((p) => [p.id, p]))

export const MODALIDADES = ['EAD', 'PRESENCIAL', 'SEMIPRESENCIAL']
export const MOD_CURTO = { EAD: 'EAD', PRESENCIAL: 'Presencial', SEMIPRESENCIAL: 'Semi' }

export const TIPOS = {
  nota_1a5: 'Nota de 1 a 5',
  nota_0a10: 'Nota de 0 a 10',
  aberta: 'Aberta (texto)',
  multipla: 'Múltipla escolha',
  outro: 'Outro formato',
}

export const EIXOS = [
  { n: 1, nome: 'Planejamento e Avaliação Institucional', dims: [8] },
  { n: 2, nome: 'Desenvolvimento Institucional', dims: [1, 3] },
  { n: 3, nome: 'Políticas Acadêmicas', dims: [2, 4, 9] },
  { n: 4, nome: 'Políticas de Gestão', dims: [5, 6, 10] },
  { n: 5, nome: 'Infraestrutura Física', dims: [7] },
]
export const DIMS = {
  1: 'Missão e PDI',
  2: 'Ensino, Pesquisa e Extensão',
  3: 'Responsabilidade Social',
  4: 'Comunicação com a Sociedade',
  5: 'Políticas de Pessoal',
  6: 'Organização e Gestão',
  7: 'Infraestrutura Física',
  8: 'Planejamento e Avaliação',
  9: 'Atendimento aos Discentes',
  10: 'Sustentabilidade Financeira',
}
export const EIXO_DA_DIM = Object.fromEntries(EIXOS.flatMap((e) => e.dims.map((d) => [d, e.n])))

export const STATUS = {
  montagem: { t: 'Em montagem', d: 'A CPA está escolhendo as perguntas' },
  pro_reitoria: { t: 'Com a Pró-Reitoria', d: 'Em análise pela Pró-Reitoria' },
  devolvida: { t: 'Devolvida para ajuste', d: 'A Pró-Reitoria pediu ajustes' },
  aprovada: { t: 'Aprovada', d: 'Pronta para ir ao T.I' },
  enviada_ti: { t: 'Enviada ao T.I', d: 'Documento enviado para cadastro' },
}
export const TRILHO_PROPOSTA = ['montagem', 'pro_reitoria', 'aprovada', 'enviada_ti']

export const EDITA_CPA = ['admin', 'diretor_cpa']
export const LE_PROPOSTA = ['admin', 'diretor_cpa', 'comissao_cpa', 'pro_reitoria']

// Vai para o instrumento final? (a CPA manteve e a Pró-Reitoria não reprovou)
export function entra(item) {
  return item.incluida && item.decisao_pr !== 'reprovada'
}

// Texto que o aluno de cada modalidade vê: se a pergunta atual não foi reescrita, mantém a variação de hoje
export function textoNaModalidade(item, mod) {
  if (item.origem === 'atual' && item.texto === item.texto_original) {
    const v = ATUAL_POR_ID[item.atual_id]?.variantes?.[mod]
    if (v) return v
  }
  return item.texto
}

export function situacao(item) {
  if (!item.incluida) return { t: 'Retirada', c: 'cinza' }
  if (item.decisao_pr === 'reprovada') return { t: 'Reprovada pela Pró-Reitoria', c: 'laranja' }
  if (item.adicionada_pr) return { t: 'Adicionada pela Pró-Reitoria', c: 'verde' }
  if (item.origem !== 'atual') return { t: 'Nova', c: 'verde' }
  if (item.texto !== item.texto_original) return { t: 'Reescrita', c: 'azul' }
  return { t: 'Mantida', c: 'cinza' }
}

// Gabarito SINAES: quantas perguntas de nota que entram cobrem cada dimensão
export function cobertura(itens) {
  const porDim = Object.fromEntries(Object.keys(DIMS).map((d) => [d, 0]))
  for (const it of itens) if (entra(it) && it.dimensao && it.tipo !== 'aberta') porDim[it.dimensao]++
  return porDim
}

async function lerTudo(montar) {
  const out = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await montar().range(de, de + 999)
    if (error) throw error
    out.push(...data)
    if (data.length < 1000) return out
  }
}

export async function carregarProposta() {
  const { data: props, error } = await sb.from('cpa_propostas').select('*').order('id', { ascending: false }).limit(1)
  if (error) throw error
  const [questionarios] = await Promise.all([lerTudo(() => sb.from('cpa_questionarios').select('*').order('ordem'))])
  const proposta = props[0] || null
  if (!proposta) return { proposta: null, itens: [], questionarios, historico: [] }
  const [itens, historico] = await Promise.all([
    lerTudo(() => sb.from('cpa_proposta_itens').select('*').eq('proposta_id', proposta.id).order('posicao')),
    lerTudo(() => sb.from('cpa_proposta_historico').select('*').eq('proposta_id', proposta.id).order('em', { ascending: false }).limit(200)),
  ])
  return { proposta, itens, questionarios, historico }
}

// Começa a proposta com o instrumento de hoje: todas as perguntas atuais entram como "mantida"
export async function iniciarProposta(usuarioId) {
  const { data: p, error } = await sb.from('cpa_propostas').insert({ titulo: 'Próxima CPA', status: 'montagem' }).select('*').single()
  if (error) throw error
  const itens = ATUAIS.map((a) => ({
    proposta_id: p.id,
    origem: 'atual',
    atual_id: a.id,
    questionario_id: a.questionario_id,
    posicao: a.posicao,
    texto: a.texto,
    texto_original: a.texto,
    tipo: a.tipo,
    modalidades: a.modalidades,
    eixo: a.eixo,
    dimensao: a.dimensao,
    incluida: true,
    atualizado_por: usuarioId,
  }))
  const { error: e2 } = await sb.from('cpa_proposta_itens').insert(itens)
  if (e2) throw e2
  await registrar(p.id, usuarioId, 'iniciou a proposta', { perguntas: itens.length })
  return p
}

export async function registrar(propostaId, usuarioId, acao, detalhe = {}, itemId = null) {
  await sb.from('cpa_proposta_historico').insert({ proposta_id: propostaId, usuario_id: usuarioId, acao, detalhe, item_id: itemId })
}

export async function salvarItem(item, patch, usuarioId) {
  const { data, error } = await sb
    .from('cpa_proposta_itens')
    .update({ ...patch, atualizado_por: usuarioId, atualizado_em: new Date().toISOString() })
    .eq('id', item.id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function criarItem(dados, usuarioId) {
  const { data, error } = await sb.from('cpa_proposta_itens').insert({ ...dados, atualizado_por: usuarioId }).select('*').single()
  if (error) throw error
  return data
}

export async function apagarItem(item) {
  const { error } = await sb.from('cpa_proposta_itens').delete().eq('id', item.id)
  if (error) throw error
}

export async function criarQuestionario(nome, usuarioId) {
  const id = 'novo_' + nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + Date.now().toString(36)
  const { data, error } = await sb.from('cpa_questionarios').insert({ id, nome: nome.trim(), origem: 'novo', ordem: 50, criado_por: usuarioId }).select('*').single()
  if (error) throw error
  return data
}

export async function mudarStatus(proposta, patch) {
  const { data, error } = await sb.from('cpa_propostas').update(patch).eq('id', proposta.id).select('*').single()
  if (error) throw error
  return data
}
