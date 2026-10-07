// Planilha para o T.I (Excel com abas): o instrumento aprovado, uma linha por pergunta e modalidade
// (como o T.I cadastra), o que saiu ou foi excluído, o que mudou e um resumo.
import {
  ATUAL_POR_ID, EIXO_DA_DIM, ESCALAS, MODALIDADES, MOD_CURTO, STATUS, TIPOS, adaptadaDe, classificarTI, decisaoPr, entra, escalaDoItem,
  escalaMudou, escalaOriginal, modalidadesMudaram, motivoDe, nomeEscala, prefixoDe, prefixoOriginal, prefixosAlterados, rotuloDim,
  rotuloEixo, situacao, textoNaModalidade,
} from './proxima.js'
import { baixarArquivo, montarXlsx } from './xlsx.js'

const mods = (l) => MODALIDADES.filter((m) => l.includes(m)).map((m) => MOD_CURTO[m]).join(', ')

export function alternativas(item, esc) {
  if (item.tipo === 'multipla' || item.tipo === 'outro') return (item.opcoes || '').split('|').map((o) => o.trim()).filter(Boolean).join(' · ')
  const E = ESCALAS[esc]
  if (!E || esc === 'aberta') return 'Texto livre'
  const v = E.valores.map((x) => (E.ancoras[x] ? `${x} (${E.ancoras[x]})` : x)).join(' · ')
  return E.na ? `${v} · Não sei / Não utilizo (fora da média)` : v
}

function origem(it) {
  if (it.adicionada_pr) return 'Escrita pela Pró-Reitoria'
  if (adaptadaDe(it)) return adaptadaDe(it)
  if (it.origem === 'banco') return 'Do banco de perguntas'
  if (it.origem === 'nova') return 'Escrita pela CPA'
  return 'Instrumento atual'
}

export function baixarPlanilhaTI(dados, nomes) {
  const { itens, questionarios, proposta } = dados
  const ordemQ = Object.fromEntries(questionarios.map((x, i) => [x.id, i]))
  const nomeQ = Object.fromEntries(questionarios.map((x) => [x.id, x.nome]))
  const ordenados = [...itens].sort((a, b) => (ordemQ[a.questionario_id] ?? 99) - (ordemQ[b.questionario_id] ?? 99) || (a.tipo === 'aberta') - (b.tipo === 'aberta') || (a.posicao ?? 999) - (b.posicao ?? 999))

  // 1) Instrumento aprovado: uma linha por pergunta e modalidade, na ordem em que o aluno vê
  const aprovadas = []
  for (const q of questionarios) {
    for (const m of MODALIDADES) {
      const lista = ordenados.filter((i) => i.questionario_id === q.id && entra(i) && i.modalidades.includes(m))
      lista.forEach((it, k) => {
        const esc = escalaDoItem(it, m)
        aprovadas.push([
          q.nome, MOD_CURTO[m], k + 1, it.tipo === 'aberta' ? '' : prefixoDe(dados.prefixos, q.id, m), textoNaModalidade(it, m),
          it.tipo === 'multipla' || it.tipo === 'outro' ? TIPOS[it.tipo] : nomeEscala(esc), alternativas(it, esc),
          rotuloEixo(it.eixo || EIXO_DA_DIM[it.dimensao]) || '', rotuloDim(it.dimensao) || '', situacao(it).t, decisaoPr(it),
        ])
      })
    }
  }

  // 2) Saíram ou foram excluídas
  const sairam = ordenados.filter((it) => classificarTI(it) === 'sai').map((it) => [
    nomeQ[it.questionario_id] || 'A definir', mods(it.modalidades), it.texto,
    it.decisao_pr === 'reprovada' ? 'Excluída pela Pró-Reitoria' : 'Retirada pela CPA', it.decisao_pr === 'reprovada' ? '' : motivoDe(it) || '',
  ])

  // 3) O que muda em relação ao instrumento de hoje (perguntas novas, reescritas, modalidades, escala e enunciados)
  const mudancas = []
  for (const it of ordenados) {
    const k = classificarTI(it)
    if (k === 'entra') mudancas.push(['Pergunta nova', nomeQ[it.questionario_id] || 'A definir', mods(it.modalidades), '', it.texto, origem(it), decisaoPr(it)])
    if (k === 'muda') {
      if (it.texto !== it.texto_original) mudancas.push(['Texto reescrito', nomeQ[it.questionario_id], mods(it.modalidades), it.texto_original, it.texto, it.editada_pr ? 'Editada pela Pró-Reitoria' : 'CPA', decisaoPr(it)])
      if (modalidadesMudaram(it)) mudancas.push(['Modalidades', nomeQ[it.questionario_id], mods(it.modalidades), mods(ATUAL_POR_ID[it.atual_id]?.modalidades || []), mods(it.modalidades), it.texto, decisaoPr(it)])
      if (escalaMudou(it)) mudancas.push(['Escala', nomeQ[it.questionario_id], mods(it.modalidades), nomeEscala(escalaOriginal({ ...it, escala: null }, it.modalidades[0])), nomeEscala(it.escala), it.texto, decisaoPr(it)])
    }
  }
  for (const r of prefixosAlterados(dados.prefixos)) {
    mudancas.push(['Enunciado (prefixo)', nomeQ[r.questionario_id] || r.questionario_id, MOD_CURTO[r.modalidade], r.texto_original ?? prefixoOriginal(r.questionario_id, r.modalidade), r.texto, '', ''])
  }

  // 4) Resumo
  const cont = { entra: 0, sai: 0, muda: 0, mantem: 0 }
  for (const it of itens) cont[classificarTI(it)]++
  const resumo = [
    ['Situação da proposta', STATUS[proposta.status]?.t || proposta.status],
    ['Aprovada por', proposta.decidido_em && ['aprovada', 'enviada_ti'].includes(proposta.status) ? `${nomes[proposta.decidido_por] || '—'} em ${new Date(proposta.decidido_em).toLocaleDateString('pt-BR')}` : 'ainda não aprovada'],
    ['Perguntas no instrumento (por pergunta)', itens.filter(entra).length],
    ['Linhas na aba "Instrumento aprovado" (pergunta × modalidade)', aprovadas.length],
    ['Entram (novas)', cont.entra],
    ['Saem (retiradas ou excluídas)', cont.sai],
    ['Mudam (texto, modalidade ou escala)', cont.muda],
    ['Mantidas como hoje', cont.mantem],
    ['Enunciados alterados', prefixosAlterados(dados.prefixos).length],
    ['Gerado em', new Date().toLocaleString('pt-BR')],
  ]

  const blob = montarXlsx([
    { nome: 'Instrumento aprovado', cabecalho: ['Questionário', 'Modalidade', 'Ordem', 'Enunciado (antes da pergunta)', 'Pergunta (texto literal)', 'Critério avaliativo (escala)', 'Alternativas', 'Eixo', 'Dimensão', 'Situação', 'Pró-Reitoria'], linhas: aprovadas, larguras: [24, 14, 8, 40, 60, 26, 50, 32, 34, 14, 30] },
    { nome: 'Saíram ou excluídas', cabecalho: ['Questionário', 'Modalidades', 'Pergunta', 'Quem tirou', 'Motivo'], linhas: sairam, larguras: [26, 22, 60, 26, 50] },
    { nome: 'Mudanças', cabecalho: ['Tipo de mudança', 'Questionário', 'Modalidades', 'Antes (hoje)', 'Depois', 'Origem / pergunta', 'Pró-Reitoria'], linhas: mudancas, larguras: [20, 26, 22, 45, 45, 40, 30] },
    { nome: 'Resumo', cabecalho: ['Item', 'Valor'], linhas: resumo, larguras: [52, 40] },
  ])
  baixarArquivo(blob, `proxima-cpa-para-o-ti-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
