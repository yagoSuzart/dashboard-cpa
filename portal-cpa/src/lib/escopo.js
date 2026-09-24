import { DIMENSOES, SATISFACAO, MODALIDADE_LABEL, TRILHO } from './config.js'

// Cursos que a pessoa acompanha — mesma regra do sistema atual:
// visão global para Pró-Reitoria, CPA, Comissão e admin; diretor(a) de núcleo vê os cursos que coordena
// e os do núcleo; os demais, os cursos vinculados.
export function cursosDoEscopo(perfil, cursos) {
  if (perfil.global) return cursos.map((c) => c.id)
  const ids = new Set([...(perfil.cursos || []), ...(perfil.nucleoCursos || [])])
  return cursos.filter((c) => ids.has(c.id)).map((c) => c.id)
}

export function ehSetor(perfil) {
  return perfil.role === 'setor' || perfil.role === 'diretor_nucleo_setor'
}

export function rotuloCurso(c) {
  if (!c) return ''
  return `${c.nome} · ${MODALIDADE_LABEL[c.modalidade] || c.modalidade}`
}

// Média simples dos cursos em cada dimensão
export function mediasPorDimensao(notas, ids) {
  const out = {}
  for (const d of [...DIMENSOES, SATISFACAO]) {
    const vs = ids.map((id) => notas[id]?.[d]).filter((v) => typeof v === 'number' && !Number.isNaN(v))
    out[d] = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null
  }
  return out
}

export function planosDoEscopo(perfil, planos, idsCursos) {
  if (perfil.global) return planos
  const ids = new Set(idsCursos)
  if (perfil.role === 'setor') return planos.filter((p) => p.setor_id === perfil.setor || (p.externa && p.area === perfil.setor))
  return planos.filter((p) => ids.has(p.curso_id) || p.usuario_id === perfil.id)
}

// Quantos planos em cada etapa do trilho (rascunho conta como enviado; devolvidos à parte)
export function contarTrilho(planos) {
  const c = Object.fromEntries(TRILHO.map((s) => [s, 0]))
  let devolvidos = 0
  for (const p of planos) {
    if (p.status === 'devolvido') devolvidos++
    else if (p.status === 'rascunho') c.enviado++
    else if (c[p.status] != null) c[p.status]++
  }
  return { c, devolvidos }
}
