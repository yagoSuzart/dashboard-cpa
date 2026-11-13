// CPA ao vivo: lê os CSVs do painel da avaliação, confere os cursos com o cadastro do Portal e publica
// o panorama aberto (sem login) e o ranking de professores (só para a coordenação).
// Nada de aluno sai do navegador: do CSV de respostas só vão médias e contagens por professor.
import Papa from 'papaparse'
import { sb } from './dados.js'
import { SUPABASE } from './config.js'
import { cursoIdDaPlanilha, normalizar } from './cpa.js'

export const MODALIDADES_AO_VIVO = [
  { k: 'PRESENCIAL', t: 'Presencial', cor: '#8be36a' },
  { k: 'SEMIPRESENCIAL', t: 'Semipresencial', cor: '#22c3e6' },
  { k: 'EAD', t: 'EAD', cor: '#3b8cff' },
]
export const GERE_AO_VIVO = ['admin', 'diretor_cpa']
export const PROF_NAO_SEI = 6 // "Não sei / Não utilizo": fica fora da média

const num = (v) => Number(String(v ?? '').replace(/\./g, '').replace(',', '.')) || 0
// "Estética e Cosmética Presencial" → "Estética e Cosmética"
export const nomeSemModalidade = (n) => String(n || '').replace(/\s+(presencial|semipresencial|ead)\s*$/i, '').trim()
const chaveLinha = (mod, r) => `${mod}|${normalizar(r.nome)}|${r.elegiveis}`

function lerCsv(arquivo, opcoes = {}) {
  return new Promise((resolve, reject) => {
    Papa.parse(arquivo, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().replace(/^"(.*)"$/, '$1'),
      complete: (r) => resolve(r.data),
      error: reject,
      ...opcoes,
    })
  })
}

// CSV "Respondentes por curso" do painel: #;Curso;Elegíveis;Iniciados;Concluídos;%
export async function lerCsvRespondentes(arquivo) {
  const linhas = await lerCsv(arquivo)
  if (!linhas.length || !('Curso' in linhas[0]) || !('Elegíveis' in linhas[0]))
    throw new Error(`"${arquivo.name}" não parece o CSV "Respondentes por curso" do painel (faltam as colunas Curso e Elegíveis).`)
  return linhas
    .filter((l) => l.Curso)
    .map((l) => ({ nome: String(l.Curso).trim(), elegiveis: num(l['Elegíveis']), iniciados: num(l.Iniciados), concluidos: num(l['Concluídos']) }))
}

// Confere cada linha com o cadastro de cursos do Portal (curso + modalidade) e com os outros CSVs.
//   ok         → entra
//   fora       → o curso não existe nesta modalidade no cadastro (fica de fora)
//   repetido   → a mesma linha (nome, elegíveis e concluídos) veio no CSV de outra modalidade (fica na mais específica)
//   duplicado  → dois cursos com o mesmo nome nesta modalidade (entra só o primeiro)
// A decisão manual da CPA (config.decisoes) sempre vence e vale para as próximas atualizações.
export function conferir(porModalidade, cursos, config = {}) {
  const ids = new Set(cursos.map((c) => c.id))
  const decisoes = config.decisoes || {}
  const ajustes = config.elegiveis || {}
  const assinatura = (r) => `${normalizar(r.nome)}|${r.elegiveis}|${r.concluidos}`
  const ondeAparece = {}
  for (const [mod, linhas] of Object.entries(porModalidade)) for (const r of linhas || []) (ondeAparece[assinatura(r)] ||= []).push(mod)
  const tamanho = Object.fromEntries(Object.entries(porModalidade).map(([m, l]) => [m, (l || []).length]))

  const saida = {}
  for (const [mod, linhas] of Object.entries(porModalidade)) {
    const vistos = new Set()
    saida[mod] = (linhas || []).map((r) => {
      const cursoId = cursoIdDaPlanilha(nomeSemModalidade(r.nome), mod, ids)
      let status = 'ok'
      const outros = (ondeAparece[assinatura(r)] || []).filter((m) => m !== mod)
      // A linha repetida fica no CSV com menos linhas (o filtro mais específico do painel)
      const dono = outros.length ? [mod, ...outros].sort((a, b) => tamanho[a] - tamanho[b])[0] : mod
      if (!cursoId) status = 'fora'
      else if (dono !== mod) status = 'repetido'
      else if (vistos.has(cursoId)) status = 'duplicado'
      if (status === 'ok') vistos.add(cursoId)
      const chave = chaveLinha(mod, r)
      const inclui = decisoes[chave] != null ? decisoes[chave] : status === 'ok'
      const elegAjustado = cursoId && ajustes[`${mod}|${cursoId}`] ? Number(ajustes[`${mod}|${cursoId}`]) : null
      return { ...r, mod, chave, cursoId, status, inclui, elegAjustado, outros }
    })
  }
  return saida
}

// Dados publicados: só as linhas incluídas, com os elegíveis ajustados
export function montarDados(conferido, cursos, gerais) {
  const porId = Object.fromEntries(cursos.map((c) => [c.id, c]))
  const modalidades = {}
  for (const { k } of MODALIDADES_AO_VIVO) {
    const linhas = (conferido[k] || []).filter((r) => r.inclui)
    const lista = linhas.map((r) => ({
      id: r.cursoId,
      nome: porId[r.cursoId]?.nome || nomeSemModalidade(r.nome),
      elegiveis: r.elegAjustado || r.elegiveis,
      concluidos: r.concluidos,
      iniciados: r.iniciados,
    }))
    const soma = (c) => lista.reduce((s, x) => s + x[c], 0)
    modalidades[k] = { elegiveis: soma('elegiveis'), concluidos: soma('concluidos'), iniciados: soma('iniciados'), cursos: lista }
  }
  return { geral: gerais, modalidades }
}

/* ---------------- professores (CSV "Respostas" do painel) ---------------- */
// Soma, por curso e professor, as notas do questionário Docente (1 a 5; "não sei" fora da média).
// Os códigos dos alunos só servem para contar quantos alunos avaliaram cada professor e não saem do navegador.
export function lerCsvProfessores(arquivo, cursos, onProgresso) {
  const ids = new Set(cursos.map((c) => c.id))
  const grupos = new Map()
  const semCurso = {}
  let linhas = 0
  return new Promise((resolve, reject) => {
    Papa.parse(arquivo, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().replace(/^"(.*)"$/, '$1'),
      chunkSize: 1024 * 1024 * 4,
      chunk: (res) => {
        for (const l of res.data) {
          linhas++
          if (!/docente/i.test(l.Pesquisa || '')) continue
          const docente = String(l['Docente Alvo'] || '').trim()
          const curso = String(l.Curso || '').trim()
          const v = Number(String(l.Resposta || '').trim())
          if (!docente || !curso || !Number.isInteger(v) || v < 1 || v > 5) continue
          const cursoId = cursoIdDaPlanilha(nomeSemModalidade(curso), 'PRESENCIAL', ids)
          if (!cursoId) { semCurso[curso] = (semCurso[curso] || 0) + 1; continue }
          const k = cursoId + '|' + docente
          if (!grupos.has(k)) grupos.set(k, { curso_id: cursoId, docente, disciplinas: new Set(), alunos: new Set(), respostas: 0, soma: 0 })
          const g = grupos.get(k)
          g.respostas++
          g.soma += v
          if (l['Disciplina Alvo']) g.disciplinas.add(String(l['Disciplina Alvo']).trim())
          if (l['UUID Aluno']) g.alunos.add(l['UUID Aluno'])
        }
        onProgresso?.(res.meta.cursor / arquivo.size)
      },
      complete: () =>
        resolve({
          linhas,
          semCurso,
          professores: [...grupos.values()].map((g) => ({
            curso_id: g.curso_id,
            docente: g.docente,
            disciplinas: [...g.disciplinas].sort(),
            alunos: g.alunos.size,
            respostas: g.respostas,
            media: Math.round((g.soma / g.respostas) * 100) / 100,
          })),
        }),
      error: reject,
    })
  })
}

/* ---------------- banco ---------------- */
export async function carregarConfig() {
  const { data, error } = await sb.from('cpa_ao_vivo_config').select('config').eq('id', 1).maybeSingle()
  if (error) throw error
  return data?.config || {}
}

export async function salvarConfig(config) {
  const { error } = await sb.from('cpa_ao_vivo_config').upsert({ id: 1, config, atualizado_em: new Date().toISOString() })
  if (error) throw error
}

export async function publicarPanorama(ciclo, dados) {
  const { error } = await sb.from('cpa_ao_vivo').insert({ ciclo, dados })
  if (error) throw error
}

export async function publicarProfessores(ciclo, professores) {
  const { error: e1 } = await sb.from('cpa_ao_vivo_professores').delete().eq('ciclo', ciclo)
  if (e1) throw e1
  const agora = new Date().toISOString()
  for (let i = 0; i < professores.length; i += 500) {
    const lote = professores.slice(i, i + 500).map((p) => ({ ...p, ciclo, publicado_em: agora }))
    const { error } = await sb.from('cpa_ao_vivo_professores').insert(lote)
    if (error) throw error
  }
}

export async function ultimaPublicacao() {
  const { data, error } = await sb.from('cpa_ao_vivo').select('ciclo, dados, publicado_em').order('publicado_em', { ascending: false }).limit(1)
  if (error) throw error
  return data?.[0] || null
}

export async function carregarProfessores() {
  const out = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from('cpa_ao_vivo_professores').select('*').order('curso_id').range(de, de + 999)
    if (error) throw error
    out.push(...data)
    if (data.length < 1000) break
  }
  // Fica só o ciclo mais recente
  const ciclo = out.reduce((m, p) => (p.publicado_em > (m?.publicado_em || '') ? p : m), null)?.ciclo
  return ciclo ? out.filter((p) => p.ciclo === ciclo) : []
}

// Página aberta: um fetch simples, sem login nem sessão
export async function carregarPublico() {
  const r = await fetch(`${SUPABASE.url}/rest/v1/rpc/cpa_ao_vivo_publico`, {
    method: 'POST',
    headers: { apikey: SUPABASE.chave, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

export const pct = (a, b) => (b ? (a / b) * 100 : 0)
export const fmtPct = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
export const fmtNum = (v) => Number(v || 0).toLocaleString('pt-BR')
