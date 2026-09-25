// Agenda de entregas (cobranças de prazo), cobrança dos professores auxiliares e prazos dos planos.
// Mesmas regras do sistema anterior. Tabela: entregas_agenda. E-mail: edge function notificar-entrega,
// que recebe { tipo: 'cobranca' | 'entrega', entregaId }.
import { sb } from './dados.js'
import { GLOBAL_SUPERVISOR_ROLES } from './config.js'

// Quem vê a Agenda de Entregas (menu do sistema anterior) e quem cria/edita cobranças
export const VE_AGENDA = GLOBAL_SUPERVISOR_ROLES
export const podeVerAgenda = (perfil) => VE_AGENDA.includes(perfil?.role)
export const podeGerenciarAgenda = (perfil) => perfil?.role === 'admin'
// A tela de Prazos (e a cobrança dos auxiliares que fica nela) é só do admin, como antes
export const podeVerPrazos = (perfil) => perfil?.role === 'admin'

// Pessoas que podem receber uma cobrança
export const ROLES_ALVO_COBRANCA = ['coordenador', 'professor_auxiliar', 'setor']

export function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

export function fmtDataBR(d) {
  if (!d) return ''
  const x = new Date(String(d).length <= 10 ? d + 'T12:00:00' : d)
  return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleDateString('pt-BR')
}

export function entregaAtrasada(e) {
  return e.status === 'pendente' && e.prazo < hojeISO()
}

function detalheErro(data, error) {
  return (data && data.error) || (error && error.message) || 'erro desconhecido'
}

export async function listarEntregas() {
  const { data, error } = await sb.from('entregas_agenda').select('*, usuario:usuario_id(nome)').order('prazo', { ascending: true })
  if (error) throw error
  return data || []
}

// Entregas pendentes da própria pessoa (RLS: dono_ve_propria_entrega)
export async function minhasEntregasPendentes(perfil) {
  const { data, error } = await sb
    .from('entregas_agenda')
    .select('*')
    .eq('usuario_id', perfil.id)
    .eq('status', 'pendente')
    .order('prazo', { ascending: true })
  if (error) throw error
  return data || []
}

// Cria a cobrança e manda o e-mail. Devolve { ok, aviso } com o mesmo texto do sistema anterior.
export async function criarEntrega(perfil, { usuarioId, prazo, mensagem }) {
  if (!usuarioId || !prazo) return { ok: false, tipo: 'erro', aviso: 'Escolha a pessoa e o prazo antes de criar a cobrança.' }
  const { data, error } = await sb
    .from('entregas_agenda')
    .insert({ usuario_id: usuarioId, criado_por: perfil.id, prazo, mensagem: (mensagem || '').trim(), status: 'pendente' })
    .select()
    .single()
  if (error) {
    console.error('Erro ao criar cobrança:', error)
    return { ok: false, tipo: 'erro', aviso: 'Não foi possível criar a cobrança agora. Tente de novo em alguns segundos.' }
  }
  const { data: dFn, error: eFn } = await sb.functions.invoke('notificar-entrega', { body: { tipo: 'cobranca', entregaId: data.id } })
  if (eFn || (dFn && dFn.error)) {
    const d = detalheErro(dFn, eFn)
    console.error('Falha ao enviar e-mail de cobrança:', d)
    return {
      ok: true,
      tipo: 'alerta',
      aviso: `A cobrança foi criada, mas o e-mail não saiu: ${d}. (Lembrete: no plano gratuito do Resend, só é possível enviar pro e-mail cadastrado na conta, até verificar um domínio.)`,
    }
  }
  return { ok: true, tipo: 'ok', aviso: 'Cobrança criada e e-mail enviado com sucesso!' }
}

export async function atualizarPrazoEntrega(id, prazo) {
  if (!prazo) return { ok: false }
  const { error } = await sb.from('entregas_agenda').update({ prazo }).eq('id', id)
  if (error) {
    console.error('Erro ao atualizar prazo:', error)
    return { ok: false, tipo: 'erro', aviso: 'Não foi possível atualizar o prazo agora.' }
  }
  return { ok: true, tipo: 'ok', aviso: 'Prazo atualizado com sucesso!' }
}

export async function reenviarCobranca(id) {
  try {
    const { data, error } = await sb.functions.invoke('notificar-entrega', { body: { tipo: 'cobranca', entregaId: id } })
    if (error || (data && data.error)) return { ok: false, tipo: 'alerta', aviso: 'Não foi possível reenviar o e-mail: ' + detalheErro(data, error) }
    return { ok: true, tipo: 'ok', aviso: 'E-mail reenviado com sucesso!' }
  } catch (e) {
    console.error('Erro ao reenviar cobrança:', e)
    return { ok: false, tipo: 'erro', aviso: 'Não foi possível reenviar o e-mail agora.' }
  }
}

// Marca uma entrega como cumprida e avisa Pró-Reitoria/CPA por e-mail (tipo 'entrega')
export async function marcarEntregaCumprida(entregaId) {
  const { error } = await sb.from('entregas_agenda').update({ status: 'cumprido', cumprido_em: new Date().toISOString() }).eq('id', entregaId)
  if (error) throw error
  await sb.functions.invoke('notificar-entrega', { body: { tipo: 'entrega', entregaId } })
}

// Igual ao sistema anterior: chamada depois que a pessoa envia um plano de ação (de curso ou de setor).
// Pega a cobrança pendente mais antiga dela, marca como cumprida e avisa a supervisão. Nunca lança erro.
export async function verificarCumprimentoEntrega(perfil) {
  try {
    if (!perfil?.id) return false
    const { data, error } = await sb
      .from('entregas_agenda')
      .select('id')
      .eq('usuario_id', perfil.id)
      .eq('status', 'pendente')
      .order('criado_em', { ascending: true })
      .limit(1)
    if (error || !data || data.length === 0) return false
    await marcarEntregaCumprida(data[0].id)
    return true
  } catch (e) {
    console.error('Erro ao verificar cumprimento de entrega:', e)
    return false
  }
}

// ---------- prazos dos planos ----------

export function diasAtePrazo(dataStr) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(dataStr + 'T00:00:00')
  return Math.round((alvo - hoje) / 86400000)
}

// 0 atrasado · 1 vence em até 7 dias · 2 em dia (ou sem prazo) · 3 aprovado · 4 concluído
export function classificarUrgencia(p) {
  if (p.status === 'concluido') return 4
  if (p.status === 'aprovado') return 3
  if (!p.prazo) return 2
  const dias = diasAtePrazo(p.prazo)
  if (dias < 0) return 0
  if (dias <= 7) return 1
  return 2
}

export function situacaoPrazo(p) {
  if (!p.prazo || p.status === 'aprovado' || p.status === 'concluido') return null
  const dias = diasAtePrazo(p.prazo)
  if (dias < 0) return { t: `Atrasado há ${Math.abs(dias)} dia(s)`, c: 'laranja' }
  if (dias <= 7) return { t: `Vence em ${dias} dia(s)`, c: 'laranja' }
  return { t: `Em dia · ${dias} dias restantes`, c: 'verde' }
}

const ROLES_CURSO = ['coordenador', 'professor_auxiliar', 'diretor_nucleo']

// Todos os planos de responsáveis de curso e de setor, com o resumo e na ordem de urgência (renderPrazos)
export function montarPrazos(base) {
  const porId = Object.fromEntries(base.usuarios.map((u) => [u.id, u]))
  const nomeSetor = Object.fromEntries(base.setores.map((s) => [s.id, s.nome]))
  const itens = []
  for (const p of base.planos) {
    const u = porId[p.usuario_id]
    if (!u) continue
    if (ROLES_CURSO.includes(u.role)) itens.push({ p, coordNome: u.nome })
    else if (u.role === 'setor') itens.push({ p, setorNome: nomeSetor[u.setor_id] || u.setor_id })
  }
  const resumo = { atrasado: 0, vencendo: 0, emDia: 0, aprovado: 0 }
  for (const x of itens) {
    const c = classificarUrgencia(x.p)
    if (c === 0) resumo.atrasado++
    else if (c === 1) resumo.vencendo++
    else if (c === 3) resumo.aprovado++
    else resumo.emDia++
  }
  itens.sort((a, b) => {
    const ua = classificarUrgencia(a.p)
    const ub = classificarUrgencia(b.p)
    if (ua !== ub) return ua - ub
    if (!a.p.prazo) return 1
    if (!b.p.prazo) return -1
    return new Date(a.p.prazo) - new Date(b.p.prazo)
  })
  return { resumo, itens }
}

// Rascunhos parados com professores auxiliares e planos deles esperando o coordenador (renderCobrancaAuxiliares).
// coordsPorCurso: { [curso_id]: nome do coordenador } (vem de usuario_cursos, que a base não traz).
export function montarCobrancaAuxiliares(base, coordsPorCurso = {}) {
  const auxiliares = base.usuarios.filter((u) => u.role === 'professor_auxiliar')
  const porId = Object.fromEntries(auxiliares.map((u) => [u.id, u]))
  const rascunhos = []
  const aguardando = []
  const dias = (ref) => (ref ? Math.floor((Date.now() - new Date(ref).getTime()) / 86400000) : null)
  for (const p of base.planos) {
    const u = porId[p.usuario_id]
    if (!u) continue
    const coordNome = coordsPorCurso[p.curso_id] || '— sem coordenador identificado —'
    if (p.status === 'rascunho') rascunhos.push({ p, autorNome: u.nome, coordNome, dias: dias(p.criado_em), rotuloTempo: 'Rascunho há' })
    else if (p.status === 'aguardando_coordenador')
      aguardando.push({ p, autorNome: u.nome, coordNome, dias: dias(p.enviado_coordenador_em || p.criado_em), rotuloTempo: 'Esperando coordenador há' })
  }
  const ord = (a, b) => (b.dias || 0) - (a.dias || 0)
  rascunhos.sort(ord)
  aguardando.sort(ord)
  return { temAuxiliares: auxiliares.length > 0, rascunhos, aguardando }
}

// Primeiro coordenador vinculado a cada curso (como no sistema anterior: ALL_USERS.find(coordenador com o curso))
export async function coordenadoresPorCurso(base) {
  const coords = base.usuarios.filter((u) => u.role === 'coordenador')
  if (!coords.length) return {}
  const { data, error } = await sb.from('usuario_cursos').select('usuario_id, curso_id').in('usuario_id', coords.map((c) => c.id))
  if (error) throw error
  const ordem = Object.fromEntries(coords.map((c, i) => [c.id, i]))
  const nome = Object.fromEntries(coords.map((c) => [c.id, c.nome]))
  const out = {}
  for (const v of [...(data || [])].sort((a, b) => ordem[a.usuario_id] - ordem[b.usuario_id])) {
    if (!out[v.curso_id]) out[v.curso_id] = nome[v.usuario_id]
  }
  return out
}
