// Importador da planilha de respostas da CPA (CSV exportado do sistema de pesquisa).
// Tudo é somado AQUI, no navegador de quem importa. CPF, RA e identificação de alunos
// nunca são lidos para fora do arquivo: só as colunas abaixo entram nas somas.
import Papa from 'papaparse'
import { cursoIdDaPlanilha, escalaDaPesquisa } from './cpa.js'

export const COLUNAS_NECESSARIAS = [
  'BQ_CURSO', 'ING_MODALIDADE', 'survey_id', 'pesquisa_nome', 'periodo', 'pergunta_id',
  'pergunta_posicao', 'pergunta', 'pergunta_tipo', 'resposta',
]

function chave(partes) {
  return partes.map((p) => (p == null ? '' : String(p))).join('␟')
}

export function lerPlanilha(arquivo, { idsCursos, onProgresso }) {
  const ids = new Set(idsCursos)
  const grupos = new Map()
  const rel = {
    arquivo: arquivo.name,
    bytes: arquivo.size,
    linhasLidas: 0,
    respostasNota: 0,
    respostasTexto: 0,
    naoUtilizo: 0,
    invalidas: 0,
    exemplosInvalidas: [],
    semCurso: {},
    periodos: {},
    porPesquisa: {},
    colunasFaltando: [],
  }

  return new Promise((resolve, reject) => {
    let cabecalhoConferido = false
    Papa.parse(arquivo, {
      header: true,
      skipEmptyLines: 'greedy',
      // Planilhas salvas pelo Excel/PowerShell começam com um caractere invisível (BOM) grudado na 1ª coluna
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().replace(/^"(.*)"$/, '$1'),
      chunkSize: 1024 * 1024 * 4,
      chunk: (res, parser) => {
        if (!cabecalhoConferido) {
          cabecalhoConferido = true
          const campos = res.meta.fields || []
          rel.colunasFaltando = COLUNAS_NECESSARIAS.filter((c) => !campos.includes(c))
          if (rel.colunasFaltando.length) {
            parser.abort()
            return
          }
        }
        for (const l of res.data) somarLinha(l)
        onProgresso?.({ bytes: res.meta.cursor, total: arquivo.size, linhas: rel.linhasLidas })
      },
      complete: () => resolve({ grupos: [...grupos.values()], relatorio: finalizar() }),
      error: (err) => reject(err),
    })
  })

  function somarLinha(l) {
    rel.linhasLidas++
    const pesquisa = (l.pesquisa_nome || '').trim()
    const pp = (rel.porPesquisa[pesquisa] ||= { linhas: 0, nota: 0, texto: 0, naoUtilizo: 0, invalidas: 0, perguntas: {} })
    pp.linhas++
    rel.periodos[l.periodo || '(sem período)'] = (rel.periodos[l.periodo || '(sem período)'] || 0) + 1

    const tipo = (l.pergunta_tipo || '').trim()
    if (tipo !== 'rating_scale') {
      rel.respostasTexto++
      pp.texto++
      return
    }

    const escala = escalaDaPesquisa(pesquisa)
    const bruto = String(l.resposta ?? '').trim()
    const v = /^\d{1,2}$/.test(bruto) ? Number(bruto) : NaN
    const valido = escala === '0a10' ? v >= 0 && v <= 10 : v >= 1 && v <= 6
    if (!valido) {
      rel.invalidas++
      pp.invalidas++
      if (rel.exemplosInvalidas.length < 10) rel.exemplosInvalidas.push({ pesquisa, resposta: bruto.slice(0, 40) })
      return
    }

    const cursoNome = (l.BQ_CURSO || '').trim()
    const modalidade = (l.ING_MODALIDADE || '').trim().toUpperCase()
    const cursoId = cursoIdDaPlanilha(cursoNome, modalidade, ids)
    if (!cursoId) {
      const k = cursoNome + ' · ' + modalidade
      rel.semCurso[k] = (rel.semCurso[k] || 0) + 1
    }
    const turma = (l.ult_mat_turma || l.turma || '').trim() || null
    const disciplina = (l.disciplina_nome || '').trim() || null
    const professor = (l.professor || '').trim() || null
    const posicao = Number(l.pergunta_posicao) || null
    const pergunta = (l.pergunta || '').replace(/\s+/g, ' ').trim()
    pp.perguntas[posicao] = pergunta

    const k = chave([l.survey_id, l.pergunta_id, posicao, cursoId, cursoNome, modalidade, turma, disciplina, professor])
    let g = grupos.get(k)
    if (!g) {
      g = {
        survey_id: Number(l.survey_id) || null,
        pesquisa,
        escala,
        pergunta_id: Number(l.pergunta_id) || null,
        pergunta_posicao: posicao,
        pergunta,
        curso_id: cursoId,
        curso_nome: cursoNome,
        modalidade,
        turma,
        disciplina,
        professor,
        c0: 0, c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, c6: 0, c7: 0, c8: 0, c9: 0, c10: 0,
        nao_utilizo: 0,
        n: 0,
        soma: 0,
      }
      grupos.set(k, g)
    }
    if (escala === '1a5' && v === 6) {
      g.nao_utilizo++
      rel.naoUtilizo++
      pp.naoUtilizo++
    } else {
      g['c' + v]++
      g.n++
      g.soma += v
      rel.respostasNota++
      pp.nota++
    }
  }

  function finalizar() {
    rel.grupos = grupos.size
    // Conferência: toda linha lida precisa ter ido para algum lugar
    rel.conferencia = Object.entries(rel.porPesquisa).map(([pesquisa, p]) => ({
      pesquisa,
      linhas: p.linhas,
      somadas: p.nota + p.naoUtilizo + p.texto + p.invalidas,
      ...p,
    }))
    rel.bate = rel.conferencia.every((c) => c.linhas === c.somadas) &&
      rel.linhasLidas === rel.respostasNota + rel.naoUtilizo + rel.respostasTexto + rel.invalidas
    return rel
  }
}

// Grava os grupos no banco, substituindo o que existia do mesmo ciclo.
// Depois de gravar, lê de volta os totais para conferir.
export async function gravarImportacao(sb, { ciclo, grupos, relatorio, usuarioId, onProgresso }) {
  const { data: imp, error: e1 } = await sb
    .from('cpa_importacoes')
    .insert({
      ciclo,
      arquivo: relatorio.arquivo,
      importado_por: usuarioId,
      linhas_lidas: relatorio.linhasLidas,
      respostas_nota: relatorio.respostasNota,
      respostas_texto: relatorio.respostasTexto,
      grupos: grupos.length,
      relatorio: resumoRelatorio(relatorio),
      status: 'gravando',
    })
    .select('id')
    .single()
  if (e1) throw e1

  try {
    const LOTE = 500
    for (let i = 0; i < grupos.length; i += LOTE) {
      const lote = grupos.slice(i, i + LOTE).map((g) => ({ ...g, ciclo, importacao_id: imp.id }))
      const { error } = await sb.from('cpa_resultados').insert(lote)
      if (error) throw error
      onProgresso?.({ gravados: Math.min(i + LOTE, grupos.length), total: grupos.length })
    }

    // Conferência do que ficou gravado
    const esperado = grupos.reduce((a, g) => ({ n: a.n + g.n, nu: a.nu + g.nao_utilizo }), { n: 0, nu: 0 })
    const gravado = await totaisGravados(sb, imp.id)
    if (gravado.grupos !== grupos.length || gravado.n !== esperado.n || gravado.nu !== esperado.nu) {
      throw new Error(
        `Conferência falhou: esperado ${grupos.length} grupos / ${esperado.n} notas, gravado ${gravado.grupos} / ${gravado.n}.`,
      )
    }

    // Só agora apaga as importações anteriores do mesmo ciclo
    const { error: e3 } = await sb.from('cpa_importacoes').delete().eq('ciclo', ciclo).neq('id', imp.id)
    if (e3) throw e3
    await sb.from('cpa_importacoes').update({ status: 'concluida' }).eq('id', imp.id)
    return { id: imp.id, gravado }
  } catch (err) {
    // Desfaz esta importação; a anterior (se houver) continua valendo
    await sb.from('cpa_importacoes').delete().eq('id', imp.id)
    throw err
  }
}

async function totaisGravados(sb, importacaoId) {
  let grupos = 0, n = 0, nu = 0, de = 0
  const PAG = 1000
  for (;;) {
    const { data, error } = await sb
      .from('cpa_resultados')
      .select('n, nao_utilizo')
      .eq('importacao_id', importacaoId)
      .order('id')
      .range(de, de + PAG - 1)
    if (error) throw error
    for (const r of data) { grupos++; n += r.n; nu += r.nao_utilizo }
    if (data.length < PAG) break
    de += PAG
  }
  return { grupos, n, nu }
}

function resumoRelatorio(r) {
  return {
    bytes: r.bytes,
    periodos: r.periodos,
    semCurso: r.semCurso,
    invalidas: r.invalidas,
    naoUtilizo: r.naoUtilizo,
    conferencia: r.conferencia.map(({ pesquisa, linhas, nota, texto, naoUtilizo, invalidas }) => ({
      pesquisa, linhas, nota, texto, naoUtilizo, invalidas,
    })),
  }
}
