import { CATEGORIAS_PLANO } from './planos.js'

export const dimensoesDe = (p) => (p.categoria || '').split(',').map((x) => x.trim()).filter(Boolean)

// Planos que contam como cobertura dos cursos de uma pessoa: os dela e os dos professores
// auxiliares / coordenadores adjuntos dos mesmos cursos.
export function planosDaCobertura(base, pessoaId, cursoIds) {
  const cursos = new Set(cursoIds)
  const aux = new Set(base.usuarios.filter((u) => u.role === 'professor_auxiliar').map((u) => u.id))
  return base.planos.filter((p) => p.tipo !== 'setor' && cursos.has(p.curso_id) && (p.usuario_id === pessoaId || aux.has(p.usuario_id)))
}

// Conta, por curso e por dimensão, quantos planos existem
export function calcularCobertura(cursos, planos) {
  const linhas = cursos.map((c) => {
    const doCurso = planos.filter((p) => p.curso_id === c.id)
    const porDim = Object.fromEntries(CATEGORIAS_PLANO.map((d) => [d, 0]))
    let semDim = 0
    for (const p of doCurso) {
      const ds = dimensoesDe(p).filter((d) => porDim[d] != null)
      if (!ds.length) semDim++
      for (const d of ds) porDim[d]++
    }
    const faltam = CATEGORIAS_PLANO.filter((d) => !porDim[d])
    return { curso: c, total: doCurso.length, porDim, semDim, faltam }
  })
  const comPlano = linhas.filter((l) => l.total > 0).length
  const completos = linhas.filter((l) => l.total > 0 && l.faltam.length === 0).length
  return { linhas, comPlano, completos, total: linhas.length }
}

export const nomeCurso = (c) => c.nome || c.id

export function ordCurso(a, b) {
  return nomeCurso(a).localeCompare(nomeCurso(b), 'pt-BR') || String(a.modalidade).localeCompare(String(b.modalidade))
}

// Cursos (curso + modalidade de oferta) vinculados a uma pessoa
export function cursosDaPessoa(vinculos, base, pessoaId) {
  if (!vinculos) return []
  const ids = new Set(vinculos.filter((v) => v.usuario_id === pessoaId).map((v) => v.curso_id))
  return base.cursos.filter((c) => ids.has(c.id)).sort(ordCurso)
}

// Resumo curto para a lista do acompanhamento: "4 de 5 cursos entregues"
export function coberturaResumida(vinculos, base, pessoaId) {
  const cursos = cursosDaPessoa(vinculos, base, pessoaId)
  if (!cursos.length) return null
  const cob = calcularCobertura(cursos, planosDaCobertura(base, pessoaId, cursos.map((c) => c.id)))
  return { entregues: cob.comPlano, total: cob.total }
}
