// Padronização dos valores que vêm da planilha/banco, SEM alterar o banco.
// Ex.: "Sãp Paulo" → SP, "4.0" → 4, "S/C" → sem conceito, "25/09/2026" → data.

/** Remove acentos, deixa minúsculo e tira espaços repetidos. */
export function chave(s: unknown): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------------------------------------------------------------------
//  Estados → UF
// ---------------------------------------------------------------------
const UFS: Record<string, string> = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM', bahia: 'BA', ceara: 'CE',
  'distrito federal': 'DF', brasilia: 'DF', 'espirito santo': 'ES', goias: 'GO', maranhao: 'MA',
  'mato grosso': 'MT', 'mato grosso do sul': 'MS', 'minas gerais': 'MG', para: 'PA', paraiba: 'PB',
  parana: 'PR', pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN',
  'rio grande do sul': 'RS', rondonia: 'RO', roraima: 'RR', 'santa catarina': 'SC', 'sao paulo': 'SP',
  sergipe: 'SE', tocantins: 'TO',
  // Erros de digitação encontrados na base (out/2026)
  'sap paulo': 'SP', parara: 'PR', pernanbuco: 'PE',
}
const EXTERIOR = new Set(['japao', 'angola', 'portugal', 'estados unidos', 'eua'])

/** Sigla da UF a partir do nome do estado. "EX" = exterior; null = não reconhecido. */
export function ufDe(estado: unknown): string | null {
  const k = chave(estado)
  if (!k) return null
  if (/^[a-z]{2}$/.test(k)) return k.toUpperCase()
  if (UFS[k]) return UFS[k]
  if (EXTERIOR.has(k)) return 'EX'
  return null
}

// ---------------------------------------------------------------------
//  Conceitos do MEC (CC, CPC, ENADE) guardados como texto
// ---------------------------------------------------------------------
export interface Conceito {
  /** Nota numérica de 1 a 5, ou null quando não há nota. */
  nota: number | null
  /** Texto para mostrar: "4", "Sem conceito (S/C)", "Não há", "Não informado". */
  texto: string
}

export function conceito(v: unknown): Conceito {
  const k = chave(v)
  if (!k) return { nota: null, texto: 'Não informado' }
  if (k === 's/c' || k === 'sc') return { nota: null, texto: 'Sem conceito (S/C)' }
  if (k.startsWith('nao ha')) return { nota: null, texto: 'Não há' }
  const n = Number(k.replace(',', '.'))
  if (Number.isFinite(n) && n >= 1 && n <= 5) {
    return { nota: n, texto: Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',') }
  }
  return { nota: null, texto: String(v) }
}

// ---------------------------------------------------------------------
//  Modalidade
// ---------------------------------------------------------------------
export function modalidadeCurta(v: unknown): string {
  const k = chave(v)
  if (!k) return 'Não informada'
  if (k.includes('distancia') || k === 'ead') return 'EAD'
  if (k.includes('semi')) return 'Semipresencial'
  if (k.includes('presencial')) return 'Presencial'
  return String(v)
}

// ---------------------------------------------------------------------
//  Datas guardadas como texto
// ---------------------------------------------------------------------
/** Aceita "dd/mm/aaaa" ou "aaaa-mm-dd[ hh:mm:ss]". Devolve null se não for uma data válida. */
export function data(v: unknown): Date | null {
  const s = String(v ?? '').trim()
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  let d: Date | null = null
  if (m) d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  else if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d && !Number.isNaN(d.getTime()) ? d : null
}

export function formatarData(d: Date | null): string {
  return d ? d.toLocaleDateString('pt-BR') : '—'
}

/** Dias corridos de hoje até a data (negativo = já passou). */
export function diasAte(d: Date, hoje = new Date()): number {
  const h = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return Math.round((d.getTime() - h.getTime()) / 86_400_000)
}

/** Código e-MEC do polo: usa a coluna própria ou extrai do texto "(Cód. Polo E-Mec 1179306)". */
export function codigoPolo(...fontes: unknown[]): string | null {
  for (const f of fontes) {
    const s = String(f ?? '').trim()
    if (/^\d{5,9}$/.test(s)) return s
    const m = s.match(/e-?mec\s*:?\s*(\d{5,9})/i)
    if (m) return m[1]
  }
  return null
}

/** Primeira letra maiúscula, para valores como "ativo" → "Ativo". */
export const capitalizar = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

/** Compara textos em ordem alfabética do português (acentos certos). */
export const compararTexto = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true }).compare
