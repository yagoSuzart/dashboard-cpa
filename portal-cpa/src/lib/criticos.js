// Regras da visão executiva do sistema anterior: cursos, professores e comentários que pedem atenção.
import { sb } from './dados.js'
import { DIMENSOES, SATISFACAO } from './config.js'
import { rotuloCurso } from './escopo.js'

// Cursos do escopo em ordem alfabética (nome · modalidade)
export function cursosOrdenados(base, escopo) {
  const porId = Object.fromEntries(base.cursos.map((c) => [c.id, c]))
  return escopo.map((id) => porId[id]).filter(Boolean).sort((a, b) => rotuloCurso(a).localeCompare(rotuloCurso(b), 'pt-BR'))
}

// Os 6 questionários do sistema anterior (cada um vira um item do menu)
export const QUESTIONARIOS = [
  { cod: 'cd', nome: 'Conteúdo das Disciplinas' },
  { cod: 'ia', nome: 'Infraestrutura e Atendimento' },
  { cod: 'pa', nome: 'Políticas Acadêmicas' },
  { cod: 'pg', nome: 'Políticas de Gestão' },
  { cod: 'dt', nome: 'Docência e Tutoria' },
  { cod: 'sg', nome: 'Satisfação Geral' },
]

// Mesmas palavras do sistema anterior para marcar um comentário como crítico
export const NEGATIVE_KEYWORDS = [
  'ruim', 'péssimo', 'pessimo', 'péssima', 'pessima', 'não gostei', 'nao gostei', 'insuficiente',
  'horrível', 'horrivel', 'horrend', 'fraco', 'fraca', 'precário', 'precario', 'precária', 'precaria',
  'deficiente', 'decepcion', 'frustrant', 'sofrível', 'sofrivel', 'não recomendo', 'nao recomendo',
  'abaixo do esperado', 'sucateado', 'sucateada', 'trava', 'travando', 'difícil conseguir', 'dificil conseguir',
  'demora', 'demorado', 'falta', 'faltam', 'faltou', 'atrapalha', 'crítico', 'critico',
]

export function normalizarTexto(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const CHAVES_NORM = NEGATIVE_KEYWORDS.map(normalizarTexto)

export function isComentarioNegativo(comentario) {
  if (comentario.sentimento === 'bad') return true
  const t = normalizarTexto(comentario.texto)
  return CHAVES_NORM.some((k) => t.includes(k))
}

// Textos do sistema anterior para os pontos fortes e as oportunidades de cada dimensão
export const MSG_FORTE = {
  'Conteúdo das Disciplinas': 'Os alunos reconhecem a qualidade do material e das aulas — vale destacar isso na divulgação do curso.',
  'Infraestrutura e Atendimento': 'A estrutura oferecida está sendo bem avaliada pelos alunos.',
  'Políticas Acadêmicas': 'As regras e o funcionamento acadêmico estão claros para os alunos.',
  'Políticas de Gestão': 'A gestão do curso está sendo percebida de forma positiva.',
  'Docência e Tutoria': 'O corpo docente está entregando um ensino bem avaliado.',
}
export const MSG_OPORTUNIDADE = {
  'Conteúdo das Disciplinas': 'Vale revisar ementas ou dinâmica das aulas com menor avaliação.',
  'Infraestrutura e Atendimento': 'Ponto de atenção recorrente — vale checar os comentários para entender a causa.',
  'Políticas Acadêmicas': 'Pode valer a pena reforçar a comunicação sobre regras e prazos acadêmicos.',
  'Políticas de Gestão': 'Os alunos sentem falta de mais proximidade com a coordenação.',
  'Docência e Tutoria': 'Vale conversar com o corpo docente/tutoria sobre esse recorte.',
}

// Dimensões da maior para a menor nota (só as que têm nota)
export function dimensoesOrdenadas(medias) {
  return DIMENSOES.filter((d) => medias[d] != null).sort((a, b) => medias[b] - medias[a])
}

// Os 10 cursos com menor satisfação geral, com a dimensão mais frágil de cada um
export function cursosCriticos(notas, ids, n = 10) {
  return ids
    .map((id) => ({ id, sat: notas[id]?.[SATISFACAO] }))
    .filter((x) => x.sat != null)
    .sort((a, b) => a.sat - b.sat)
    .slice(0, n)
    .map((x) => {
      const cat = notas[x.id] || {}
      const frag = DIMENSOES.filter((d) => cat[d] != null).sort((a, b) => cat[a] - cat[b])[0] || null
      return { ...x, fragilidade: frag, notaFragilidade: frag ? cat[frag] : null }
    })
}

// Os 10 professores com menor nota (empate: quem teve mais respondentes primeiro)
export function professoresCriticos(professores, ids, n = 10) {
  const set = new Set(ids)
  return professores
    .filter((p) => set.has(p.curso_id) && p.nota != null)
    .map((p) => ({ ...p, nota: Number(p.nota) }))
    .sort((a, b) => a.nota - b.nota || (b.respondentes || 0) - (a.respondentes || 0))
    .slice(0, n)
}

const CAMPOS = 'id, curso_id, turma, professor, categoria, texto, sentimento'

function filtroCriticos(q) {
  const termos = NEGATIVE_KEYWORDS.map((k) => `texto.ilike.%${k}%`)
  return q.or(['sentimento.eq.bad', ...termos].join(','))
}

// Comentários críticos (negativos ou com palavras de alerta), na ordem em que foram registrados.
// O banco faz uma primeira seleção e a regra do sistema anterior (sem acentos) confirma cada um.
export async function comentariosCriticos({ cursos, limite }) {
  let q = sb.from('comentarios').select(CAMPOS)
  if (cursos) q = q.in('curso_id', cursos)
  const { data, error } = await filtroCriticos(q).order('id').limit(limite * 3)
  if (error) throw error
  return data.filter(isComentarioNegativo).slice(0, limite)
}

export async function contarComentariosCursos(cursos) {
  let q = sb.from('comentarios').select('id', { count: 'exact', head: true })
  if (cursos) q = q.in('curso_id', cursos)
  const { count, error } = await q
  if (error) throw error
  return count || 0
}

// Comentários de um curso numa dimensão (e turma), paginados no banco
export async function comentariosQuestionario({ cursoId, categoria, turma, pagina = 0, porPagina = 10 }) {
  let q = sb.from('comentarios').select(CAMPOS, { count: 'exact' }).eq('curso_id', cursoId).eq('categoria', categoria)
  if (turma) q = q.eq('turma', turma)
  const { data, count, error } = await q.order('id').range(pagina * porPagina, pagina * porPagina + porPagina - 1)
  if (error) throw error
  return { itens: data, total: count || 0 }
}

// Todos os comentários com professor identificado de um curso
export async function comentariosDosProfessores(cursoId) {
  const PAG = 1000
  const out = []
  for (let de = 0; ; de += PAG) {
    const { data, error } = await sb
      .from('comentarios')
      .select(CAMPOS)
      .eq('curso_id', cursoId)
      .not('professor', 'is', null)
      .order('id')
      .range(de, de + PAG - 1)
    if (error) throw error
    out.push(...data)
    if (data.length < PAG) return out
  }
}
