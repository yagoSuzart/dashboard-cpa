// PDF do instrumento da próxima CPA, para mandar a quem não participa da montagem (WhatsApp, e-mail):
// só as perguntas que entram, com o texto que o aluno vê, como é avaliada (escala) e o eixo e a dimensão.
// Sem as perguntas que saem e sem marcas de "reescrita". Layout corrido, com a logo, para caber em poucas páginas;
// modalidades com as mesmas perguntas dividem uma tabela só.
import {
  MODALIDADES, MOD_CURTO, EIXOS, EIXO_DA_DIM, STATUS, entra, textoNaModalidade, escalaDoItem, nomeEscala, prefixoDe, rotuloDim, TIPOS,
} from './proxima.js'

const NAVY = [18, 57, 94]
const AZUL = [28, 109, 179]
const VERDE = [47, 174, 96]
const CINZA = [95, 102, 115]
const LINHA = [222, 226, 234]
const ZEBRA = [246, 248, 251]
const M = 14 // margem
const L = 210 - 2 * M // largura útil
const RODAPE = 284

async function carregarLogo() {
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('Não foi possível carregar a logo.'))
    i.src = '/logo-unifecaf.png'
  })
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  c.getContext('2d').drawImage(img, 0, 0)
  return { dataUrl: c.toDataURL('image/png'), proporcao: img.naturalHeight / img.naturalWidth }
}

const limpar = (t) => String(t ?? '').replace(/[→⟶]/g, '-').replace(/[^\S\n]+/g, ' ').trim()
const comoAvalia = (it, m) => {
  if (it.tipo === 'multipla' || it.tipo === 'outro') return TIPOS[it.tipo] + (it.opcoes ? ': ' + it.opcoes.split('|').map((o) => o.trim()).join(' / ') : '')
  const e = escalaDoItem(it, m)
  if (e === 'likert_5') return 'Nota de 1 a 5'
  if (e === 'likert_5_na') return 'Nota de 1 a 5 + Não sei / Não utilizo'
  if (e === 'nps_0_10') return 'Nota de 0 a 10'
  if (e === 'aberta') return 'Resposta aberta'
  return nomeEscala(e)
}
const eixoDim = (it) => {
  if (!it.dimensao) return '-'
  const e = it.eixo || EIXO_DA_DIM[it.dimensao]
  const eixo = EIXOS.find((x) => x.n === e)
  return `Eixo ${e}${eixo ? ' · ' + eixo.nome : ''} | ${rotuloDim(it.dimensao)}`
}

// Entra no PDF: a pergunta entra no instrumento e, se o questionário é novo, já foi aprovada pela Pró-Reitoria
// (mesma regra da página aberta de perguntas)
const fica = (dados, i) => {
  if (!i.questionario_id || !entra(i)) return false
  const q = dados.questionarios.find((x) => x.id === i.questionario_id)
  return q?.origem !== 'novo' || i.decisao_pr === 'aprovada'
}

// Agrupa as modalidades com o mesmo enunciado e as mesmas perguntas (texto, escala, eixo e dimensão)
function gruposDoQuestionario(dados, q) {
  const ficam = dados.itens.filter((i) => i.questionario_id === q.id && fica(dados, i)).sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999))
  const grupos = []
  for (const m of MODALIDADES) {
    const lista = ficam.filter((i) => i.modalidades.includes(m))
    if (!lista.length) continue
    const linhas = lista.map((it) => ({ texto: limpar(textoNaModalidade(it, m)), como: limpar(comoAvalia(it, m)), eixo: eixoDim(it) }))
    const pref = limpar(prefixoDe(dados.prefixos, q.id, m))
    const assinatura = JSON.stringify([pref, linhas])
    const g = grupos.find((x) => x.assinatura === assinatura)
    if (g) g.mods.push(m)
    else grupos.push({ assinatura, mods: [m], pref, linhas })
  }
  return grupos
}

export async function baixarPdfInstrumento(dados) {
  const [{ jsPDF }, logo] = await Promise.all([import('jspdf'), carregarLogo()])
  const doc = new jsPDF({ compress: true })
  let y = 0

  // Cabeçalho da primeira página
  doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 6, 'F')
  const lw = 40, lh = lw * logo.proporcao
  doc.addImage(logo.dataUrl, 'PNG', M, 12, lw, lh)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...NAVY)
  doc.text('Instrumento da próxima CPA', M + lw + 8, 19)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...CINZA)
  doc.text('Comissão Própria de Avaliação · questionários dos alunos', M + lw + 8, 25)
  const st = STATUS[dados.proposta?.status]?.t
  doc.text(`${st ? st + ' · ' : ''}gerado em ${new Date().toLocaleDateString('pt-BR')}`, M + lw + 8, 30)
  y = Math.max(12 + lh, 32) + 6

  // Resumo: quantas perguntas e como são avaliadas
  const entram = dados.itens.filter((i) => fica(dados, i))
  const qs = dados.questionarios.filter((q) => entram.some((i) => i.questionario_id === q.id))
  doc.setFillColor(...ZEBRA); doc.setDrawColor(...LINHA); doc.roundedRect(M, y, L, 24, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...NAVY)
  doc.text(`${qs.length} questionários · ${entram.length} perguntas`, M + 4, y + 6)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...CINZA)
  const esc = [
    'Como é avaliado: Nota de 1 a 5 = 1 Muito insatisfeito, 2 Insatisfeito, 3 Neutro, 4 Satisfeito, 5 Muito satisfeito. Algumas perguntas têm também "Não sei / Não utilizo" (fica fora da média).',
    'Nota de 0 a 10 = recomendação/satisfação. Resposta aberta = o aluno escreve um comentário.',
    'Eixos e dimensões do SINAES: ' + EIXOS.map((e) => `Eixo ${e.n} ${e.nome}`).join('; ') + '.',
  ]
  doc.text(doc.splitTextToSize(esc.join(' '), L - 8), M + 4, y + 11)
  y += 30

  const novaPagina = () => {
    doc.addPage()
    doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 4, 'F')
    y = 12
  }
  const cabe = (h) => { if (y + h > RODAPE - 4) novaPagina() }

  // Tabela: Nº | Pergunta | Como é avaliado | Eixo e dimensão
  const COL = [{ w: 8 }, { w: 96 }, { w: 27 }, { w: L - 8 - 96 - 27 }]
  const X = COL.reduce((a, c, i) => [...a, i ? a[i - 1] + COL[i - 1].w : M], [])
  const cabecalhoTabela = () => {
    doc.setFillColor(...NAVY); doc.rect(M, y, L, 6.5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255)
    ;['Nº', 'Pergunta (texto que o aluno vê)', 'Como é avaliado', 'Eixo e dimensão'].forEach((t, i) => doc.text(t, X[i] + 2, y + 4.4))
    y += 6.5
  }

  for (const q of qs) {
    const grupos = gruposDoQuestionario(dados, q)
    if (!grupos.length) continue
    cabe(30)
    // Título do questionário
    doc.setFillColor(...AZUL); doc.rect(M, y, 1.6, 7, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...NAVY)
    doc.text(limpar(q.nome), M + 4, y + 5.2)
    y += 9
    if (q.publico) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...CINZA)
      const l = doc.splitTextToSize('Quem responde: ' + limpar(q.publico), L)
      doc.text(l, M, y + 2); y += l.length * 3.6 + 1.5
    }

    for (const g of grupos) {
      cabe(22)
      // Modalidades e enunciado
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...VERDE)
      const mods = g.mods.length === MODALIDADES.length ? 'Presencial, Semipresencial e EAD' : g.mods.map((m) => (m === 'SEMIPRESENCIAL' ? 'Semipresencial' : MOD_CURTO[m])).join(' e ')
      doc.text(mods.toUpperCase(), M, y + 3)
      y += 4.5
      if (g.pref) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...CINZA)
        const l = doc.splitTextToSize(`Enunciado: "${g.pref}"`, L)
        doc.text(l, M, y + 2.8); y += l.length * 3.5 + 1
      }
      y += 1
      cabecalhoTabela()
      g.linhas.forEach((ln, i) => {
        doc.setFontSize(8)
        const cel = [String(i + 1), ln.texto, ln.como, ln.eixo].map((t, c) => doc.splitTextToSize(t, COL[c].w - 4))
        const h = Math.max(...cel.map((c) => c.length)) * 3.2 + 2.6
        if (y + h > RODAPE - 4) { novaPagina(); cabecalhoTabela() }
        if (i % 2) { doc.setFillColor(...ZEBRA); doc.rect(M, y, L, h, 'F') }
        cel.forEach((linhas, c) => {
          doc.setFont('helvetica', c === 1 ? 'normal' : c === 0 ? 'bold' : 'normal')
          doc.setFontSize(c >= 2 ? 7.3 : 8)
          doc.setTextColor(...(c === 1 ? [30, 35, 45] : c === 0 ? NAVY : CINZA))
          doc.text(linhas, X[c] + 2, y + 3.6, { lineHeightFactor: 1.12 })
        })
        doc.setDrawColor(...LINHA); doc.line(M, y + h, M + L, y + h)
        y += h
      })
      y += 5
    }
    y += 2
  }

  // Rodapé com numeração
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setDrawColor(...LINHA); doc.line(M, RODAPE + 2, M + L, RODAPE + 2)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...CINZA)
    doc.text('UniFECAF · CPA · Instrumento da próxima avaliação', M, RODAPE + 6.5)
    doc.text(`Página ${p} de ${total}`, M + L, RODAPE + 6.5, { align: 'right' })
  }
  doc.save('CPA_instrumento_proxima_avaliacao.pdf')
  return total
}

