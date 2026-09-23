// Leitor mínimo de .xlsx (sem dependências vulneráveis): descompacta com fflate
// e lê o XML com DOMParser. Devolve cada aba como matriz de textos, já com as
// células mescladas preenchidas com o valor da célula de origem.
import { unzipSync, strFromU8 } from 'fflate'

const parseXml = (s) => new DOMParser().parseFromString(s, 'application/xml')

function colIndex(ref) {
  const letters = ref.match(/^[A-Z]+/)[0]
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

function cellRef(ref) {
  return { c: colIndex(ref), r: parseInt(ref.match(/\d+/)[0], 10) - 1 }
}

// Texto de um <si> ou <is>: junta os <t> diretos e os de cada <r> (ignora <rPh>)
function richText(node) {
  let out = ''
  for (const child of node.childNodes) {
    if (child.nodeName === 't') out += child.textContent
    else if (child.nodeName === 'r') {
      for (const t of child.childNodes) if (t.nodeName === 't') out += t.textContent
    }
  }
  return out
}

export function readWorkbook(buffer) {
  const files = unzipSync(new Uint8Array(buffer))
  const text = (p) => (files[p] ? strFromU8(files[p]) : null)

  const shared = []
  const ss = text('xl/sharedStrings.xml')
  if (ss) for (const si of parseXml(ss).getElementsByTagName('si')) shared.push(richText(si))

  const rels = {}
  for (const rel of parseXml(text('xl/_rels/workbook.xml.rels')).getElementsByTagName('Relationship')) {
    rels[rel.getAttribute('Id')] = rel.getAttribute('Target')
  }

  const sheets = []
  for (const s of parseXml(text('xl/workbook.xml')).getElementsByTagName('sheet')) {
    const target = rels[s.getAttribute('r:id')]
    const path = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '')
    const xml = text(path)
    if (!xml) continue
    const doc = parseXml(xml)
    const rows = []
    for (const c of doc.getElementsByTagName('c')) {
      const { r, c: col } = cellRef(c.getAttribute('r'))
      const t = c.getAttribute('t')
      let v = ''
      if (t === 'inlineStr') {
        const is = c.getElementsByTagName('is')[0]
        v = is ? richText(is) : ''
      } else {
        const vn = c.getElementsByTagName('v')[0]
        if (vn) v = t === 's' ? shared[parseInt(vn.textContent, 10)] ?? '' : vn.textContent
      }
      if (v === '') continue
      ;(rows[r] ||= [])[col] = v
    }
    for (const m of doc.getElementsByTagName('mergeCell')) {
      const [a, b] = m.getAttribute('ref').split(':')
      const s0 = cellRef(a)
      const s1 = cellRef(b)
      const v = rows[s0.r]?.[s0.c]
      if (v === undefined) continue
      for (let r = s0.r; r <= s1.r; r++)
        for (let c = s0.c; c <= s1.c; c++) (rows[r] ||= [])[c] ??= v
    }
    for (let i = 0; i < rows.length; i++) rows[i] ||= []
    sheets.push({ name: s.getAttribute('name'), rows })
  }
  return sheets
}
