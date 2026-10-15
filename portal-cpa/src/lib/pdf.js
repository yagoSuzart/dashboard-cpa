// Relatórios em PDF — mesmo conteúdo e layout do sistema anterior (jsPDF).
// A biblioteca é carregada só na hora de gerar (import dinâmico), para não pesar a abertura do Portal.
//
// Todas as funções exportadas são assíncronas e:
//   - salvam o arquivo no navegador (doc.save) e devolvem a mensagem de sucesso (string);
//   - lançam Error com a mesma mensagem de aviso do sistema anterior quando não há o que gerar.
//
// Assinaturas:
//   baixarPdfCurso({ base, cursoId, perfil?, planos? })     → relatório completo do curso (CPA_<curso>.pdf):
//     satisfação, dimensões x instituição, onde agir, mapa das turmas, pergunta por pergunta,
//     planos de ação e todos os comentários (sem nomes de professores)
//   baixarPdfGeral({ base, escopo, respondentes? })         → um curso por página         (CPA_relatorio_geral.pdf)
//   baixarPdfSetor({ base, setorId, comentarios? })         → PDF de um setor             (CPA_setor_<id>.pdf)
//   baixarPdfPlanos({ base, escopo, perfil })               → planos de todos os autores  (CPA_planos_de_acao_geral.pdf)
//   baixarPdfMeuPlano({ base, perfil })                     → planos de quem está logado  (CPA_meu_plano_<nome>.pdf)
//   baixarPdfPendencias({ base, pessoa, cob })              → gabarito e pendências de um coordenador (CPA_pendencias_<nome>.pdf)
//
//   base: o objeto `base` do App (cursos, notas, setores, setorPerguntas, usuarios...).
//   escopo: ids dos cursos visíveis para a pessoa (prop `escopo` do App).
//   respondentes (opcional): { [curso_id]: número de alunos que responderam } — não existe no banco hoje;
//     quando não vem, a linha "N aluno(s) responderam" simplesmente não aparece (como no antigo sem o dado).
//   comentarios (opcional): textos de comentários do setor. O banco não tem tabela de comentários por setor;
//     sem eles, o PDF mostra "Nenhum comentário específico registrado para este setor.", como no antigo.
import { sb, buscarComentarios, carregarTurmas, ciclosImportados, resultadosCursos, resultadosGerais } from './dados.js'
import { DIMENSOES, SATISFACAO, META, MODALIDADE_LABEL, ROLE_LABELS } from './config.js'
import { dimensaoDaPesquisa, estatisticas, fmtNota, nomeCurto, somarPorPergunta } from './cpa.js'
import { mediasPorDimensao } from './escopo.js'
import { CATEGORIAS_PLANO } from './planos.js'
import { acaoPendente, nomeCurso, situacaoEnvio, textoIndicio } from './cobertura.js'

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
  const linhasSub = doc.splitTextToSize(subtitulo, larguraUtil - logoLargura - 8)
  doc.text(linhasSub, xTexto, 22 + linhasTitulo.length * 5.5)
  return Math.max(15 + logoAltura + 12, 22 + linhasTitulo.length * 5.5 + (linhasSub.length - 1) * 4 + 10)
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

export async function baixarPdfCurso({ base, cursoId, planos } = {}) {
  if (!cursoId || !base.cursos.some((c) => c.id === cursoId))
    throw new Error('Selecione um curso específico (não "todos os cursos") antes de baixar o PDF.')
  const ciclos = await ciclosImportados().catch(() => [])
  const ciclo = ciclos[0]?.ciclo || null
  const [doc, turmas, porCurso, gerais, comentarios] = await Promise.all([
    novoDocumento(),
    carregarTurmas(cursoId).catch(() => []),
    ciclo ? resultadosCursos(ciclo, [cursoId]).catch(() => []) : [],
    ciclo ? resultadosGerais(ciclo).catch(() => []) : [],
    todosComentarios(cursoId),
  ])
  escreverCursoCompleto(doc, {
    base, cid: cursoId, ciclo, turmas, comentarios,
    perguntas: somarPorPergunta(porCurso), gerais,
    planos: (planos || base.planos || []).filter((x) => x.curso_id === cursoId),
  })
  pdfRodapeTodasPaginas(doc)
  doc.save('CPA_' + cursoId + '.pdf')
  return 'PDF do curso gerado com sucesso!'
}

// Todos os comentários do curso (de 1000 em 1000)
async function todosComentarios(cid) {
  const out = []
  for (let pagina = 0; pagina < 20; pagina++) {
    const { itens } = await buscarComentarios({ cursos: [cid], pagina, porPagina: 1000 })
    out.push(...itens)
    if (itens.length < 1000) break
  }
  return out
}

// ---------- relatório completo de um curso ----------
const M = 15, L = 180, FIM = 282

function cabe(doc, y, h) {
  if (y + h > FIM) { doc.addPage(); return 20 }
  return y
}

function secao(doc, y, titulo, apoio) {
  y = cabe(doc, y + 5, 24)
  doc.setFillColor(...PDF_BLUE); doc.rect(M, y - 4.2, 1.6, 6, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(...PDF_INK)
  doc.text(titulo, M + 4, y)
  y += 5.5
  if (apoio) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...PDF_GRAY_TEXT)
    const l = doc.splitTextToSize(apoio, L)
    doc.text(l, M, y); y += l.length * 4
  }
  return y + 3
}

// Mesmas faixas de cor do mapa de calor da tela
function corNota(v) {
  if (v == null || Number.isNaN(v)) return { f: [236, 239, 244], t: [120, 128, 140] }
  if (v < 3.5) return { f: [142, 52, 19], t: [255, 255, 255] }
  if (v < 4) return { f: [246, 201, 174], t: [74, 28, 8] }
  if (v < 4.3) return { f: [211, 229, 246], t: [11, 58, 99] }
  return { f: [28, 109, 179], t: [255, 255, 255] }
}

// Tabela simples: cabeçalho navy repetido a cada página, texto com quebra de linha.
// colunas: [{ t, w, a: 'left'|'right'|'center' }]; linhas: [[valor | { v, cor }]]
function tabela(doc, y, colunas, linhas, { fonte = 8.5 } = {}) {
  const pad = 1.8
  const cab = () => {
    doc.setFillColor(...PDF_NAVY); doc.rect(M, y, L, 7, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255)
    let x = M
    for (const c of colunas) {
      const tx = c.a === 'right' ? x + c.w - pad : c.a === 'center' ? x + c.w / 2 : x + pad
      doc.text(c.t, tx, y + 4.7, { align: c.a || 'left' })
      x += c.w
    }
    y += 7
  }
  y = cabe(doc, y, 16)
  cab()
  linhas.forEach((ln, i) => {
    doc.setFontSize(fonte)
    const partes = ln.map((cel, k) => {
      doc.setFont('helvetica', cel && typeof cel === 'object' && cel.b ? 'bold' : 'normal')
      return doc.splitTextToSize(String(cel && typeof cel === 'object' ? cel.v : cel ?? '—'), colunas[k].w - pad * 2)
    })
    const h = Math.max(...partes.map((p) => p.length)) * (fonte * 0.42) + 3.2
    if (y + h > FIM) { doc.addPage(); y = 20; cab() }
    if (i % 2) { doc.setFillColor(247, 248, 251); doc.rect(M, y, L, h, 'F') }
    let x = M
    ln.forEach((cel, k) => {
      const c = colunas[k]
      const cor = cel && typeof cel === 'object' ? cel.cor : null
      if (cor) { doc.setFillColor(...cor.f); doc.rect(x + 0.4, y + 0.4, c.w - 0.8, h - 0.8, 'F') }
      doc.setTextColor(...(cor ? cor.t : [40, 44, 56]))
      doc.setFont('helvetica', cel && typeof cel === 'object' && cel.b ? 'bold' : 'normal')
      const tx = c.a === 'right' ? x + c.w - pad : c.a === 'center' ? x + c.w / 2 : x + pad
      doc.text(partes[k], tx, y + 2.2 + fonte * 0.35, { align: c.a || 'left' })
      x += c.w
    })
    y += h
  })
  return y + 5
}

function paragrafo(doc, y, texto, { tam = 9.5, cor = [50, 54, 66], estilo = 'normal' } = {}) {
  doc.setFont('helvetica', estilo); doc.setFontSize(tam); doc.setTextColor(...cor)
  const l = doc.splitTextToSize(texto, L)
  y = cabe(doc, y, l.length * tam * 0.45)
  doc.text(l, M, y)
  return y + l.length * tam * 0.45 + 2
}

const nota2 = (v) => fmtNota(v)
const dif = (v, b) => (v == null || b == null ? '—' : (v - b >= 0 ? '+' : '') + fmtNota(v - b))

function escreverCursoCompleto(doc, { base, cid, ciclo, turmas, comentarios, perguntas, gerais, planos }) {
  const n = base.notas[cid] || {}
  const inst = mediasPorDimensao(base.notas, base.cursos.map((c) => c.id))
  const resp = base.respondentes?.[cid]

  let y = pdfCabecalho(doc, cursoLabel(base, cid),
    'Relatório CPA' + (ciclo ? ' ' + ciclo : '') + ' — UniFECAF' + (resp ? ' · ' + resp + ' aluno(s) responderam' : '') + ' · Gerado em ' + hoje())

  // 1. Satisfação geral
  doc.setFillColor(233, 241, 252); doc.roundedRect(M, y, L, 24, 3, 3, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(...PDF_BLUE)
  doc.text(nota2(n[SATISFACAO]), M + 8, y + 15.5)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...PDF_INK)
  doc.text('Satisfação geral dos alunos (0 a 10)', M + 38, y + 10.5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...PDF_GRAY_TEXT)
  doc.text('Média institucional: ' + nota2(inst[SATISFACAO]) + '   ·   Diferença: ' + dif(n[SATISFACAO], inst[SATISFACAO]), M + 38, y + 16.5)
  y += 33

  // 2. Dimensões x instituição
  y = secao(doc, y, 'Resultado por dimensão', 'Notas de 1 a 5. Meta: ' + fmtNota(META, 1) + '. Cores iguais às do mapa de calor do Portal.')
  y = tabela(doc, y,
    [{ t: 'Dimensão', w: 80 }, { t: 'Curso', w: 30, a: 'center' }, { t: 'Média institucional', w: 40, a: 'right' }, { t: 'Diferença', w: 30, a: 'right' }],
    DIMENSOES.map((d) => [d, { v: nota2(n[d]), cor: corNota(n[d]), b: true }, nota2(inst[d]), dif(n[d], inst[d])]))

  // 3. Ponto forte, oportunidade e onde agir primeiro
  const comNota = DIMENSOES.filter((d) => typeof n[d] === 'number').sort((a, b) => n[b] - n[a])
  const mapa = {}
  for (const t of turmas) (mapa[t.turma] ||= {})[t.categoria] = Number(t.nota)
  const linhasTurma = Object.entries(mapa).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR', { numeric: true }))
  if (comNota.length) {
    y = cabe(doc, y, 30)
    const forte = comNota[0], oport = comNota[comNota.length - 1]
    const w = (L - 6) / 2
    pdfCaixaDestaque(doc, M, y, w, 20, PDF_GREEN, [226, 246, 235], 'PONTO FORTE', forte + ' (' + nota2(n[forte]) + ')')
    pdfCaixaDestaque(doc, M + w + 6, y, w, 20, PDF_AMBER, [252, 240, 222], 'OPORTUNIDADE', oport + ' (' + nota2(n[oport]) + ')')
    y += 27
    const comT = linhasTurma.filter(([, v]) => v[oport] != null)
    const abaixo = comT.filter(([, v]) => v[oport] < META).sort((a, b) => a[1][oport] - b[1][oport])
    y = secao(doc, y, 'Onde agir primeiro')
    y = paragrafo(doc, y, `${oport} é a dimensão mais baixa (${nota2(n[oport])})` + (comT.length ? `, abaixo da meta em ${abaixo.length} de ${comT.length} turmas.` : '.') +
      (abaixo.length ? ` Turmas mais baixas: ${abaixo.slice(0, 5).map(([t, v]) => `${t} (${nota2(v[oport])})`).join(', ')}.` : ''))
    y += 4
  }

  // 4. Mapa de calor das turmas
  if (linhasTurma.length) {
    y = secao(doc, y, 'Mapa de calor das turmas', 'Nota de cada turma em cada dimensão. Laranja escuro: abaixo de 3,5 · Laranja claro: 3,5 a 3,99 · Azul claro: 4,0 a 4,29 · Azul: 4,3 ou mais.')
    const CURTO = { 'Conteúdo das Disciplinas': 'Conteúdo', 'Infraestrutura e Atendimento': 'Infraestrutura', 'Políticas Acadêmicas': 'Pol. acadêmicas', 'Políticas de Gestão': 'Pol. de gestão', 'Docência e Tutoria': 'Docência' }
    y = tabela(doc, y,
      [{ t: 'Turma', w: 30 }, ...DIMENSOES.map((d) => ({ t: CURTO[d] || d, w: 30, a: 'center' }))],
      linhasTurma.map(([t, v]) => [t, ...DIMENSOES.map((d) => ({ v: v[d] == null ? '—' : nota2(v[d]), cor: corNota(v[d]) }))]))
  }

  // 5. Pergunta por pergunta
  if (perguntas.length) {
    const instQ = {}
    for (const g of gerais) instQ[g.survey_id + '|' + g.pergunta_posicao] = estatisticas(g)
    const ordem = [...DIMENSOES, SATISFACAO]
    const pesquisas = [...new Map(perguntas.map((r) => [r.survey_id, { id: r.survey_id, pesquisa: r.pesquisa, dim: dimensaoDaPesquisa(r.pesquisa) }])).values()]
      .sort((a, b) => ordem.indexOf(a.dim) - ordem.indexOf(b.dim) || nomeCurto(a.pesquisa).localeCompare(nomeCurto(b.pesquisa)))
    y = secao(doc, y, 'Pergunta por pergunta', 'Média do curso em cada pergunta, comparada com a instituição. "Não sei / Não utilizo" fica fora da média. Na Satisfação Geral (0 a 10) aparece também o NPS.')
    for (const q of pesquisas) {
      y = cabe(doc, y + 3, 22)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...PDF_BLUE)
      doc.text(nomeCurto(q.pesquisa) + (q.dim && q.dim !== nomeCurto(q.pesquisa) ? '  ·  ' + q.dim : ''), M, y)
      y += 4
      const linhas = perguntas.filter((r) => r.survey_id === q.id).sort((a, b) => a.pergunta_posicao - b.pergunta_posicao).map((r) => {
        const e = estatisticas(r)
        const g = instQ[r.survey_id + '|' + r.pergunta_posicao]
        const cor = e.escala === '0a10' ? null : corNota(e.media)
        const txtCurso = nota2(e.media) + (e.nps != null ? ' (NPS ' + e.nps + ')' : '')
        return [r.pergunta_posicao, r.pergunta, e.n, e.naoUtilizo || '—', cor ? { v: txtCurso, cor, b: true } : { v: txtCurso, b: true }, g ? nota2(g.media) + (g.nps != null ? ' (NPS ' + g.nps + ')' : '') : '—']
      })
      y = tabela(doc, y, [{ t: '#', w: 8, a: 'center' }, { t: 'Pergunta', w: 76 }, { t: 'Respostas', w: 18, a: 'right' }, { t: 'Não sei / NU', w: 20, a: 'right' }, { t: 'Curso', w: 29, a: 'center' }, { t: 'Instituição', w: 29, a: 'right' }], linhas)
    }
  }

  // 6. Planos de ação do curso
  y = secao(doc, y, 'Planos de ação do curso', planos.length ? planos.length + ' plano(s) registrado(s).' : null)
  if (!planos.length) y = paragrafo(doc, y, 'Nenhum plano de ação registrado para este curso.', { cor: PDF_GRAY_TEXT }) + 4
  else {
    const autor = (id) => base.usuarios.find((u) => u.id === id)?.nome || '—'
    const data = (d) => (d ? new Date(String(d).length <= 10 ? d + 'T12:00:00' : d).toLocaleDateString('pt-BR') : '—')
    y = tabela(doc, y, [{ t: 'Plano', w: 64 }, { t: 'Autor', w: 36 }, { t: 'Situação', w: 38 }, { t: 'Prioridade', w: 18 }, { t: 'Prazo', w: 24, a: 'center' }],
      planos.map((p) => [p.titulo, autor(p.usuario_id), statusTexto(p.status), p.prioridade || '—', data(p.prazo)]))
  }

  // 7. Todos os comentários, por categoria (só a turma; o nome do professor não entra no PDF)
  const SENT = { good: 'positivos', warn: 'pedem atenção', bad: 'negativos' }
  const cont = { good: 0, warn: 0, bad: 0 }
  for (const c of comentarios) if (cont[c.sentimento] != null) cont[c.sentimento]++
  y = secao(doc, y, `Comentários dos alunos (${comentarios.length})`, comentarios.length ? 'Exatamente como os alunos escreveram, separados por categoria. ' + Object.entries(cont).filter(([, v]) => v).map(([k, v]) => `${v} ${SENT[k]}`).join(' · ') + '.' : null)
  if (!comentarios.length) y = paragrafo(doc, y, 'Nenhum comentário registrado para este curso.', { cor: PDF_GRAY_TEXT })
  const porCat = new Map()
  for (const c of comentarios) { const k = c.categoria || 'Outros'; if (!porCat.has(k)) porCat.set(k, []); porCat.get(k).push(c) }
  const COR_SENT = { good: PDF_GREEN, warn: PDF_AMBER, bad: [176, 58, 30] }
  for (const [cat, lista] of porCat) {
    y = cabe(doc, y, 18)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...PDF_BLUE)
    doc.text(`${cat} (${lista.length})`, M, y); y += 5
    for (const c of lista) {
      const meta = c.turma ? 'Turma ' + c.turma : ''
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8)
      const linhas = doc.splitTextToSize(String(c.texto || '').replace(/\\n/g, '\n'), L - 10)
      const h = linhas.length * 3.8 + (meta ? 4.2 : 0) + 4
      y = cabe(doc, y, h)
      doc.setFillColor(...PDF_CARD_BG); doc.rect(M, y, L, h, 'F')
      doc.setFillColor(...(COR_SENT[c.sentimento] || PDF_BLUE)); doc.rect(M, y, 1.3, h, 'F')
      let yy = y + 4
      if (meta) { doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...PDF_GRAY_TEXT); doc.text(meta, M + 5, yy); yy += 4.2 }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(50, 54, 66)
      doc.text(linhas, M + 5, yy)
      y += h + 2
    }
    y += 3
  }
  return y
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

// ---------- demandas de um setor sem acesso ao Portal (o admin envia ao responsável) ----------
export async function baixarPdfDemandas({ base, area, planos = [] } = {}) {
  if (!planos.length) throw new Error('Nenhum plano para este destino.')
  const doc = await novoDocumento()
  const nome = nomeAreaPdf(area, base.setores)
  let y = pdfCabecalho(doc, 'Demandas para: ' + nome, 'Planos de ação da CPA — UniFECAF · ' + planos.length + ' plano(s) · Gerado em ' + hoje())
  y = paragrafo(doc, y, 'Pontos levantados pelos alunos na avaliação da CPA que dependem deste setor. Cada item traz o curso, o que será feito, o que os alunos apontaram e os comentários anexados pelo coordenador.', { cor: PDF_GRAY_TEXT, tam: 9 }) + 3
  planos.forEach((p, i) => {
    const autor = base.usuarios.find((u) => u.id === p.usuario_id)?.nome || '—'
    y = secao(doc, y, (i + 1) + '. ' + p.titulo, cursoLabel(base, p.curso_id) + ' · ' + autor + ' · ' + statusTexto(p.status) + (p.prazo ? ' · prazo ' + new Date(p.prazo + 'T12:00:00').toLocaleDateString('pt-BR') : ''))
    y = paragrafo(doc, y, 'O que será feito: ' + (p.descricao || '—'))
    if (p.queixa_aluno) y = paragrafo(doc, y, 'O que os alunos apontaram: ' + p.queixa_aluno)
    if (p.triagem_obs) y = paragrafo(doc, y, 'Recado da CPA: ' + p.triagem_obs, { estilo: 'bold', cor: PDF_INK })
    const outros = [p.area, ...(p.areas_extra || [])].filter((a) => a && a !== area)
    if (outros.length) y = paragrafo(doc, y, 'Também encaminhado para: ' + outros.map((a) => nomeAreaPdf(a, base.setores)).join(', '), { cor: PDF_GRAY_TEXT, tam: 9 })
    const coments = p.comentarios_selecionados || []
    if (coments.length) {
      y = paragrafo(doc, y, 'Comentários dos alunos anexados (' + coments.length + '):', { estilo: 'bold', tam: 9.5 })
      y = pdfComentariosEmCards(doc, M, L, y, coments)
    }
    y += 4
  })
  pdfRodapeTodasPaginas(doc)
  doc.save('CPA_demandas_' + String(area).replace(/[^A-Za-z0-9]+/g, '_') + '.pdf')
  return 'PDF de “' + nome + '” gerado com ' + planos.length + ' plano(s).'
}

function nomeAreaPdf(area, setores = []) {
  const s = setores.find((x) => x.id === area)
  if (s) return s.nome
  if (area === 'polos') return 'Polos (EAD/Semipresencial)'
  if (area === 'outro') return 'Financeiro / Outra área'
  return area || ''
}

// ---------- pendências de planos de ação de um coordenador ----------
// Cores das células do gabarito (mesmas da tela de Acompanhar)
const COR_ESTADO = {
  ok: { f: [221, 242, 228], t: [22, 101, 52] },
  nao_enviado: { f: [236, 228, 250], t: [91, 33, 182] },
  devolvido: { f: [253, 236, 211], t: [146, 64, 14] },
  falta: { f: [190, 38, 38], t: [255, 255, 255] },
  conferir: { f: [255, 244, 199], t: [122, 90, 0] },
}
// Cabeçalhos curtos para caber nas colunas do PDF
const CURTO_PDF = { 'Conteúdo das Disciplinas': 'Conteúdo', 'Infraestrutura e Atendimento': 'Infraestr.', 'Políticas Acadêmicas': 'Pol. Acad.', 'Políticas de Gestão': 'Pol. Gestão', 'Docência e Tutoria': 'Docência', 'Satisfação Geral': 'Satisfação' }
const SIGLA_ESTADO = { ok: 'ENVIADO', nao_enviado: 'NÃO ENVIADO', devolvido: 'DEVOLVIDO', falta: 'FALTA', conferir: 'CONFIRMAR' }

export async function baixarPdfPendencias({ base, pessoa, cob, conferidoEm = new Date() } = {}) {
  if (!pessoa || !cob?.linhas?.length) throw new Error('Este coordenador não tem cursos vinculados.')
  const doc = await novoDocumento()
  const nomeDe = (id) => base.usuarios.find((u) => u.id === id)?.nome || ''
  const conta = { ok: 0, nao_enviado: 0, devolvido: 0, falta: 0, conferir: 0 }
  for (const l of cob.linhas) for (const d of CATEGORIAS_PLANO) conta[l.estado[d]]++
  const pend = conta.nao_enviado + conta.devolvido + conta.falta
  const quando = conferidoEm.toLocaleDateString('pt-BR') + ' às ' + conferidoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const total = cob.linhas.length * CATEGORIAS_PLANO.length
  const modal = (c) => MODALIDADE_LABEL[c.modalidade] || c.modalidade || ''

  let y = pdfCabecalho(doc, 'Planos de ação: o que falta entregar', pessoa.nome + ' · ' + cob.linhas.length + ' curso(s)/modalidade(s) · Situação conferida no Portal da CPA em ' + quando)
  y = paragrafo(doc, y, pend
    ? 'Para cada curso que você coordena, a CPA espera um plano de ação ENVIADO para cada questionário e para cada modalidade de oferta (Presencial, EAD e Semipresencial têm planos próprios, mesmo quando o curso tem o mesmo nome). Abaixo está o gabarito do que já chegou para a análise e do que ainda falta. Só conta como entregue o plano enviado: plano escrito e não enviado (inclusive o do professor auxiliar, que depende da sua aprovação) não chega para a CPA.'
    : 'Todos os planos de ação dos seus cursos já foram enviados para a análise da CPA. Obrigado!', { cor: PDF_GRAY_TEXT, tam: 9 }) + 2

  // Resumo em quatro caixas
  y = cabe(doc, y, 22)
  const caixas = [['ok', 'Enviados'], ['nao_enviado', 'Escritos, não enviados'], ['devolvido', 'Devolvidos'], ['falta', 'Faltando']]
  const wc = (L - 3 * 4) / 4
  caixas.forEach(([k, t], i) => {
    const x = M + i * (wc + 4), cor = COR_ESTADO[k]
    doc.setFillColor(...cor.f); doc.roundedRect(x, y, wc, 18, 2.5, 2.5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...cor.t)
    doc.text(String(conta[k]), x + 4, y + 9)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.text(t, x + 4, y + 14.5)
  })
  y += 22
  y = paragrafo(doc, y, pend + ' pendência(s) de ' + total + ' itens (curso × questionário)' + (conta.conferir ? ' · ' + conta.conferir + ' item(ns) para confirmar com você.' : '.'), { estilo: 'bold', cor: PDF_INK, tam: 9.5 }) + 1

  // Gabarito: cursos × questionários
  y = secao(doc, y, 'Gabarito', 'Linhas = cursos (curso + modalidade). Colunas = questionários (Conteúdo das Disciplinas, Infraestrutura e Atendimento, Políticas Acadêmicas, Políticas de Gestão, Docência e Tutoria, Satisfação Geral). ENVIADO = já chegou para a CPA; NÃO ENVIADO = escrito e parado; DEVOLVIDO = voltou com comentário; FALTA = não há plano; CONFIRMAR = há plano de outra pessoa neste curso e modalidade, precisamos confirmar.')
  const wDim = 22, wCurso = L - wDim * CATEGORIAS_PLANO.length
  const colunas = [{ t: 'Curso · modalidade', w: wCurso }, ...CATEGORIAS_PLANO.map((d) => ({ t: CURTO_PDF[d] || d, w: wDim, a: 'center' }))]
  const linhas = cob.linhas.map((l) => [
    { v: nomeCurso(l.curso) + ' · ' + modal(l.curso), b: true },
    ...CATEGORIAS_PLANO.map((d) => ({ v: SIGLA_ESTADO[l.estado[d]], cor: COR_ESTADO[l.estado[d]], b: true })),
  ])
  doc.setFontSize(7)
  y = tabela(doc, y, colunas, linhas, { fonte: 7 })

  // O que fazer, curso a curso
  const pendentes = cob.linhas.filter((l) => l.faltam.length)
  if (pendentes.length) {
    y = secao(doc, y, 'O que fazer, curso a curso', 'Só aparecem os cursos com pendência.')
    for (const l of pendentes) {
      y = cabe(doc, y, 14)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...PDF_INK)
      doc.text(nomeCurso(l.curso) + ' · ' + modal(l.curso) + '  (' + l.faltam.length + ' pendência' + (l.faltam.length > 1 ? 's' : '') + ')', M, y)
      y += 5
      for (const d of l.faltam) {
        const e = l.estado[d], cor = COR_ESTADO[e]
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
        const txt = doc.splitTextToSize(d + ': ' + acaoPendente(e, l.planosDim[d], nomeDe), L - 30)
        const h = txt.length * 4 + 2
        y = cabe(doc, y, h)
        doc.setFillColor(...cor.f); doc.roundedRect(M + 2, y - 3.4, 24, 5, 1.2, 1.2, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); doc.setTextColor(...cor.t)
        doc.text(SIGLA_ESTADO[e], M + 14, y + 0.1, { align: 'center' })
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(50, 54, 66)
        doc.text(txt, M + 29, y)
        y += h
      }
      y += 3
    }
  }

  // Para confirmar: há plano enviado por outra pessoa neste curso e modalidade
  const aConferir = cob.linhas.filter((l) => l.conferir.length)
  if (aConferir.length) {
    y = secao(doc, y, 'Para confirmar com você', 'Não encontramos plano seu nestes itens, mas há plano enviado por outra pessoa para o mesmo curso, modalidade e questionário. Responda confirmando se ele é o plano deste item; se não for, escreva e envie o seu.')
    for (const l of aConferir) {
      y = cabe(doc, y, 12)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...PDF_INK)
      doc.text(nomeCurso(l.curso) + ' · ' + modal(l.curso), M, y)
      y += 5
      for (const d of l.conferir) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
        const txt = doc.splitTextToSize(d + ': há ' + textoIndicio(l.indicios[d], l.curso, base) + '.', L - 30)
        const h = txt.length * 4 + 2
        y = cabe(doc, y, h)
        doc.setFillColor(...COR_ESTADO.conferir.f); doc.roundedRect(M + 2, y - 3.4, 24, 5, 1.2, 1.2, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); doc.setTextColor(...COR_ESTADO.conferir.t)
        doc.text(SIGLA_ESTADO.conferir, M + 14, y + 0.1, { align: 'center' })
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(50, 54, 66)
        doc.text(txt, M + 29, y)
        y += h
      }
      y += 3
    }
  }

  // O que já recebemos: o registro do que chegou para a CPA
  const recebidos = cob.linhas.flatMap((l) => CATEGORIAS_PLANO.flatMap((d) => l.planosDim[d].filter((p) => situacaoEnvio(p) === 'enviado').map((p) => ({ l, d, p }))))
  y = secao(doc, y, 'O que já recebemos', recebidos.length ? 'Planos enviados que constam no Portal da CPA em ' + quando + '.' : 'Nenhum plano enviado consta no Portal da CPA em ' + quando + '.')
  if (recebidos.length) {
    y = tabela(doc, y, [{ t: 'Curso · modalidade', w: 46 }, { t: 'Questionário', w: 32 }, { t: 'Plano', w: 57 }, { t: 'Situação', w: 24 }, { t: 'Registrado', w: 21, a: 'center' }],
      recebidos.map(({ l, d, p }) => [nomeCurso(l.curso) + ' · ' + modal(l.curso), CURTO_PDF[d] || d, p.titulo || '—', statusTexto(p.status).replace(' — ainda não enviado', ''), p.criado_em ? new Date(p.criado_em).toLocaleDateString('pt-BR') : '—']), { fonte: 7.5 })
  }

  y = cabe(doc, y + 2, 34)
  pdfCaixaDestaque(doc, M, y, L, 31, PDF_AMBER, [253, 246, 232], 'Atenção',
    'Se você já escreveu algum destes planos, confira se clicou em Enviar: plano escrito e não enviado não chega para a CPA aprovar. Planos do professor auxiliar precisam da sua revisão e envio. Se você enviou algum plano que não aparece em "O que já recebemos", responda com o título dele que a CPA confere.')

  pdfRodapeTodasPaginas(doc)
  doc.save('CPA_pendencias_' + String(pessoa.nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_') + '.pdf')
  return 'PDF de pendências de ' + pessoa.nome + ' gerado (' + pend + ' pendência' + (pend === 1 ? '' : 's') + ').'
}
