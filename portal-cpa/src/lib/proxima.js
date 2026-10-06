// Próxima CPA: a proposta de perguntas que a CPA monta e a Pró-Reitoria aprova.
import { sb } from './dados.js'
import { leitura, naoEncaixa } from './concordancia.js'
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
  if (!proposta) return { proposta: null, itens: [], questionarios, historico: [], prefixos: [] }
  const [itens, historico, prefixos] = await Promise.all([
    lerTudo(() => sb.from('cpa_proposta_itens').select('*').eq('proposta_id', proposta.id).order('posicao')),
    lerTudo(() => sb.from('cpa_proposta_historico').select('*').eq('proposta_id', proposta.id).order('em', { ascending: false }).limit(200)),
    // Se a tabela de prefixos ainda não responder, segue com os prefixos do instrumento
    lerTudo(() => sb.from('cpa_proposta_prefixos').select('*').eq('proposta_id', proposta.id)).catch(() => []),
  ])
  return { proposta, itens, questionarios, historico, prefixos }
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

/* ---------------- eixo e dimensão ---------------- */
export const EIXO_POR_N = Object.fromEntries(EIXOS.map((e) => [e.n, e]))
export function rotuloEixo(n) {
  return n && EIXO_POR_N[n] ? `Eixo ${n} · ${EIXO_POR_N[n].nome}` : null
}
export function rotuloDim(d) {
  return d && DIMS[d] ? `D${d} · ${DIMS[d]}` : null
}
// Eixo e dimensão de uma pergunta do instrumento pelo id `${survey_id}:${pergunta_posicao}`
export function eixoDimDoId(id) {
  const a = ATUAL_POR_ID[id]
  if (!a) return null
  return { eixo: a.eixo || (a.dimensao ? EIXO_DA_DIM[a.dimensao] : null), dimensao: a.dimensao || null }
}
// Eixos e dimensões (com quantas perguntas) que um conjunto de questionários cobre hoje
export function coberturaDosQuestionarios(ids) {
  const m = new Map()
  for (const a of ATUAIS) {
    if (!ids.includes(a.questionario_id) || !a.dimensao || a.tipo === 'aberta') continue
    const k = a.dimensao
    const g = m.get(k) || { eixo: a.eixo || EIXO_DA_DIM[a.dimensao], dimensao: a.dimensao, perguntas: 0 }
    g.perguntas++
    m.set(k, g)
  }
  return [...m.values()].sort((x, y) => x.eixo - y.eixo || x.dimensao - y.dimensao)
}

/* ---------------- escala (critério avaliativo) ---------------- */
export const ESCALAS = {
  likert_5: { t: '1 a 5', d: '1 Muito insatisfeito … 5 Muito satisfeito', valores: ['1', '2', '3', '4', '5'], ancoras: { 1: 'Muito insatisfeito', 5: 'Muito satisfeito' } },
  likert_5_na: { t: '1 a 5 + Não sei / Não utilizo', d: '1 Muito insatisfeito … 5 Muito satisfeito, e “Não sei / Não utilizo” (fora da média)', valores: ['1', '2', '3', '4', '5'], ancoras: { 1: 'Muito insatisfeito', 5: 'Muito satisfeito' }, na: true },
  nps_0_10: { t: '0 a 10', d: 'Notas de 0 a 10', valores: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], ancoras: {} },
  aberta: { t: 'Resposta aberta', d: 'O aluno escreve um texto livre', valores: [], ancoras: {} },
}
const ESCALA_DO_TIPO = { nota_1a5: 'likert_5', nota_0a10: 'nps_0_10', aberta: 'aberta' }
const TIPO_DA_ESCALA = { likert_5: 'nota_1a5', likert_5_na: 'nota_1a5', nps_0_10: 'nota_0a10', aberta: 'aberta' }
export function tipoDaEscala(esc, tipoAtual) {
  if (!esc || tipoAtual === 'multipla' || tipoAtual === 'outro') return tipoAtual
  return TIPO_DA_ESCALA[esc] || tipoAtual
}
// Escala do instrumento para a pergunta atual naquela modalidade (sem a troca feita na proposta)
export function escalaOriginal(item, mod) {
  const a = item.atual_id ? ATUAL_POR_ID[item.atual_id] : null
  if (a) {
    if (a.escalas?.[mod]) return a.escalas[mod]
    const outras = Object.values(a.escalas || {})
    if (outras.length) return outras[0]
    if (a.tipo === 'aberta') return 'aberta'
  }
  return ESCALA_DO_TIPO[item.tipo] || null
}
// Escala que vale na proposta (a trocada na proposta vale para todas as modalidades)
export function escalaDoItem(item, mod) {
  if (item.escala) return item.escala
  return escalaOriginal(item, mod)
}
export function escalaMudou(item) {
  return !!item.escala && item.modalidades.some((m) => escalaOriginal(item, m) !== item.escala)
}

/* ---------------- prefixos (enunciado antes das perguntas) ---------------- */
export const PREFIXOS_INSTRUMENTO = instrumento.prefixos || {}
export function prefixoOriginal(qid, mod) {
  const p = PREFIXOS_INSTRUMENTO[qid]
  if (!p) return ''
  return p[mod] || Object.values(p)[0] || ''
}
export function linhaPrefixo(prefixos, qid, mod) {
  return (prefixos || []).find((r) => r.questionario_id === qid && r.modalidade === mod) || null
}
export function prefixoDe(prefixos, qid, mod) {
  const r = linhaPrefixo(prefixos, qid, mod)
  return r ? r.texto || '' : prefixoOriginal(qid, mod)
}
// A pergunta lida junto com o enunciado ("Qual o seu grau de satisfação com relação a: <pergunta>")
export function comPrefixo(prefixo, texto) {
  return leitura(prefixo, texto)
}
// Pergunta escrita como pergunta completa ("Como você avalia a clareza...?") vira item que combina com o
// prefixo ("Qual o seu grau de satisfação com relação a: clareza..."). Devolve null se não souber adaptar.
export function textoParaPrefixo(texto) {
  const t = String(texto || '').trim()
  if (!/\?$/.test(t) && !/^(como|você|voce|qual|quanto|o quanto)\b/i.test(t)) return null
  let r = t.replace(/\?+$/, '').trim()
  r = r.replace(/^(como|o quanto|quanto)\s+(você|voce)\s+(avalia|considera|percebe|classifica)\s+/i, '')
  r = r.replace(/^(você|voce)\s+(sente|acha|considera|percebe)\s+que\s+/i, 'o quanto ')
  r = r.replace(/^(você|voce)\s+(sabe|conhece)\s+(que|se)?\s*/i, 'Conhecimento de que ')
  r = r.replace(/^(você|voce)\s+/i, '')
  if (!r || r === t) return null
  return r.charAt(0).toUpperCase() + r.slice(1)
}

export function sugestoesPrefixo(qid) {
  if (qid === 'satisfacao_geral')
    return ['Em uma escala de 0 a 10, o quanto você recomendaria ou avaliaria:', 'De 0 a 10, considerando este semestre, qual nota você dá para:']
  return ['Considerando este semestre, avalie de 1 a 5 a sua satisfação com:', 'De 1 a 5, quanto você está satisfeito(a) com:']
}
export function prefixosAlterados(prefixos) {
  return (prefixos || []).filter((r) => (r.texto || '') !== (r.texto_original ?? prefixoOriginal(r.questionario_id, r.modalidade)))
}
export async function salvarPrefixo(propostaId, prefixos, qid, mod, texto, usuarioId) {
  const atual = linhaPrefixo(prefixos, qid, mod)
  const agora = new Date().toISOString()
  if (atual?.id) {
    const { data, error } = await sb.from('cpa_proposta_prefixos').update({ texto, atualizado_por: usuarioId, atualizado_em: agora }).eq('id', atual.id).select('*').single()
    if (error) throw error
    return data
  }
  const { data, error } = await sb
    .from('cpa_proposta_prefixos')
    .insert({ proposta_id: propostaId, questionario_id: qid, modalidade: mod, texto, texto_original: prefixoOriginal(qid, mod), atualizado_por: usuarioId, atualizado_em: agora })
    .select('*')
    .single()
  if (error) throw error
  return data
}

/* ---------------- resultados da planilha importada (por modalidade) ---------------- */
export const LIMITE_NAO_UTILIZO = 0.2 // 20% de "Não sei / Não utilizo"
export const LIMITE_POUCAS = 0.25 // menos de 25% dos alunos daquela modalidade que responderam a Satisfação Geral
export const MIN_RESPOSTAS = 30

export async function carregarResultadosModalidade() {
  const { data: imps, error } = await sb.from('cpa_importacoes').select('ciclo, importado_em, status').eq('status', 'concluida').order('importado_em', { ascending: false }).limit(1)
  if (error) throw error
  const imp = imps?.[0]
  if (!imp) return null
  const linhas = await lerTudo(() => sb.from('cpa_resultado_modalidade').select('survey_id, pergunta_posicao, pergunta, modalidade, n, nao_utilizo, escala').eq('ciclo', imp.ciclo).order('survey_id').order('pergunta_posicao'))
  const porId = {}
  for (const r of linhas) {
    const id = `${r.survey_id}:${r.pergunta_posicao}`
    const g = (porId[id] ||= {})
    const x = (g[r.modalidade] ||= { n: 0, nu: 0 })
    x.n += Number(r.n) || 0
    x.nu += Number(r.nao_utilizo) || 0
  }
  // Referência de alunos por modalidade: a Satisfação Geral, que todos respondem
  const ref = {}
  for (const [id, g] of Object.entries(porId)) {
    if (ATUAL_POR_ID[id]?.questionario_id !== 'satisfacao_geral') continue
    for (const [m, x] of Object.entries(g)) ref[m] = Math.max(ref[m] || 0, x.n + x.nu)
  }
  // Infraestrutura respondida por EAD/Semi
  const infra = { n: 0, nu: 0 }
  for (const [id, g] of Object.entries(porId)) {
    if (ATUAL_POR_ID[id]?.questionario_id !== 'infraestrutura_e_atendimento') continue
    for (const m of ['EAD', 'SEMIPRESENCIAL']) if (g[m]) { infra.n += g[m].n; infra.nu += g[m].nu }
  }
  return { ciclo: imp.ciclo, porId, ref, infra }
}

export function ehInfra(item) {
  return item.dimensao === 7 || item.questionario_id === 'infraestrutura_e_atendimento'
}
const pct = (x) => (x.n + x.nu ? x.nu / (x.n + x.nu) : 0)
export const fmtPct = (v) => (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'

// Marcador gravado em `observacao` quando a CPA analisa uma sugestão e decide manter
export const MARCA_MANTIDA = 'Mantida após análise'
export function foiAnalisada(item) {
  return (item.observacao || '').startsWith(MARCA_MANTIDA)
}

const VAZIAS = new Set('a o e de da do das dos em no na nos nas para por com sua seu suas seus sobre ao aos as os um uma entre pela pelo pelos pelas que se voce unifecaf curso'.split(' '))
function palavras(t) {
  return new Set(String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !VAZIAS.has(w)))
}
export function parecido(a, b) {
  const A = palavras(a)
  const B = palavras(b)
  if (!A.size || !B.size) return 0
  let c = 0
  for (const w of A) if (B.has(w)) c++
  return c < 2 ? 0 : (2 * c) / (A.size + B.size)
}
export const LIMITE_PARECIDO = 0.5

// Perguntas que talvez possam sair, com os motivos e os números da planilha importada
export function candidatasRetirada(itens, res, questionarios = []) {
  const nomeQ = Object.fromEntries(questionarios.map((q) => [q.id, q.nome]))
  const out = []
  const ativas = itens.filter(entra)
  for (const it of ativas) {
    const motivos = []
    const g = it.atual_id && res ? res.porId[it.atual_id] : null
    if (g) {
      for (const m of it.modalidades) {
        const x = g[m]
        if (!x) continue
        const tot = x.n + x.nu
        if (tot >= MIN_RESPOSTAS && pct(x) >= LIMITE_NAO_UTILIZO)
          motivos.push({ tipo: 'nao_utilizo', mod: m, t: `${fmtPct(pct(x))} responderam “Não sei / Não utilizo” no ${MOD_CURTO[m]}`, n: tot, nu: x.nu })
      }
      if (ehInfra(it)) {
        const ms = it.modalidades.filter((m) => m === 'EAD' || m === 'SEMIPRESENCIAL')
        if (ms.length) {
          const soma = ms.reduce((a, m) => ({ n: a.n + (g[m]?.n || 0), nu: a.nu + (g[m]?.nu || 0) }), { n: 0, nu: 0 })
          motivos.push({ tipo: 'infra_ead', mods: ms, t: `Infraestrutura física aberta para ${ms.map((m) => MOD_CURTO[m]).join(' e ')}: ${soma.n.toLocaleString('pt-BR')} notas e ${soma.nu.toLocaleString('pt-BR')} “não utilizo” (${fmtPct(pct(soma))})`, n: soma.n + soma.nu, nu: soma.nu })
        }
      }
      for (const m of it.modalidades) {
        const x = g[m]
        const ref = res.ref[m]
        const tot = x ? x.n + x.nu : 0
        if (it.tipo === 'aberta' || !ref) continue
        if (tot < MIN_RESPOSTAS || tot < ref * LIMITE_POUCAS)
          motivos.push({ tipo: 'poucas', mod: m, t: tot ? `Poucas respostas no ${MOD_CURTO[m]}: ${tot.toLocaleString('pt-BR')} (${fmtPct(tot / ref)} dos ${ref.toLocaleString('pt-BR')} alunos que responderam a Satisfação Geral)` : `Nenhuma resposta no ${MOD_CURTO[m]} na última pesquisa`, n: tot })
      }
    } else if (ehInfra(it)) {
      const ms = it.modalidades.filter((m) => m === 'EAD' || m === 'SEMIPRESENCIAL')
      if (ms.length) motivos.push({ tipo: 'infra_ead', mods: ms, t: `Infraestrutura física aberta para ${ms.map((m) => MOD_CURTO[m]).join(' e ')} (o aluno EAD normalmente não usa a estrutura física)` })
    }
    if (it.tipo !== 'aberta') {
      for (const o of ativas) {
        if (o === it || o.tipo === 'aberta' || (o.questionario_id || '') === (it.questionario_id || '')) continue
        const s = parecido(it.texto, o.texto)
        if (s >= LIMITE_PARECIDO) motivos.push({ tipo: 'duplicada', outro: o.id, t: `Texto parecido (${Math.round(s * 100)}%) com “${o.texto}” em ${nomeQ[o.questionario_id] || 'outro questionário'}` })
      }
    }
    if (motivos.length) out.push({ item: it, motivos, analisada: foiAnalisada(it) })
  }
  return out
}

/* ---------------- resumo das mudanças (para a Pró-Reitoria e para revisar antes de enviar) ---------------- */
export function modalidadesMudaram(item) {
  const a = item.atual_id ? ATUAL_POR_ID[item.atual_id] : null
  if (!a) return false
  return MODALIDADES.filter((m) => a.modalidades.includes(m)).join() !== MODALIDADES.filter((m) => item.modalidades.includes(m)).join()
}
export function resumoMudancas(itens, prefixos) {
  const r = { mantidas: [], reescritas: [], novas: [], retiradas: [], prefixos: prefixosAlterados(prefixos), formato: [] }
  for (const it of itens) {
    if (!it.incluida) r.retiradas.push(it)
    else if (it.origem !== 'atual') r.novas.push(it)
    else if (it.texto !== it.texto_original) r.reescritas.push(it)
    else r.mantidas.push(it)
    if (it.incluida && it.origem === 'atual' && (modalidadesMudaram(it) || escalaMudou(it))) r.formato.push(it)
  }
  return r
}

// Marcadores gravados no campo `observacao` do item
export const MARCA_RETIRADA = 'Retirada após análise'
export const MARCA_CONFIRMADA = 'Retirada confirmada'
export const MARCA_PR_VOLTA = 'Trazida de volta pela Pró-Reitoria'
export function marcar(marca, motivo) {
  const m = String(motivo || '').trim()
  return m ? `${marca}: ${m}` : marca
}
export function retiradaConfirmada(item) {
  return !item.incluida && (item.observacao || '').startsWith(MARCA_CONFIRMADA)
}
// O motivo escrito, sem o marcador
export function motivoDe(item) {
  const o = item.observacao || ''
  for (const m of [MARCA_MANTIDA, MARCA_RETIRADA, MARCA_CONFIRMADA, MARCA_PR_VOLTA]) if (o.startsWith(m)) return o.slice(m.length).replace(/^:\s*/, '')
  return o
}

// Agrupa as modalidades que têm a mesma escala: [[escala, [mods]]]
export function escalasPorModalidade(item, mods = item.modalidades) {
  const m = new Map()
  for (const mod of MODALIDADES.filter((x) => mods.includes(x))) {
    const e = escalaDoItem(item, mod) || 'likert_5'
    m.set(e, [...(m.get(e) || []), mod])
  }
  return [...m.entries()]
}

export function nomeEscala(e) {
  return ESCALAS[e]?.t || e || '—'
}


// Modalidades em que o questionário aparece (pelas perguntas que entram; se não houver, as do instrumento)
export function modsDoQuestionario(itens, qid) {
  const ms = new Set(itens.filter((i) => i.questionario_id === qid && entra(i)).flatMap((i) => i.modalidades))
  return MODALIDADES.filter((m) => ms.has(m))
}

// [[texto, [mods]]]
export function gruposPrefixo(prefixos, qid, mods) {
  const m = new Map()
  for (const mod of mods) {
    const t = prefixoDe(prefixos, qid, mod)
    m.set(t, [...(m.get(t) || []), mod])
  }
  return [...m.entries()]
}


/* ---------------- perguntas atuais: a decisão sobre cada uma ---------------- */
export const DECISOES = {
  decidir: { t: 'A decidir', c: 'laranja' },
  mantida: { t: 'Mantida', c: 'verde' },
  reescrita: { t: 'Reescrita', c: 'azul' },
  retirada: { t: 'Retirada', c: 'cinza' },
}

export function decisaoDe(item) {
  if (!item.incluida) return 'retirada'
  if (item.texto !== item.texto_original) return 'reescrita'
  if (foiAnalisada(item)) return 'mantida'
  return 'decidir'
}

export const atuaisDe = (itens) => itens.filter((i) => i.origem === 'atual')

/* ---------------- perguntas adaptadas de outra modalidade ---------------- */
export const MARCA_ADAPTADA = 'Adaptada de'
export const adaptadaDe = (item) => (item.origem !== 'atual' && (item.observacao || '').startsWith(MARCA_ADAPTADA) ? item.observacao : null)

/* ---------------- concordância entre enunciado e pergunta ---------------- */
// A pergunta lida junto com o enunciado da modalidade não encaixa (ex.: "com relação a:" + "Dinamismo das aulas")
export function desencaixa(prefixos, item, mod) {
  if (item.tipo === 'aberta' || !item.questionario_id) return false
  return naoEncaixa(prefixoDe(prefixos, item.questionario_id, mod), textoNaModalidade(item, mod))
}
export function contarDesencaixes(dados, qid, mods) {
  let n = 0
  for (const it of dados.itens) {
    if (it.questionario_id !== qid || !it.incluida || it.decisao_pr === 'reprovada' || it.tipo === 'aberta') continue
    const m = it.modalidades.find((x) => mods.includes(x))
    if (m && desencaixa(dados.prefixos, it, m)) n++
  }
  return n
}

/* ---------------- para o T.I: o que entra, sai, muda e se mantém ---------------- */
export function classificarTI(it) {
  if (!it.incluida) return 'sai'
  if (it.decisao_pr === 'reprovada') return 'sai'
  if (it.origem !== 'atual') return 'entra'
  if (it.texto !== it.texto_original || modalidadesMudaram(it) || escalaMudou(it)) return 'muda'
  return 'mantem'
}

export const GRUPOS_TI = {
  entra: { t: 'Entram', d: 'Perguntas novas no instrumento', c: 'verde' },
  sai: { t: 'Saem', d: 'Retiradas pela CPA ou excluídas pela Pró-Reitoria', c: 'laranja' },
  muda: { t: 'Mudam', d: 'Texto, modalidades ou escala diferentes de hoje', c: 'azul' },
  mantem: { t: 'Mantidas', d: 'Seguem exatamente como hoje', c: 'cinza' },
}

export function decisaoPr(it) {
  if (it.decisao_pr === 'aprovada') return it.editada_pr ? 'Aprovada (editada pela Pró-Reitoria)' : 'Aprovada'
  if (it.decisao_pr === 'reprovada') return 'Excluída pela Pró-Reitoria'
  if (it.adicionada_pr) return 'Incluída pela Pró-Reitoria'
  return 'Sem marcação (segue a proposta da CPA)'
}

export function motivoSaida(it) {
  if (it.decisao_pr === 'reprovada') return 'Excluída pela Pró-Reitoria'
  const m = motivoDe(it)
  return 'Retirada pela CPA' + (m ? ': ' + m : '')
}

