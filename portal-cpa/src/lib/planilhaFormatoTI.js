// Planilha "no formato do T.I": as mesmas colunas que o T.I exporta da pesquisa (um ID por pergunta
// e modalidade), sem as respostas, com colunas novas ao lado dizendo o que acontece com cada pergunta
// na próxima CPA (mantida, reescrita, nova ou excluída), o texto final, a posição, a escala, o eixo e a dimensão.
import { sb } from './dados.js'
import {
  ATUAL_POR_ID, EIXO_DA_DIM, MOD_CURTO, TIPOS, classificarTI, entra, escalaDoItem, escalaMudou, escalaOriginal, motivoSaida,
  nomeEscala, prefixoDe, rotuloDim, rotuloEixo, textoNaModalidade,
} from './proxima.js'
import { alternativas } from './planilhaTI.js'
import { baixarArquivo, montarXlsx } from './xlsx.js'

// Ordem das modalidades como o T.I lista
const ORDEM_MOD = ['PRESENCIAL', 'SEMIPRESENCIAL', 'EAD']

export const STATUS_TI = {
  MANTIDA: { cor: null, d: 'A pergunta continua igual. Usar o mesmo pergunta_id.' },
  REESCRITA: { cor: 'azul', d: 'A pergunta continua, com outro texto. A coluna "pergunta" mostra como era e PERGUNTA_2026.2 como fica.' },
  NOVA: { cor: 'verde', d: 'Pergunta que não existe hoje nesta modalidade. Sem pergunta_id: o T.I cria um novo.' },
  EXCLUIDA: { cor: 'laranja', d: 'A pergunta sai do questionário (ou só desta modalidade). Não cadastrar na 2026.2.' },
}

export const CABECALHO_TI = [
  'survey_id', 'pesquisa_nome', 'ING_MODALIDADE', 'pergunta_id', 'pergunta_posicao', 'pergunta', 'pergunta_tipo',
  'STATUS_2026.2', 'PERGUNTA_2026.2', 'POSICAO_2026.2', 'ENUNCIADO_2026.2', 'ESCALA_2026.2', 'ALTERNATIVAS_2026.2', 'EIXO', 'DIMENSAO', 'OBSERVACAO',
]

export async function carregarCatalogoTI() {
  const { data, error } = await sb.rpc('cpa_perguntas_ti')
  if (error) throw error
  return data || []
}

function tipoTI(it, esc) {
  if (it.tipo === 'multipla' || it.tipo === 'outro') return TIPOS[it.tipo]
  if (esc === 'aberta' || it.tipo === 'aberta') return 'texto (aberta)'
  return 'rating_scale'
}

// Monta as linhas (uma por pergunta e modalidade). Separado do download para dar para testar.
export function linhasFormatoTI(dados, catalogo) {
  const { itens, questionarios, prefixos } = dados
  const ordemQ = Object.fromEntries(questionarios.map((x, i) => [x.id, i]))
  const qPorId = Object.fromEntries(questionarios.map((x) => [x.id, x]))
  const pesquisaDoSurvey = {}
  for (const c of catalogo) pesquisaDoSurvey[c.survey_id] ||= c.pesquisa
  const doCatalogo = (survey, pos) => catalogo.filter((c) => c.survey_id === survey && c.pergunta_posicao === pos)

  // Posição de cada pergunta no instrumento aprovado, por questionário e modalidade (a ordem em que o aluno vê)
  const ordenados = [...itens].sort((a, b) => (ordemQ[a.questionario_id] ?? 99) - (ordemQ[b.questionario_id] ?? 99) || (a.tipo === 'aberta') - (b.tipo === 'aberta') || (a.posicao ?? 999) - (b.posicao ?? 999))
  const novaPos = new Map()
  for (const q of questionarios) {
    for (const m of ORDEM_MOD) {
      ordenados.filter((i) => i.questionario_id === q.id && entra(i) && i.modalidades.includes(m)).forEach((it, k) => novaPos.set(it.id + '|' + m, k + 1))
    }
  }

  const linhas = []
  const final = (it, m) => {
    const esc = escalaDoItem(it, m)
    return {
      texto: textoNaModalidade(it, m),
      pos: novaPos.get(it.id + '|' + m) ?? '',
      enunciado: it.tipo === 'aberta' ? '' : prefixoDe(prefixos, it.questionario_id, m),
      escala: it.tipo === 'multipla' || it.tipo === 'outro' ? TIPOS[it.tipo] : nomeEscala(esc),
      alternativas: alternativas(it, esc),
      esc,
    }
  }
  const eixo = (it) => rotuloEixo(it.eixo || EIXO_DA_DIM[it.dimensao]) || ''
  const dim = (it) => rotuloDim(it.dimensao) || ''

  for (const it of ordenados) {
    const q = qPorId[it.questionario_id]
    const k = classificarTI(it)

    if (it.origem === 'atual' && it.atual_id) {
      const [survey, pos] = it.atual_id.split(':').map(Number)
      const a = ATUAL_POR_ID[it.atual_id]
      // Linhas que o T.I tem hoje para esta pergunta (uma por modalidade, cada uma com o seu ID)
      let hoje = doCatalogo(survey, pos).map((c) => ({ m: c.modalidade, id: c.pergunta_id, texto: c.pergunta, pesquisa: c.pesquisa }))
      const semId = !hoje.length
      if (semId) hoje = (a?.modalidades || it.modalidades).map((m) => ({ m, id: '', texto: textoNaModalidade({ ...it, texto: it.texto_original }, m), pesquisa: pesquisaDoSurvey[survey] || q?.nome || '' }))
      const modsHoje = new Set(hoje.map((h) => h.m))

      for (const h of hoje) {
        const base = [survey, h.pesquisa, h.m, h.id, pos, h.texto, tipoTI(it, escalaOriginal(it, h.m))]
        if (k === 'sai') {
          linhas.push({ status: 'EXCLUIDA', l: [...base, 'EXCLUIDA', '', '', '', '', '', eixo(it), dim(it), motivoSaida(it)] })
          continue
        }
        if (!it.modalidades.includes(h.m)) {
          const fica = ORDEM_MOD.filter((m) => it.modalidades.includes(m)).map((m) => MOD_CURTO[m]).join(', ')
          linhas.push({ status: 'EXCLUIDA', l: [...base, 'EXCLUIDA', '', '', '', '', '', eixo(it), dim(it), `Sai só desta modalidade (continua em: ${fica})`] })
          continue
        }
        const f = final(it, h.m)
        const reescrita = it.texto !== it.texto_original
        const obs = semId ? ['Pergunta aberta: o ID não vem na nossa extração (usar o mesmo ID de hoje)'] : []
        if (reescrita) obs.push(it.editada_pr ? 'Texto reescrito (ajustado pela Pró-Reitoria)' : 'Texto reescrito pela CPA')
        if (escalaMudou(it) && escalaOriginal(it, h.m) !== f.esc) obs.push(`Escala muda: ${nomeEscala(escalaOriginal(it, h.m))} → ${nomeEscala(f.esc)}`)
        if (f.pos !== '' && f.pos !== pos) obs.push(`Posição muda: ${pos} → ${f.pos}`)
        const st = reescrita ? 'REESCRITA' : 'MANTIDA'
        linhas.push({ status: st, l: [...base, st, f.texto, f.pos, f.enunciado, f.escala, f.alternativas, eixo(it), dim(it), obs.join(' · ')] })
      }
      // Modalidades em que a pergunta passa a aparecer e que hoje não tem
      if (k !== 'sai') {
        for (const m of ORDEM_MOD.filter((x) => it.modalidades.includes(x) && !modsHoje.has(x))) {
          const f = final(it, m)
          const ids = hoje.filter((h) => h.id !== '').map((h) => `${MOD_CURTO[h.m]} ${h.id}`).join(', ')
          linhas.push({ status: 'NOVA', l: [survey, pesquisaDoSurvey[survey] || q?.nome || '', m, '', '', '', tipoTI(it, f.esc), 'NOVA', f.texto, f.pos, f.enunciado, f.escala, f.alternativas, eixo(it), dim(it), `A pergunta já existe em outra modalidade${ids ? ` (ID ${ids})` : ''}; passa a valer também nesta`] })
        }
      }
      continue
    }

    // Pergunta nova (do banco, escrita pela CPA ou pela Pró-Reitoria). Se não entrou, o T.I não precisa dela.
    if (k !== 'entra') continue
    const survey = q?.survey_id ?? ''
    for (const m of ORDEM_MOD.filter((x) => it.modalidades.includes(x))) {
      const f = final(it, m)
      const quem = it.adicionada_pr ? 'Incluída pela Pró-Reitoria' : it.origem === 'banco' ? 'Do banco de perguntas da CPA' : 'Escrita pela CPA'
      linhas.push({ status: 'NOVA', l: [survey, pesquisaDoSurvey[survey] || q?.nome || '', m, '', '', '', tipoTI(it, f.esc), 'NOVA', f.texto, f.pos, f.enunciado, f.escala, f.alternativas, eixo(it), dim(it), quem + (survey === '' ? ' · questionário novo (sem survey_id)' : '')] })
    }
  }

  // Na ordem do T.I: questionário, modalidade, posição nova (as excluídas no fim de cada bloco, pela posição de hoje)
  const peso = (r) => [
    ordemQ[questionarios.find((x) => x.survey_id === r.l[0])?.id] ?? 99,
    ORDEM_MOD.indexOf(r.l[2]),
    r.status === 'EXCLUIDA' ? 1 : 0,
    r.status === 'EXCLUIDA' ? Number(r.l[4]) || 0 : Number(r.l[9]) || 0,
  ]
  linhas.sort((a, b) => {
    const x = peso(a)
    const y = peso(b)
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]
    return 0
  })
  return linhas
}

export async function baixarPlanilhaFormatoTI(dados) {
  const catalogo = await carregarCatalogoTI()
  const linhas = linhasFormatoTI(dados, catalogo)
  const cont = { MANTIDA: 0, REESCRITA: 0, NOVA: 0, EXCLUIDA: 0 }
  for (const r of linhas) cont[r.status]++
  const ciclo = catalogo[0]?.ciclo || 'atual'

  const legenda = [
    ...Object.entries(STATUS_TI).map(([k, v]) => [k, v.d]),
    ['', ''],
    ['Colunas de survey_id até pergunta_tipo', `Iguais à extração do T.I (ciclo ${ciclo}), sem as respostas e sem dados de alunos. Nas perguntas novas ficam em branco o pergunta_id, a posição e o texto de hoje.`],
    ['PERGUNTA_2026.2', 'Texto final da pergunta para cadastrar (vazio quando a pergunta sai).'],
    ['POSICAO_2026.2', 'Ordem da pergunta no questionário daquela modalidade na 2026.2.'],
    ['ENUNCIADO_2026.2', 'Frase que aparece antes da pergunta (ex.: "Qual o seu grau de satisfação com:").'],
    ['ESCALA_2026.2 / ALTERNATIVAS_2026.2', 'Critério de resposta e as alternativas que o aluno vê.'],
    ['EIXO / DIMENSAO', 'Eixo e dimensão do SINAES (Lei 10.861/2004) a que a pergunta responde.'],
    ['OBSERVACAO', 'Motivo da exclusão, quem reescreveu, mudança de escala ou de posição.'],
  ]
  const resumo = [
    ['Linhas (pergunta × modalidade)', linhas.length],
    ['Mantidas', cont.MANTIDA],
    ['Reescritas', cont.REESCRITA],
    ['Novas', cont.NOVA],
    ['Excluídas', cont.EXCLUIDA],
    ['Base de IDs do T.I', `ciclo ${ciclo}`],
    ['Gerado em', new Date().toLocaleString('pt-BR')],
  ]
  const blob = montarXlsx([
    {
      nome: 'Perguntas 2026.2', cabecalho: CABECALHO_TI, linhas: linhas.map((r) => r.l),
      cores: linhas.map((r) => STATUS_TI[r.status].cor),
      larguras: [10, 30, 16, 11, 10, 50, 14, 14, 55, 10, 36, 24, 44, 30, 30, 44],
    },
    { nome: 'Legenda', cabecalho: ['Item', 'O que significa'], linhas: legenda, larguras: [34, 100] },
    { nome: 'Resumo', cabecalho: ['Item', 'Valor'], linhas: resumo, larguras: [34, 30] },
  ])
  baixarArquivo(blob, `perguntas-cpa-2026-2-formato-ti-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
