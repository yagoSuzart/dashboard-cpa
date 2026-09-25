// Regras de leitura da pesquisa CPA (planilha de respostas) — usadas no importador e nas telas.

// Cada questionário da planilha pertence a uma dimensão do sistema.
export function dimensaoDaPesquisa(pesquisa) {
  const p = normalizar(pesquisa)
  if (p.includes('docente') || p.includes('tutor') || p.includes('professores')) return 'Docência e Tutoria'
  if (p.includes('infraestrutura')) return 'Infraestrutura e Atendimento'
  if (p.includes('politicas academicas')) return 'Políticas Acadêmicas'
  if (p.includes('politicas de gestao')) return 'Políticas de Gestão'
  if (p.includes('conteudo')) return 'Conteúdo das Disciplinas'
  if (p.includes('satisfacao')) return 'Satisfação Geral'
  return null
}

// Satisfação Geral vai de 0 a 10; os demais de 1 a 5, com 6 = aluno que não utiliza (fora da média).
export function escalaDaPesquisa(pesquisa) {
  return normalizar(pesquisa).includes('satisfacao geral') ? '0a10' : '1a5'
}

// Nome curto do questionário, sem o "CPA - " do começo.
export function nomeCurto(pesquisa) {
  return String(pesquisa || '').replace(/^\s*CPA\s*-\s*/i, '').trim()
}

export function normalizar(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function slug(s) {
  return normalizar(s).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

// Nomes da planilha que diferem do cadastro de cursos
const PREFIXOS = [/^graduacao tecnologica em /, /^tecnologico em /, /^tecnologia em /, /^curso superior de tecnologia em /]
const APELIDOS = { influenciador_digital: 'influenciador_digital_creator_digital_influencer' }

export function cursoIdDaPlanilha(nome, modalidade, idsValidos) {
  let n = normalizar(nome)
  for (const re of PREFIXOS) n = n.replace(re, '')
  let base = slug(n)
  if (APELIDOS[base]) base = APELIDOS[base]
  const id = base + '__' + normalizar(modalidade)
  return idsValidos.has(id) ? id : null
}

// Contagens de uma linha de resultado (c0..c10) → estatísticas
export function estatisticas(r) {
  const escala = r.escala
  const valores = escala === '0a10' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [1, 2, 3, 4, 5]
  const contagem = valores.map((v) => ({ valor: v, qtd: Number(r['c' + v]) || 0 }))
  const n = Number(r.n) || 0
  const media = n ? Number(r.soma) / n : null
  const out = { escala, contagem, n, media, naoUtilizo: Number(r.nao_utilizo) || 0 }
  if (escala === '0a10') {
    const promotores = (Number(r.c9) || 0) + (Number(r.c10) || 0)
    const detratores = [0, 1, 2, 3, 4, 5, 6].reduce((a, v) => a + (Number(r['c' + v]) || 0), 0)
    out.nps = n ? Math.round(((promotores - detratores) / n) * 100) : null
  }
  return out
}

export function fmtNota(v, casas = 2) {
  if (v == null || Number.isNaN(v)) return '—'
  return Number(v).toFixed(casas).replace('.', ',')
}

export function fmtInt(v) {
  return Number(v || 0).toLocaleString('pt-BR')
}

// Comentários vêm com "\n" escrito como texto em alguns casos; na tela vira quebra de linha.
export function textoComentario(t) {
  return String(t || '').replace(/\\n/g, '\n')
}

export const SENTIMENTO = {
  warn: { rotulo: 'Pedem atenção', selo: 'laranja' },
  bad: { rotulo: 'Negativos', selo: 'laranja' },
  good: { rotulo: 'Positivos', selo: 'azul' },
}
