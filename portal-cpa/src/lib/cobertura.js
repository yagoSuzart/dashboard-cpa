import { CATEGORIAS_PLANO } from './planos.js'
import { MODALIDADE_LABEL } from './config.js'

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
  conferir: { t: 'A confirmar: há plano enviado por outra pessoa neste curso', c: 'amarelo' },
}

// Conta, por curso e por dimensão, os planos e a situação de envio de cada célula.
// Regra da CPA: um plano para cada curso, cada modalidade de oferta e cada questionário. Plano de outra
// modalidade NÃO cobre esta, mesmo que o curso tenha o mesmo nome.
// Margem de segurança (opcional): com { referencia: todos os planos }, a célula que daria "falta" mas tem plano
// ENVIADO para o mesmo curso e a mesma modalidade por outra pessoa (ex.: outro coordenador ou diretor de núcleo)
// vira "conferir": não conta como pendência até a CPA confirmar.
export function calcularCobertura(cursos, planos, { referencia = null } = {}) {
  const enviadosRef = (referencia || []).filter((p) => p.tipo !== 'setor' && situacaoEnvio(p) === 'enviado')
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
    // Indícios: planos enviados por outra pessoa no mesmo curso e modalidade
    const indicios = Object.fromEntries(CATEGORIAS_PLANO.map((d) => [d, []]))
    if (enviadosRef.length) {
      for (const d of CATEGORIAS_PLANO) {
        if (estado[d] !== 'falta') continue
        indicios[d] = enviadosRef.filter((p) => !doCurso.includes(p) && dimensoesDe(p).includes(d) && p.curso_id === c.id)
        if (indicios[d].length) estado[d] = 'conferir'
      }
    }
    const enviadosDim = Object.fromEntries(CATEGORIAS_PLANO.map((d) => [d, planosDim[d].filter((p) => situacaoEnvio(p) === 'enviado').length]))
    const enviados = doCurso.filter((p) => situacaoEnvio(p) === 'enviado').length
    const faltam = CATEGORIAS_PLANO.filter((d) => estado[d] !== 'ok' && estado[d] !== 'conferir')
    const conferir = CATEGORIAS_PLANO.filter((d) => estado[d] === 'conferir')
    return { curso: c, total: doCurso.length, enviados, porDim, enviadosDim, planosDim, estado, semDim, faltam, conferir, indicios }
  })
  // "Entregue" = ao menos um plano ENVIADO (escrito e parado não conta)
  const comPlano = linhas.filter((l) => l.enviados > 0).length
  const completos = linhas.filter((l) => l.faltam.length === 0).length
  const paradas = linhas.reduce((s, l) => s + CATEGORIAS_PLANO.filter((d) => ['nao_enviado', 'devolvido'].includes(l.estado[d])).length, 0)
  const aConferir = linhas.reduce((s, l) => s + l.conferir.length, 0)
  return { linhas, comPlano, completos, total: linhas.length, paradas, aConferir }
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

// Nomes curtos dos questionários (dimensões) para as colunas do gabarito
export const CURTO_DIM = {
  'Conteúdo das Disciplinas': 'Conteúdo',
  'Infraestrutura e Atendimento': 'Infraestrutura',
  'Políticas Acadêmicas': 'Pol. Acadêmicas',
  'Políticas de Gestão': 'Pol. de Gestão',
  'Docência e Tutoria': 'Docência',
  'Satisfação Geral': 'Satisfação Geral',
}

// O que o coordenador precisa fazer em cada célula pendente (para a tela e para o PDF)
export function acaoPendente(estado, planos, nomeDe = () => '') {
  if (estado === 'falta') return 'Montar o plano de ação (Resultados → Montar planos) e enviar, ou, se não houver pontos a melhorar, declarar isso no mesmo lugar.'
  const parados = planos.filter((p) => situacaoEnvio(p) === estado)
  const lista = parados.map((p) => `“${p.titulo}”${nomeDe(p.usuario_id) ? ' (' + nomeDe(p.usuario_id) + ')' : ''}`).join(', ')
  if (estado === 'devolvido') return `Plano devolvido com comentário: ${lista}. Ajustar e reenviar.`
  return `Plano escrito, mas não enviado: ${lista}. Revisar e clicar em Enviar.`
}

// Quem responde pelos planos de um curso: o coordenador e, nos cursos sem coordenador, o diretor de núcleo
// vinculado a eles (ex.: núcleos de Tecnologia e Engenharia)
export const RESPONDEM_PELO_CURSO = ['coordenador', 'diretor_nucleo']

// Coordenadores (e diretores de núcleo com cursos) com a cobertura de cada um (lista ordenada por pendências)
export function coberturaPorCoordenador(base, vinculos) {
  if (!vinculos) return []
  const porCurso = Object.fromEntries(base.cursos.map((c) => [c.id, c]))
  const cursosDe = {}
  for (const v of vinculos) (cursosDe[v.usuario_id] ||= []).push(v.curso_id)
  return base.usuarios
    .filter((u) => RESPONDEM_PELO_CURSO.includes(u.role) && cursosDe[u.id]?.length)
    .map((u) => {
      const ids = [...new Set(cursosDe[u.id])]
      const cursos = ids.map((id) => porCurso[id] || { id, nome: id, modalidade: '' }).sort(ordCurso)
      const cob = calcularCobertura(cursos, planosDaCobertura(base, u.id, ids), { referencia: base.planos })
      const pend = cob.linhas.reduce((s, l) => s + l.faltam.length, 0)
      return { u, cob, pend }
    })
    .sort((a, b) => b.pend - a.pend || a.u.nome.localeCompare(b.u.nome, 'pt-BR'))
}

// Texto do indício para a célula "a confirmar"
export function textoIndicio(planos, curso, base) {
  const nomeDe = (id) => base.usuarios.find((u) => u.id === id)?.nome || ''
  const onde = (p) => {
    const c = base.cursos.find((x) => x.id === p.curso_id)
    return c && c.id !== curso.id ? nomeCurso(c) + ' · ' + (MODALIDADE_LABEL[c.modalidade] || c.modalidade || '') : 'este curso, por outra pessoa'
  }
  return planos.map((p) => `“${p.titulo}” (${onde(p)}${nomeDe(p.usuario_id) ? ', ' + nomeDe(p.usuario_id) : ''})`).join('; ')
}

// Mensagem pronta para mandar no privado ao coordenador, com o que falta
export function mensagemCobranca(nome, cob, modalidade = (c) => c.modalidade || '') {
  const primeiro = String(nome || '').trim().split(/\s+/)[0] || ''
  const pend = cob.linhas.flatMap((l) => l.faltam.map((d) => ({ l, d, e: l.estado[d] })))
  const conf = cob.linhas.flatMap((l) => l.conferir.map((d) => ({ l, d })))
  const blocoConf = conf.length
    ? '\nPara confirmar com você (há plano enviado por outra pessoa neste curso e modalidade; ele é o seu plano para este questionário?):\n' + conf.map((it) => `• ${nomeCurso(it.l.curso)} (${modalidade(it.l.curso)}) · ${it.d}`).join('\n') + '\n'
    : ''
  if (!pend.length && conf.length) return `Olá, ${primeiro}! Tudo bem? Conferi no Portal da CPA os planos de ação dos seus cursos. Só preciso de uma confirmação:\n` + blocoConf + `\nObrigado!`
  if (!pend.length) return `Olá, ${primeiro}! Conferi no Portal da CPA e todos os seus planos de ação já foram enviados. Obrigado!`
  const bloco = (e, titulo) => {
    const xs = pend.filter((it) => it.e === e)
    if (!xs.length) return ''
    return `\n${titulo}\n` + xs.map((it) => `• ${nomeCurso(it.l.curso)} (${modalidade(it.l.curso)}) · ${it.d}`).join('\n') + '\n'
  }
  return `Olá, ${primeiro}! Tudo bem? Conferi no Portal da CPA os planos de ação dos seus cursos e ainda há pendências:\n` +
    bloco('falta', 'Ainda sem plano:') +
    bloco('nao_enviado', 'Escritos, mas ainda não enviados para a análise (pode ser plano do auxiliar esperando a sua aprovação e envio):') +
    bloco('devolvido', 'Devolvidos com comentário, faltando ajustar e reenviar:') +
    blocoConf +
    `\nSe você já escreveu algum destes, confira se clicou em enviar: plano escrito e não enviado não chega para a CPA aprovar. Se você enviou algum plano que não aparece no PDF em "O que já recebemos", me responda com o título dele que eu confiro. Segue em anexo o PDF com o detalhamento.`
}
