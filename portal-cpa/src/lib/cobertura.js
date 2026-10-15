import { CATEGORIAS_PLANO } from './planos.js'

export const dimensoesDe = (p) => (p.categoria || '').split(',').map((x) => x.trim()).filter(Boolean)

// Planos que contam como cobertura dos cursos de uma pessoa: os dela e os dos professores
// auxiliares / coordenadores adjuntos dos mesmos cursos.
export function planosDaCobertura(base, pessoaId, cursoIds) {
  const cursos = new Set(cursoIds)
  const aux = new Set(base.usuarios.filter((u) => u.role === 'professor_auxiliar').map((u) => u.id))
  return base.planos.filter((p) => p.tipo !== 'setor' && cursos.has(p.curso_id) && (p.usuario_id === pessoaId || aux.has(p.usuario_id)))
}

// Situação de envio de um plano, para a cobrança: só conta como entregue o que foi ENVIADO para a análise.
//   enviado: seguiu para a CPA / Pró-Reitoria (ou já foi aprovado / concluído)
//   devolvido: voltou com comentário e ainda não foi reenviado
//   nao_enviado: escrito, mas parado antes do envio (ex.: plano do auxiliar esperando o coordenador aprovar e enviar)
export function situacaoEnvio(p) {
  if (p.status === 'devolvido' || (p.status === 'aguardando_coordenador' && p.comentario_revisor)) return 'devolvido'
  if (p.status === 'rascunho' || p.status === 'aguardando_coordenador') return 'nao_enviado'
  return 'enviado'
}
export const ESTADO_CELULA = {
  ok: { t: 'Enviado', c: 'verde' },
  devolvido: { t: 'Devolvido, falta reenviar', c: 'laranja' },
  nao_enviado: { t: 'Escrito, mas não enviado', c: 'roxo' },
  falta: { t: 'Falta fazer', c: 'vermelho' },
}

// Conta, por curso e por dimensão, os planos e a situação de envio de cada célula
export function calcularCobertura(cursos, planos) {
  const linhas = cursos.map((c) => {
    const doCurso = planos.filter((p) => p.curso_id === c.id)
    const porDim = Object.fromEntries(CATEGORIAS_PLANO.map((d) => [d, 0]))
    const planosDim = Object.fromEntries(CATEGORIAS_PLANO.map((d) => [d, []]))
    let semDim = 0
    for (const p of doCurso) {
      const ds = dimensoesDe(p).filter((d) => porDim[d] != null)
      if (!ds.length) semDim++
      for (const d of ds) {
        porDim[d]++
        planosDim[d].push(p)
      }
    }
    // Estado da célula: basta um plano enviado; senão, devolvido; senão, escrito sem envio; senão, falta
    const estado = Object.fromEntries(CATEGORIAS_PLANO.map((d) => {
      const sits = planosDim[d].map(situacaoEnvio)
      return [d, sits.includes('enviado') ? 'ok' : sits.includes('devolvido') ? 'devolvido' : sits.length ? 'nao_enviado' : 'falta']
    }))
    const enviadosDim = Object.fromEntries(CATEGORIAS_PLANO.map((d) => [d, planosDim[d].filter((p) => situacaoEnvio(p) === 'enviado').length]))
    const enviados = doCurso.filter((p) => situacaoEnvio(p) === 'enviado').length
    const faltam = CATEGORIAS_PLANO.filter((d) => estado[d] !== 'ok')
    return { curso: c, total: doCurso.length, enviados, porDim, enviadosDim, planosDim, estado, semDim, faltam }
  })
  // "Entregue" = ao menos um plano ENVIADO (escrito e parado não conta)
  const comPlano = linhas.filter((l) => l.enviados > 0).length
  const completos = linhas.filter((l) => l.faltam.length === 0).length
  const paradas = linhas.reduce((s, l) => s + CATEGORIAS_PLANO.filter((d) => ['nao_enviado', 'devolvido'].includes(l.estado[d])).length, 0)
  return { linhas, comPlano, completos, total: linhas.length, paradas }
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
