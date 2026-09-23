// Transforma as abas da planilha no modelo usado pelo app.
// Regra da CPA: o texto das perguntas é exibido exatamente como está na planilha.

export const EIXOS = [
  { n: 1, nome: 'Planejamento e Avaliação Institucional', cor: '#0E77CC', dims: [8] },
  { n: 2, nome: 'Desenvolvimento Institucional', cor: '#17A460', dims: [1, 3] },
  { n: 3, nome: 'Políticas Acadêmicas', cor: '#6A4BC4', dims: [2, 4, 9] },
  { n: 4, nome: 'Políticas de Gestão', cor: '#D39A00', dims: [5, 6, 10] },
  { n: 5, nome: 'Infraestrutura Física', cor: '#E8386B', dims: [7] },
]

export const DIMENSOES = {
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
export const eixoInfo = (n) => EIXOS.find((e) => e.n === n)

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

// FNV-1a — id estável a partir do texto da pergunta
export function hashId(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

const clean = (v) => (v == null ? '' : String(v).trim())

function findHeader(rows) {
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const cells = rows[i].map(clean)
    const distinct = new Set(cells.filter(Boolean))
    if (distinct.size >= 3 && cells.some((c) => norm(c).includes('pergunta'))) return i
  }
  return -1
}

function colFinder(header) {
  const h = header.map(norm)
  return (...keys) => {
    for (const k of keys) {
      const i = h.findIndex((x) => x.includes(k))
      if (i >= 0) return i
    }
    return -1
  }
}

const eixoNum = (s) => {
  const m = clean(s).match(/(?:eixo\s*)?([1-5])\b/i)
  return m ? Number(m[1]) : null
}
const dimNum = (s) => {
  const m = clean(s).match(/dimens[aã]o\s*(\d{1,2})/i)
  const n = m ? Number(m[1]) : null
  return n >= 1 && n <= 10 ? n : null
}

function parseAtual(sheet) {
  const hi = findHeader(sheet.rows)
  const col = colFinder(sheet.rows[hi])
  const cP = col('pergunta'), cT = col('tipo'), cO = col('opcoes'), cE = col('eixo')
  const cObs = col('observa'), cM = col('modalidade'), cD = col('dimens'), cS = col('status')
  const map = new Map()
  for (let r = hi + 1; r < sheet.rows.length; r++) {
    const row = sheet.rows[r]
    const text = clean(row[cP])
    if (!text) continue
    const obs = clean(row[cObs])
    const item = obs.replace(/^Pesquisa:\s*CPA\s*-\s*/i, '').split(' — ')[0] || 'Sem item'
    const key = text + '|' + item
    if (!map.has(key)) {
      const dimRaw = clean(row[cD])
      const dim = dimNum(dimRaw)
      const eixo = eixoNum(row[cE]) ?? (dim ? EIXO_DA_DIM[dim] : null)
      map.set(key, {
        id: 'a' + hashId(key),
        fonte: 'atual',
        aba: sheet.name,
        text,
        tipo: clean(row[cT]),
        opcoes: clean(row[cO]),
        eixo,
        dim,
        dimTexto: dimRaw,
        revisar: !dim,
        item,
        status: clean(row[cS]),
        modalidades: [],
        linhas: [],
      })
    }
    const q = map.get(key)
    for (const m of clean(row[cM]).split(/,\s*/).filter(Boolean)) if (!q.modalidades.includes(m)) q.modalidades.push(m)
    q.linhas.push(r + 1)
  }
  return [...map.values()]
}

function parsePropostas(sheet) {
  const hi = findHeader(sheet.rows)
  const col = colFinder(sheet.rows[hi])
  const cE = col('eixo'), cD = col('dimens'), cJ = col('ja pergunt', 'parecido'), cP = col('candidata', 'pergunta proposta', 'texto da pergunta')
  const cObs = col('observa', 'inspira')
  const out = []
  const vistos = new Set()
  let eixoAtual = null
  for (let r = hi + 1; r < sheet.rows.length; r++) {
    const row = sheet.rows[r]
    if (eixoNum(row[cE])) eixoAtual = eixoNum(row[cE])
    const text = clean(row[cP])
    const dim = dimNum(row[cD])
    if (!text || !dim) continue
    let id = 'p' + hashId(norm(text) + '|' + dim)
    while (vistos.has(id)) id += 'x'
    vistos.add(id)
    out.push({
      id,
      fonte: 'proposta',
      aba: sheet.name,
      text,
      eixo: EIXO_DA_DIM[dim] ?? eixoAtual,
      dim,
      dimTexto: clean(row[cD]),
      jaExiste: clean(row[cJ]),
      obs: clean(row[cObs]),
      linha: r + 1,
    })
  }
  return out
}

function parseOutra(sheet) {
  const hi = findHeader(sheet.rows)
  if (hi < 0) return []
  const col = colFinder(sheet.rows[hi])
  const cP = col('pergunta'), cT = col('tipo'), cO = col('opcoes'), cE = col('eixo do sinaes', 'eixo')
  const cD = col('dimensao do sinaes'), cSt = col('status', 'situacao'), cObs = col('observa'), cSet = col('setor', 'bloco')
  const out = []
  for (let r = hi + 1; r < sheet.rows.length; r++) {
    const row = sheet.rows[r]
    const text = clean(row[cP])
    if (!text) continue
    const dim = cD >= 0 ? dimNum(row[cD]) : null
    out.push({
      id: 's' + hashId(sheet.name + '|' + norm(text) + '|' + r),
      fonte: 'setor',
      aba: sheet.name,
      text,
      tipo: clean(row[cT]),
      opcoes: clean(row[cO]),
      eixo: eixoNum(row[cE]) ?? (dim ? EIXO_DA_DIM[dim] : null),
      eixoTexto: clean(row[cE]),
      dim,
      setor: clean(row[cSet]),
      status: clean(row[cSt]),
      obs: clean(row[cObs]),
      linha: r + 1,
    })
  }
  return out
}

const IGNORAR = ['resumo', 'pagina', 'página']

export function buildModel(sheets) {
  const find = (k) => sheets.find((s) => norm(s.name).includes(k))
  const atualSheet = find('cpa atual')
  const propSheet = find('propostas')
  if (!atualSheet || !propSheet) {
    throw new Error('Não encontrei as abas "CPA Atual" e "Perguntas Propostas por Eixo" na planilha.')
  }
  const atual = parseAtual(atualSheet)
  const propostas = parsePropostas(propSheet)
  const outras = sheets
    .filter((s) => s !== atualSheet && s !== propSheet && !IGNORAR.some((k) => norm(s.name).startsWith(norm(k))))
    .map((s) => ({ nome: s.name, perguntas: parseOutra(s) }))
    .filter((s) => s.perguntas.length)
  const itens = [...new Set(atual.map((q) => q.item))]
  return { atual, propostas, outras, itens }
}

// Cobertura por dimensão: perguntas em uso + escolhidas como "Entra"
export function cobertura(model, escolhidas = []) {
  return Object.keys(DIMENSOES).map(Number).map((d) => {
    const emUso = model.atual.filter((q) => q.dim === d).length
    const propostas = model.propostas.filter((q) => q.dim === d).length
    const sel = escolhidas.filter((q) => q.dim === d).length
    const total = emUso + sel
    return {
      dim: d,
      eixo: EIXO_DA_DIM[d],
      emUso,
      propostas,
      sel,
      total,
      status: total === 0 ? 'pendente' : total === 1 ? 'fraca' : 'coberta',
    }
  })
}

export const STATUS = {
  coberta: { rotulo: 'Coberta', icone: '✓', cls: 'st-ok' },
  fraca: { rotulo: 'Fraca', icone: '!', cls: 'st-warn' },
  pendente: { rotulo: 'Pendente', icone: '✕', cls: 'st-crit' },
}
