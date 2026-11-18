// Números parciais da CPA ("CPA ao vivo" no código): lê os CSVs do painel da avaliação, confere os cursos com o cadastro do Portal e publica
// o panorama aberto (sem login) e o ranking de professores (só para a coordenação).
// Nada de aluno sai do navegador: do CSV de respostas só vão médias e contagens por professor.
import Papa from 'papaparse'
import { sb } from './dados.js'
import { SUPABASE } from './config.js'
import { cursoIdDaPlanilha, normalizar } from './cpa.js'

export const MODALIDADES_AO_VIVO = [
  // Cores validadas para o fundo escuro da página (faixa de luminosidade, contraste e daltonismo)
  { k: 'PRESENCIAL', t: 'Presencial', cor: '#199e70' },
  { k: 'SEMIPRESENCIAL', t: 'Semipresencial', cor: '#d95926' },
  { k: 'EAD', t: 'EAD', cor: '#3987e5' },
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
  if (linhas.length && 'Pesquisa' in linhas[0] && 'Resposta' in linhas[0])
    throw new Error(`"${arquivo.name}" é o CSV de Respostas (uma linha por resposta): ele vai no passo 4, de professores. Aqui no passo 1 vai o CSV do quadro "Respondentes por curso" (o arquivo começa com "respondentes-cpa").`)
  if (!linhas.length || !('Curso' in linhas[0]) || !('Elegíveis' in linhas[0]))
    throw new Error(`"${arquivo.name}" não parece o CSV "Respondentes por curso" do painel (faltam as colunas Curso e Elegíveis). Baixe pelo botão "Baixar CSV" do quadro "Respondentes por curso".`)
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
// porMod: números dos cards do painel por modelo de oferta (quando a CPA digitou); sem eles, vale a soma dos cursos
export function montarDados(conferido, cursos, gerais, porMod = {}, evolucao = null) {
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
    const painel = porMod[k]
    modalidades[k] = painel
      ? { ...painel, painel, cursos: lista }
      : { elegiveis: soma('elegiveis'), concluidos: soma('concluidos'), iniciados: soma('iniciados'), cursos: lista }
  }
  return { geral: gerais, modalidades, ...(evolucao?.length ? { evolucao } : {}) }
}

/* ---------------- professores (CSV "Respostas" do painel) ---------------- */
// Soma, por curso e professor, as notas do questionário Docente (1 a 5; "não sei" fora da média).
// Os códigos dos alunos só servem para contar quantos alunos avaliaram cada professor e não saem do navegador.
// Data (AAAA-MM-DD) de uma célula como "2026-11-10 14:32" ou "10/11/2026 14:32"
function diaDe(v) {
  const t = String(v || '')
  let m = t.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = t.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}
const modDoPeriodo = (p) => (/^E/i.test(p || '') ? 'EAD' : /^S/i.test(p || '') ? 'SEMIPRESENCIAL' : /^G/i.test(p || '') ? 'PRESENCIAL' : null)

// Evolução dia a dia de quem CONCLUIU TUDO: o aluno entra na curva no dia em que concluiu o último questionário
// do seu modelo de oferta (os questionários de cada modalidade saem do próprio arquivo). Acumulado, por modalidade.
function montarEvolucao(alunos, pesquisasDaMod) {
  const porDia = {}
  for (const a of alunos.values()) {
    const exigidas = pesquisasDaMod[a.mod]
    if (!a.mod || !exigidas || a.feitas.size < exigidas.size) continue
    let ok = true, ultimo = ''
    for (const p of exigidas) {
      const d = a.feitas.get(p)
      if (!d) { ok = false; break }
      if (d > ultimo) ultimo = d
    }
    if (!ok || !ultimo) continue
    const d = (porDia[ultimo] ||= { PRESENCIAL: 0, SEMIPRESENCIAL: 0, EAD: 0 })
    d[a.mod]++
  }
  const acum = { PRESENCIAL: 0, SEMIPRESENCIAL: 0, EAD: 0 }
  return Object.keys(porDia).sort().map((dia) => {
    for (const k of Object.keys(acum)) acum[k] += porDia[dia][k]
    return { dia, ...acum, total: acum.PRESENCIAL + acum.SEMIPRESENCIAL + acum.EAD }
  })
}

// Lê um ou mais CSVs "Respostas" (um por modelo de oferta, ou o geral) e devolve só agregados:
// - professores: média por curso e professor no questionário Docente (1 a 5; "não sei" fora da média);
// - perguntas: distribuição das notas de cada pergunta, por modelo de oferta (e por curso, quando o painel informa);
// - pesquisas: alunos que iniciaram e concluíram cada questionário;
// - evolucao: a curva dia a dia de quem concluiu tudo.
// Linhas repetidas entre arquivos contam uma vez. Códigos de aluno e comentários não saem do navegador.
export async function lerCsvRespostas(arquivos, cursos, onProgresso) {
  const lista = Array.isArray(arquivos) ? arquivos : [arquivos]
  const ids = new Set(cursos.map((c) => c.id))
  const grupos = new Map()
  const semCurso = {}
  const alunos = new Map()
  const pesquisasDaMod = {}
  const perguntas = new Map()
  const pesquisas = new Map()
  const vistas = new Set()
  const mods = new Set()
  let linhas = 0, repetidas = 0
  const total = lista.reduce((s, a) => s + (a.size || 0), 0) || 1
  let feito = 0
  for (const arquivo of lista) {
    let primeiro = true
    await new Promise((resolve, reject) => {
      Papa.parse(arquivo, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().replace(/^"(.*)"$/, '$1'),
        chunkSize: 1024 * 1024 * 4,
        chunk: (res, parser) => {
          if (primeiro) {
            primeiro = false
            if (res.data[0] && !('Resposta' in res.data[0] && 'Pesquisa' in res.data[0])) {
              parser.abort()
              reject(new Error(`"${arquivo.name}" não é o CSV de Respostas (falta a coluna Resposta). Use Exportar → Respostas no painel.`))
              return
            }
          }
          for (const l of res.data) {
            const aluno = l['UUID Aluno']
            const mod = modDoPeriodo(l['Período'])
            const pesq = String(l.Pesquisa || '').trim()
            const nPerg = parseInt(l['Nº Pergunta'], 10)
            const docente = String(l['Docente Alvo'] || '').trim()
            const disc = String(l['Disciplina Alvo'] || '').trim()
            const chave = `${aluno}|${pesq}|${nPerg}|${docente}|${disc}|${l.Turma || ''}`
            if (vistas.has(chave)) { repetidas++; continue }
            vistas.add(chave)
            linhas++
            if (!mod || !pesq) continue
            mods.add(mod)
            ;(pesquisasDaMod[mod] ||= new Set()).add(pesq)
            const concluiu = /complet|conclu/i.test(l.Status || '')
            if (aluno) {
              const a = alunos.get(aluno) || { mod, feitas: new Map() }
              alunos.set(aluno, a)
              const fim = concluiu ? diaDe(l['Concluído Em']) || diaDe(l['Respondido Em']) : null
              if (fim) { const ant = a.feitas.get(pesq); if (!ant || fim > ant) a.feitas.set(pesq, fim) }
              const kp = mod + '|' + pesq
              if (!pesquisas.has(kp)) pesquisas.set(kp, { modalidade: mod, pesquisa: pesq, alunos: new Set(), concluiram: new Set(), perguntas: new Set() })
              const ps = pesquisas.get(kp)
              ps.alunos.add(aluno)
              if (concluiu) ps.concluiram.add(aluno)
              if (Number.isInteger(nPerg)) ps.perguntas.add(nPerg)
            }

            // Pergunta por pergunta (por curso quando o painel informa o curso)
            const resp = String(l.Resposta ?? '').trim()
            const curso = String(l.Curso || '').trim()
            let cursoId = ''
            if (curso) {
              cursoId = cursoIdDaPlanilha(nomeSemModalidade(curso), mod, ids) || ''
              if (!cursoId) semCurso[curso] = (semCurso[curso] || 0) + 1
            }
            if (Number.isInteger(nPerg) && resp) {
              const tipo = String(l.Tipo || '').trim() || 'rating_scale'
              const kq = `${mod}|${pesq}|${cursoId}|${nPerg}`
              if (!perguntas.has(kq)) perguntas.set(kq, { modalidade: mod, pesquisa: pesq, curso_id: cursoId, n_pergunta: nPerg, pergunta: String(l.Pergunta || '').trim(), tipo, respostas: 0, alunos: new Set(), dist: {} })
              const q = perguntas.get(kq)
              q.respostas++
              if (aluno) q.alunos.add(aluno)
              if (tipo !== 'textarea') { const v = String(Number(resp)); if (v !== 'NaN') q.dist[v] = (q.dist[v] || 0) + 1 }
            }

            // Professores (só o questionário Docente, notas 1 a 5)
            if (!/docente/i.test(pesq)) continue
            const v = Number(resp)
            if (!docente || !curso || !Number.isInteger(v) || v < 1 || v > 5) continue
            const cid = cursoIdDaPlanilha(nomeSemModalidade(curso), 'PRESENCIAL', ids)
            if (!cid) continue
            const k = cid + '|' + docente
            if (!grupos.has(k)) grupos.set(k, { curso_id: cid, docente, disciplinas: new Set(), alunos: new Set(), respostas: 0, soma: 0 })
            const g = grupos.get(k)
            g.respostas++
            g.soma += v
            if (disc) g.disciplinas.add(disc)
            if (aluno) g.alunos.add(aluno)
          }
          onProgresso?.((feito + res.meta.cursor) / total)
        },
        complete: resolve,
        error: reject,
      })
    })
    feito += arquivo.size || 0
  }

  return {
    linhas,
    repetidas,
    semCurso,
    modalidades: [...mods],
    evolucao: montarEvolucao(alunos, pesquisasDaMod),
    professores: [...grupos.values()].map((g) => ({
      curso_id: g.curso_id,
      docente: g.docente,
      disciplinas: [...g.disciplinas].sort(),
      alunos: g.alunos.size,
      respostas: g.respostas,
      media: Math.round((g.soma / g.respostas) * 100) / 100,
    })),
    perguntas: [...perguntas.values()].map((q) => {
      const vals = Object.keys(q.dist).map(Number)
      const escala = q.tipo === 'textarea' ? null : vals.some((v) => v === 0 || v > 6) ? 'nps_0_10' : 'likert_5'
      let soma = 0, n = 0
      for (const [v, c] of Object.entries(q.dist)) {
        const x = Number(v)
        if (escala === 'likert_5' && (x < 1 || x > 5)) continue
        soma += x * c
        n += c
      }
      return {
        modalidade: q.modalidade, pesquisa: q.pesquisa, curso_id: q.curso_id, n_pergunta: q.n_pergunta, pergunta: q.pergunta, tipo: q.tipo,
        escala, respostas: q.respostas, alunos: q.alunos.size, distribuicao: q.dist, media: n ? Math.round((soma / n) * 100) / 100 : null,
      }
    }),
    pesquisas: [...pesquisas.values()].map((p) => ({ modalidade: p.modalidade, pesquisa: p.pesquisa, alunos: p.alunos.size, concluiram: p.concluiram.size, perguntas: p.perguntas.size })),
  }
}

// Junta a curva nova com a anterior: as modalidades que vieram nos arquivos são substituídas, as outras ficam
export function mesclarEvolucao(nova, antiga, modsNovas) {
  if (!antiga?.length) return nova
  if (!nova?.length) return antiga
  const ks = MODALIDADES_AO_VIVO.map((m) => m.k)
  const serie = (lista, k) => new Map(lista.map((p) => [p.dia, p[k] || 0]))
  const fontes = Object.fromEntries(ks.map((k) => [k, serie(modsNovas.includes(k) ? nova : antiga, k)]))
  const dias = [...new Set([...nova, ...antiga].map((p) => p.dia))].sort()
  const ult = Object.fromEntries(ks.map((k) => [k, 0]))
  return dias.map((dia) => {
    const p = { dia }
    for (const k of ks) { if (fontes[k].has(dia)) ult[k] = fontes[k].get(dia); p[k] = ult[k] }
    p.total = ks.reduce((s, k) => s + p[k], 0)
    return p
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

// Respostas parciais: substitui só os modelos de oferta que vieram nos arquivos
export async function publicarRespostas(ciclo, r) {
  const mods = r.modalidades
  if (!mods.length) return
  const agora = new Date().toISOString()
  for (const t of ['cpa_respostas_perguntas', 'cpa_respostas_pesquisas']) {
    const { error } = await sb.from(t).delete().eq('ciclo', ciclo).in('modalidade', mods)
    if (error) throw error
  }
  const envia = async (t, linhas) => {
    for (let i = 0; i < linhas.length; i += 500) {
      const { error } = await sb.from(t).insert(linhas.slice(i, i + 500).map((x) => ({ ...x, ciclo, publicado_em: agora })))
      if (error) throw error
    }
  }
  await envia('cpa_respostas_pesquisas', r.pesquisas)
  await envia('cpa_respostas_perguntas', r.perguntas)
}

export async function carregarRespostas() {
  const pega = async (t) => {
    const out = []
    for (let de = 0; ; de += 1000) {
      const { data, error } = await sb.from(t).select('*').range(de, de + 999)
      if (error) throw error
      out.push(...data)
      if (data.length < 1000) break
    }
    return out
  }
  const [pesquisas, perguntas] = await Promise.all([pega('cpa_respostas_pesquisas'), pega('cpa_respostas_perguntas')])
  const ciclo = [...pesquisas, ...perguntas].reduce((m, p) => (p.publicado_em > (m?.publicado_em || '') ? p : m), null)?.ciclo
  return { ciclo, pesquisas: pesquisas.filter((p) => p.ciclo === ciclo), perguntas: perguntas.filter((p) => p.ciclo === ciclo) }
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
