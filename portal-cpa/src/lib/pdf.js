// Relatórios em PDF — mesmo conteúdo e layout do sistema anterior (jsPDF).
// A biblioteca é carregada só na hora de gerar (import dinâmico), para não pesar a abertura do Portal.
//
// Todas as funções exportadas são assíncronas e:
//   - salvam o arquivo no navegador (doc.save) e devolvem a mensagem de sucesso (string);
//   - lançam Error com a mesma mensagem de aviso do sistema anterior quando não há o que gerar.
//
// Assinaturas:
//   baixarPdfCurso({ base, cursoId, respondentes? })        → PDF de um curso            (CPA_<curso>.pdf)
//   baixarPdfGeral({ base, escopo, respondentes? })         → um curso por página         (CPA_relatorio_geral.pdf)
//   baixarPdfSetor({ base, setorId, comentarios? })         → PDF de um setor             (CPA_setor_<id>.pdf)
//   baixarPdfPlanos({ base, escopo, perfil })               → planos de todos os autores  (CPA_planos_de_acao_geral.pdf)
//   baixarPdfMeuPlano({ base, perfil })                     → planos de quem está logado  (CPA_meu_plano_<nome>.pdf)
//
//   base: o objeto `base` do App (cursos, notas, setores, setorPerguntas, usuarios...).
//   escopo: ids dos cursos visíveis para a pessoa (prop `escopo` do App).
//   respondentes (opcional): { [curso_id]: número de alunos que responderam } — não existe no banco hoje;
//     quando não vem, a linha "N aluno(s) responderam" simplesmente não aparece (como no antigo sem o dado).
//   comentarios (opcional): textos de comentários do setor. O banco não tem tabela de comentários por setor;
//     sem eles, o PDF mostra "Nenhum comentário específico registrado para este setor.", como no antigo.
import { sb, buscarComentarios } from './dados.js'
import { DIMENSOES, SATISFACAO, MODALIDADE_LABEL, ROLE_LABELS } from './config.js'

const PDF_NAVY = [18, 57, 94]
const PDF_BLUE = [28, 109, 179]
const PDF_GREEN = [47, 174, 96]
const PDF_AMBER = [196, 130, 25]
const PDF_INK = [18, 57, 94]
const PDF_GRAY_TEXT = [90, 90, 100]
const PDF_GRAY_TRACK = [230, 233, 240]
const PDF_CARD_BG = [247, 248, 251]

const AUTOR_ROLES = ['coordenador', 'professor_auxiliar', 'diretor_nucleo']

// Rótulos de cargo usados no sistema anterior (PDF de planos)
const ROLE_LABELS_PDF = {
  ...ROLE_LABELS,
  coordenador: 'Coordenador de Curso',
  professor_auxiliar: 'Professor(a) Auxiliar - Coordenador Adjunto',
  pro_reitoria: 'Pró-reitoria Acadêmica',
  diretor_cpa: 'Coordenadora da CPA',
  comissao_cpa: 'Comissão CPA (membro)',
}

// ---------- recursos ----------
async function carregarJsPDF() {
  const m = await import('jspdf')
  return m.jsPDF || m.default
}

let logoCache = null
async function carregarLogo() {
  if (logoCache) return logoCache
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
  logoCache = { dataUrl: c.toDataURL('image/png'), proporcao: img.naturalHeight / img.naturalWidth }
  return logoCache
}

async function novoDocumento() {
  const [JsPDF, logo] = await Promise.all([carregarJsPDF(), carregarLogo()])
  const doc = new JsPDF()
  doc.__logo = logo
  return doc
}

function hoje() {
  return new Date().toLocaleDateString('pt-BR')
}

function fmt(v) {
  return typeof v === 'number' && !Number.isNaN(v) ? v.toFixed(2) : '—'
}

function cursoLabel(base, cid) {
  const c = base.cursos.find((x) => x.id === cid)
  if (!c) return cid || ''
  return `${c.nome} - ${MODALIDADE_LABEL[c.modalidade] || c.modalidade}`
}

function alvoLabel(base, it) {
  if (it.tipo === 'setor') {
    const s = base.setores.find((x) => x.id === it.setor_id)
    return s ? s.nome + ' (Setor)' : it.setor_id
  }
  return cursoLabel(base, it.curso_id)
}

function statusTexto(status) {
  if (status === 'rascunho') return 'Rascunho — ainda não enviado'
  if (status === 'concluido') return 'Concluído'
  if (status === 'aprovado') return 'Aprovado'
  if (status === 'aguardando_coordenador') return 'Aguardando revisão do coordenador do curso'
  if (status === 'aguardando_pro_reitoria') return 'Validado pela CPA, aguardando Pró-reitoria'
  if (status === 'devolvido') return 'Devolvido para revisão'
  return 'Aguardando análise'
}

// ---------- blocos de desenho ----------
function pdfCabecalho(doc, titulo, subtitulo) {
  const margem = 15, larguraUtil = 180
  doc.setFillColor(...PDF_NAVY); doc.rect(0, 0, 210, 8, 'F')
  const logoLargura = 38, logoAltura = logoLargura * doc.__logo.proporcao
  doc.addImage(doc.__logo.dataUrl, 'PNG', margem, 15, logoLargura, logoAltura)
  const xTexto = margem + logoLargura + 8
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...PDF_INK)
  const linhasTitulo = doc.splitTextToSize(titulo, larguraUtil - logoLargura - 8)
  doc.text(linhasTitulo, xTexto, 22)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...PDF_GRAY_TEXT)
  doc.text(subtitulo, xTexto, 22 + linhasTitulo.length * 5.5)
  return Math.max(15 + logoAltura + 12, 22 + linhasTitulo.length * 5.5 + 10)
}

// Faixa navy de rodapé (com numeração) em todas as páginas. Chamar por último.
function pdfRodapeTodasPaginas(doc) {
  const margem = 15, larguraUtil = 180
  const totalPaginas = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p)
    doc.setFillColor(...PDF_NAVY); doc.rect(0, 291, 210, 6, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(255, 255, 255)
    doc.text('UniFECAF · Comissão Própria de Avaliação', margem, 295)
    doc.text('Página ' + p + ' de ' + totalPaginas, margem + larguraUtil, 295, { align: 'right' })
  }
}

// Linha "categoria ———barra——— valor"
function pdfBarraCategoria(doc, x, y, larguraBarra, label, valor, maxValor) {
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(60, 60, 70)
  const linhasLabel = doc.splitTextToSize(String(label), 58)
  doc.text(linhasLabel, x, y + 3.2)
  const barX = x + 62
  doc.setFillColor(...PDF_GRAY_TRACK); doc.roundedRect(barX, y, larguraBarra, 5, 2, 2, 'F')
  const v = typeof valor === 'number' && !Number.isNaN(valor) ? valor : 0
  const pct = Math.max(0, Math.min(1, v / maxValor))
  if (pct > 0) { doc.setFillColor(...PDF_BLUE); doc.roundedRect(barX, y, larguraBarra * pct, 5, 2, 2, 'F') }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...PDF_INK)
  doc.text(fmt(valor), barX + larguraBarra + 4, y + 4)
  return linhasLabel.length
}

// Caixa de destaque (ponto forte / oportunidade)
function pdfCaixaDestaque(doc, x, y, largura, altura, cor, corFundo, rotulo, texto) {
  doc.setFillColor(...corFundo)
  doc.roundedRect(x, y, largura, altura, 3, 3, 'F')
  doc.setFillColor(...cor)
  doc.circle(x + 8, y + 10, 3, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...cor)
  doc.text(rotulo, x + 14, y + 7)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...PDF_INK)
  doc.text(doc.splitTextToSize(texto, largura - 18), x + 14, y + 13)
}

// Comentários como cards com borda azul à esquerda; devolve o novo y
function pdfComentariosEmCards(doc, margem, larguraUtil, y, comentarios) {
  comentarios.forEach((texto) => {
    const linhas = doc.splitTextToSize(String(texto).replace(/\\n/g, '\n'), larguraUtil - 14)
    const alturaCard = linhas.length * 5 + 8
    if (y + alturaCard > 285) { doc.addPage(); y = 20 }
    doc.setFillColor(...PDF_CARD_BG)
    doc.roundedRect(margem, y, larguraUtil, alturaCard, 2, 2, 'F')
    doc.setFillColor(...PDF_BLUE)
    doc.rect(margem, y, 1.5, alturaCard, 'F')
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5); doc.setTextColor(70, 70, 85)
    doc.text(linhas, margem + 8, y + 6)
    y += alturaCard + 5
  })
  return y
}

// ---------- curso ----------
function escreverCursoNoPDF(doc, base, cid, comentarios, respondentes) {
  const cats = base.notas[cid] || {}
  const margem = 15, larguraUtil = 180

  let y = pdfCabecalho(
    doc,
    cursoLabel(base, cid),
    'Relatório CPA — UniFECAF' + (respondentes ? ' · ' + respondentes + ' aluno(s) responderam' : '') + ' · Gerado em ' + hoje(),
  )

  doc.setFillColor(233, 241, 252)
  doc.roundedRect(margem, y, larguraUtil, 22, 3, 3, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...PDF_BLUE)
  doc.text(fmt(cats[SATISFACAO]), margem + 8, y + 15)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...PDF_GRAY_TEXT)
  doc.text('/ 10 — Satisfação geral dos alunos', margem + 30, y + 15)
  y += 34

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...PDF_INK)
  doc.text('Detalhamento por categoria', margem, y); y += 8

  const barW = larguraUtil - 62 - 18
  DIMENSOES.forEach((cat) => {
    const n = pdfBarraCategoria(doc, margem, y, barW, cat, cats[cat], 5)
    y += 9.5 + (n - 1) * 4
  })
  y += 6

  const comNota = DIMENSOES.filter((c) => typeof cats[c] === 'number')
  if (comNota.length) {
    const ordenadas = comNota.slice().sort((a, b) => cats[b] - cats[a])
    const forte = ordenadas[0], oport = ordenadas[ordenadas.length - 1]
    const boxW = (larguraUtil - 6) / 2, boxH = 20
    pdfCaixaDestaque(doc, margem, y, boxW, boxH, PDF_GREEN, [226, 246, 235], 'PONTO FORTE', forte + ' (' + fmt(cats[forte]) + ')')
    pdfCaixaDestaque(doc, margem + boxW + 6, y, boxW, boxH, PDF_AMBER, [252, 240, 222], 'OPORTUNIDADE', oport + ' (' + fmt(cats[oport]) + ')')
    y += boxH + 12
  }

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...PDF_INK)
  doc.text('Comentários de alunos (amostra)', margem, y); y += 8

  if (!comentarios.length) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...PDF_GRAY_TEXT)
    doc.text('Nenhum comentário registrado para este curso.', margem, y); y += 6
  } else {
    y = pdfComentariosEmCards(doc, margem, larguraUtil, y, comentarios)
  }
  return y
}

// Amostra: os 5 primeiros comentários do curso (como no antigo)
async function amostraComentarios(cid) {
  const { itens } = await buscarComentarios({ cursos: [cid], pagina: 0, porPagina: 5 })
  return itens.map((c) => c.texto)
}

export async function baixarPdfCurso({ base, cursoId, respondentes } = {}) {
  if (!cursoId || !base.cursos.some((c) => c.id === cursoId))
    throw new Error('Selecione um curso específico (não "todos os cursos") antes de baixar o PDF.')
  const [doc, coments] = await Promise.all([novoDocumento(), amostraComentarios(cursoId)])
  escreverCursoNoPDF(doc, base, cursoId, coments, (respondentes || base.respondentes)?.[cursoId])
  pdfRodapeTodasPaginas(doc)
  doc.save('CPA_' + cursoId + '.pdf')
  return 'PDF gerado com sucesso!'
}

export async function baixarPdfGeral({ base, escopo, respondentes } = {}) {
  const ids = (escopo || []).filter((id) => base.cursos.some((c) => c.id === id))
  if (!ids.length) throw new Error('Nenhum curso disponível neste recorte para gerar o PDF.')
  const doc = await novoDocumento()
  const coments = await Promise.all(ids.map((id) => amostraComentarios(id)))
  ids.forEach((cid, idx) => {
    if (idx > 0) doc.addPage()
    escreverCursoNoPDF(doc, base, cid, coments[idx], (respondentes || base.respondentes)?.[cid])
  })
  pdfRodapeTodasPaginas(doc)
  doc.save('CPA_relatorio_geral.pdf')
  return 'PDF geral gerado com ' + ids.length + ' curso(s)!'
}

// ---------- setor ----------
function escreverSetorNoPDF(doc, base, setorId, comentarios) {
  const s = base.setores.find((x) => x.id === setorId)
  const perguntas = base.setorPerguntas.filter((p) => p.setor_id === setorId)
  const margem = 15, larguraUtil = 180

  let y = pdfCabecalho(doc, s.nome, 'Relatório CPA — UniFECAF · Setor de Infraestrutura · Gerado em ' + hoje())

  doc.setFillColor(233, 241, 252)
  doc.roundedRect(margem, y, larguraUtil, 22, 3, 3, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...PDF_BLUE)
  doc.text(fmt(s.nota == null ? null : Number(s.nota)), margem + 8, y + 15)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...PDF_GRAY_TEXT)
  doc.text('/ 5 — Nota geral do setor', margem + 26, y + 15)
  y += 34

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...PDF_INK)
  doc.text('Detalhamento por pergunta', margem, y); y += 8

  const barW = larguraUtil - 62 - 18
  perguntas.forEach((p) => {
    if (y > 270) { doc.addPage(); y = 20 }
    const n = pdfBarraCategoria(doc, margem, y, barW, p.pergunta, p.nota == null ? null : Number(p.nota), 5)
    y += 9.5 + (n - 1) * 4
  })
  y += 6

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...PDF_INK)
  doc.text('Comentários relevantes', margem, y); y += 8

  if (!comentarios.length) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...PDF_GRAY_TEXT)
    doc.text('Nenhum comentário específico registrado para este setor.', margem, y); y += 6
  } else {
    y = pdfComentariosEmCards(doc, margem, larguraUtil, y, comentarios)
  }
  return y
}

export async function baixarPdfSetor({ base, setorId, comentarios = [] } = {}) {
  if (!setorId || !base.setores.some((s) => s.id === setorId)) throw new Error('Não foi possível identificar o setor.')
  const doc = await novoDocumento()
  escreverSetorNoPDF(doc, base, setorId, comentarios)
  pdfRodapeTodasPaginas(doc)
  doc.save('CPA_setor_' + setorId + '.pdf')
  return 'PDF do setor gerado com sucesso!'
}

// ---------- planos de ação (todos os autores do recorte) ----------
export async function baixarPdfPlanos({ base, escopo, perfil } = {}) {
  const ids = escopo || []
  if (!ids.length) throw new Error('Nenhum curso disponível neste recorte para gerar o PDF.')

  const { data: vinc, error: e1 } = await sb.from('usuario_cursos').select('usuario_id, curso_id')
  if (e1) throw e1
  const cursosDe = {}
  for (const v of vinc || []) (cursosDe[v.usuario_id] ||= []).push(v.curso_id)

  const autores = base.usuarios
    .filter((u) => AUTOR_ROLES.includes(u.role) && u.id !== perfil?.id && (cursosDe[u.id] || []).some((cid) => ids.includes(cid)))
    .sort((a, b) => a.nome.localeCompare(b.nome))
  if (!autores.length) throw new Error('Nenhum autor de plano de ação encontrado neste recorte.')

  const { data: linhas, error: e2 } = await sb
    .from('planos_acao')
    .select('*')
    .in('usuario_id', autores.map((u) => u.id))
    .order('criado_em', { ascending: true })
  if (e2) throw e2
  const grupos = {}
  for (const r of linhas || []) (grupos[r.usuario_id] ||= []).push(r)

  const doc = await novoDocumento()
  const margem = 15, larguraUtil = 180, alturaMax = 278
  const logoLargura = 45
  const logoAltura = logoLargura * doc.__logo.proporcao
  const yInicial = 12 + logoAltura + 10
  let y = yInicial
  let primeiraPagina = true

  function desenharCabecalho() {
    doc.setFillColor(...PDF_NAVY); doc.rect(0, 0, 210, 4, 'F')
    doc.addImage(doc.__logo.dataUrl, 'PNG', margem, 10, logoLargura, logoAltura)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...PDF_INK)
    doc.text('Relatório de Planos de Ação — Comissão Própria de Avaliação (CPA)', margem + logoLargura + 6, 10 + logoAltura / 2 - 2)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...PDF_GRAY_TEXT)
    doc.text('Gerado em ' + hoje(), margem + logoLargura + 6, 10 + logoAltura / 2 + 4)
    doc.setDrawColor(...PDF_BLUE)
    doc.line(margem, 10 + logoAltura + 4, margem + larguraUtil, 10 + logoAltura + 4)
  }
  function quebrarSeNecessario(alturaEstimativa) {
    if (y + alturaEstimativa > alturaMax) {
      doc.addPage()
      desenharCabecalho()
      y = yInicial
    }
  }

  desenharCabecalho()

  autores.forEach((autor) => {
    const itens = (grupos[autor.id] || []).filter((it) => ids.includes(it.curso_id) && it.status !== 'rascunho')
    if (!itens.length) return

    if (!primeiraPagina) { doc.addPage(); desenharCabecalho() }
    primeiraPagina = false
    y = yInicial

    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...PDF_INK)
    doc.text(autor.nome, margem, y); y += 7
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...PDF_GRAY_TEXT)
    doc.text(ROLE_LABELS_PDF[autor.role] || autor.role, margem, y); y += 5
    const cursosTexto = (cursosDe[autor.id] || []).filter((cid) => ids.includes(cid)).map((cid) => cursoLabel(base, cid)).join(', ')
    const linhasCursos = doc.splitTextToSize('Cursos: ' + cursosTexto, larguraUtil)
    doc.text(linhasCursos, margem, y); y += linhasCursos.length * 5 + 6

    itens.forEach((it, idx) => {
      quebrarSeNecessario(30)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...PDF_INK)
      const tituloLinhas = doc.splitTextToSize(idx + 1 + '. ' + (it.titulo || alvoLabel(base, it)), larguraUtil)
      doc.text(tituloLinhas, margem, y); y += tituloLinhas.length * 5.5 + 2

      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...PDF_GRAY_TEXT)
      const meta = [cursoLabel(base, it.curso_id), it.categoria, statusTexto(it.status), it.prazo ? 'prazo: ' + it.prazo : null].filter(Boolean).join(' · ')
      const metaLinhas = doc.splitTextToSize(meta, larguraUtil)
      doc.text(metaLinhas, margem, y); y += metaLinhas.length * 4.5 + 3

      quebrarSeNecessario(15)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(50, 50, 60)
      const descLinhas = doc.splitTextToSize(it.descricao || '', larguraUtil)
      doc.text(descLinhas, margem, y); y += descLinhas.length * 4.5 + 2

      if (it.indicador) {
        quebrarSeNecessario(10)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...PDF_INK)
        doc.text('Indicador de sucesso:', margem, y)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 60)
        const indLinhas = doc.splitTextToSize(' ' + it.indicador, larguraUtil - 38)
        doc.text(indLinhas, margem + 38, y)
        y += Math.max(indLinhas.length, 1) * 4.5 + 3
      }

      const coments = it.comentarios_selecionados || []
      if (coments.length) {
        quebrarSeNecessario(12)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...PDF_BLUE)
        // (o antigo tinha um emoji aqui; a fonte padrão do PDF não desenha emoji)
        doc.text('Comentários que embasaram este plano (' + coments.length + '):', margem, y); y += 5
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(70, 70, 80)
        coments.forEach((texto) => {
          quebrarSeNecessario(8)
          const cLinhas = doc.splitTextToSize('• ' + String(texto).replace(/\\n/g, '\n'), larguraUtil - 4)
          doc.text(cLinhas, margem + 4, y); y += cLinhas.length * 4 + 2
        })
      }
      y += 5
      if (idx < itens.length - 1) {
        quebrarSeNecessario(2)
        doc.setDrawColor(219, 230, 245)
        doc.line(margem, y, margem + larguraUtil, y)
        y += 7
      }
    })
  })

  if (primeiraPagina) throw new Error('Nenhum plano enviado (não-rascunho) encontrado neste recorte para incluir no PDF.')

  pdfRodapeTodasPaginas(doc)
  doc.save('CPA_planos_de_acao_geral.pdf')
  return 'PDF gerado com sucesso, cobrindo ' + autores.length + ' autor(es)!'
}

// ---------- meu plano ----------
export async function baixarPdfMeuPlano({ base, perfil } = {}) {
  const { data, error } = await sb.from('planos_acao').select('*').eq('usuario_id', perfil.id).order('criado_em', { ascending: true })
  if (error) throw error
  const lista = data || []
  if (!lista.length) throw new Error('Você ainda não tem nenhum item registrado pra gerar o PDF.')

  const doc = await novoDocumento()
  const margem = 15, larguraUtil = 180
  let y = pdfCabecalho(doc, 'Plano de Ação — ' + perfil.nome, 'Gerado em ' + hoje() + ' · ' + lista.length + ' item(ns)')

  const STATUS_COR_PDF = {
    aprovado: PDF_GREEN, concluido: PDF_GREEN, devolvido: [196, 60, 60],
    aguardando_pro_reitoria: PDF_AMBER, aguardando_coordenador: PDF_AMBER,
  }

  lista.slice().reverse().forEach((it, idx) => {
    if (y > 250) { doc.addPage(); y = 20 }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...PDF_INK)
    const linhasTitulo = doc.splitTextToSize(idx + 1 + '. ' + (it.titulo || ''), larguraUtil)
    doc.text(linhasTitulo, margem, y); y += linhasTitulo.length * 6 + 2

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...PDF_GRAY_TEXT)
    doc.text(alvoLabel(base, it) + (it.categoria ? ' · ' + it.categoria : ''), margem, y); y += 5
    doc.text('Status: ', margem, y)
    const corStatus = STATUS_COR_PDF[it.status] || PDF_GRAY_TEXT
    const textoStatus = statusTexto(it.status)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...corStatus)
    doc.text(textoStatus, margem + 13, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...PDF_GRAY_TEXT)
    doc.text(' · Prioridade ' + (it.prioridade || '—') + ' · Prazo: ' + (it.prazo || '—'), margem + 13 + doc.getTextWidth(textoStatus), y)
    y += 7

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(50, 50, 60)
    const linhasDesc = doc.splitTextToSize(it.descricao || '', larguraUtil)
    if (y + linhasDesc.length * 5 > 285) { doc.addPage(); y = 20 }
    doc.text(linhasDesc, margem, y); y += linhasDesc.length * 5 + 3

    if (it.indicador) {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...PDF_INK)
      doc.text('Indicador:', margem, y)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 60)
      const linhasInd = doc.splitTextToSize(it.indicador, larguraUtil - 24)
      doc.text(linhasInd, margem + 24, y); y += Math.max(linhasInd.length * 5, 5) + 3
    }
    y += 6
  })

  pdfRodapeTodasPaginas(doc)
  doc.save('CPA_meu_plano_' + String(perfil.nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_') + '.pdf')
  return 'PDF do seu plano gerado com sucesso!'
}
