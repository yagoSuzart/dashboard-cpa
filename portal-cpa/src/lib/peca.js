// Peça de retorno da CPA para os alunos (carrossel Instagram/WhatsApp, 1080x1350) — mesmo layout do sistema
// anterior: capa, uma tela por plano escolhido (problema + solução) e encerramento. Gerada no navegador (Canvas2D).
//
// Uso:
//   const telas = await gerarPeca({ curso: 'Nome do curso', coordenador: 'Nome', itens: [{ problema, solucao }] })
//   → [{ nome: 'capa' | 'item-1' | ... | 'encerramento', canvas: HTMLCanvasElement }]
//   baixarTela(canvas, 'CPA_<curso>_<nome>.png')
//
// Limites (iguais aos do antigo): 1 a PECA_MAX_ITENS planos por peça; textos truncados em 130 caracteres.

export const PECA_MAX_ITENS = 3

const PECA_NAVY = '#12395E'
const PECA_BLUE = '#1C6DB3'
const PECA_GREEN = '#2FAE60'
const PECA_WHITE = '#FFFFFF'

let IMG_LOGO = null
let IMG_FOTO = null
let LOGO_BRANCO_CACHE = null

function pecaCarregarImagem(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// As fontes da peça (Poppins e Work Sans) não são usadas no resto do Portal: carrega só quando precisa.
function carregarFontes() {
  if (!document.getElementById('fontes-peca')) {
    const l = document.createElement('link')
    l.id = 'fontes-peca'
    l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Work+Sans:wght@500;600;700&display=swap'
    document.head.appendChild(l)
    return new Promise((resolve) => {
      l.onload = resolve
      l.onerror = resolve
    })
  }
  return Promise.resolve()
}

function pecaEstrela(ctx, cx, cy, tamanho, cor) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = cor
  ctx.beginPath()
  const pontas = [
    [0, -tamanho], [tamanho * 0.18, -tamanho * 0.18], [tamanho, 0],
    [tamanho * 0.18, tamanho * 0.18], [0, tamanho], [-tamanho * 0.18, tamanho * 0.18],
    [-tamanho, 0], [-tamanho * 0.18, -tamanho * 0.18],
  ]
  ctx.moveTo(pontas[0][0], pontas[0][1])
  for (let i = 1; i < pontas.length; i++) ctx.lineTo(pontas[i][0], pontas[i][1])
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function pecaTrianguloRodape(ctx) {
  const cores = [PECA_NAVY, PECA_BLUE, PECA_GREEN, PECA_BLUE, PECA_NAVY, PECA_GREEN, PECA_BLUE]
  const larguraTri = 1080 / cores.length
  const altura = 70
  cores.forEach((cor, i) => {
    ctx.fillStyle = cor
    ctx.beginPath()
    if (i % 2 === 0) {
      ctx.moveTo(i * larguraTri, 1350)
      ctx.lineTo((i + 1) * larguraTri, 1350)
      ctx.lineTo(i * larguraTri, 1350 - altura)
    } else {
      ctx.moveTo(i * larguraTri, 1350)
      ctx.lineTo((i + 1) * larguraTri, 1350)
      ctx.lineTo((i + 1) * larguraTri, 1350 - altura)
    }
    ctx.closePath()
    ctx.fill()
  })
}

function pecaQuebrarTexto(ctx, texto, maxLargura) {
  const palavras = String(texto).split(' ')
  const linhas = []
  let atual = ''
  palavras.forEach((p) => {
    const teste = atual ? atual + ' ' + p : p
    if (ctx.measureText(teste).width > maxLargura && atual) {
      linhas.push(atual)
      atual = p
    } else {
      atual = teste
    }
  })
  if (atual) linhas.push(atual)
  return linhas
}

function pecaTruncarTexto(texto, maxChars) {
  texto = String(texto || '').trim()
  if (texto.length <= maxChars) return texto
  return texto.slice(0, maxChars - 1).trim() + '…'
}

function pecaFotoCover(ctx, img) {
  const canvasW = 1080, canvasH = 1350
  const escala = Math.max(canvasW / img.width, canvasH / img.height)
  const w = img.width * escala, h = img.height * escala
  const x = (canvasW - w) / 2, y = (canvasH - h) / 2 - h * 0.06
  ctx.drawImage(img, x, y, w, h)
}

// Fundo: foto do campus borrada/escurecida, com estrelas e triângulos na frente
function pecaFundoBase(ctx, sparkleColor, fotoImg) {
  ctx.fillStyle = PECA_NAVY
  ctx.fillRect(0, 0, 1080, 1350)

  if (fotoImg) {
    ctx.save()
    ctx.filter = 'blur(3px) saturate(1.05)'
    pecaFotoCover(ctx, fotoImg)
    ctx.restore()

    const grad = ctx.createLinearGradient(0, 0, 0, 1350)
    grad.addColorStop(0, 'rgba(18,57,94,0.80)')
    grad.addColorStop(0.55, 'rgba(18,57,94,0.72)')
    grad.addColorStop(1, 'rgba(10,28,48,0.94)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1080, 1350)
  }

  pecaEstrela(ctx, 130, 260, 26, sparkleColor)
  pecaEstrela(ctx, 940, 180, 18, sparkleColor)
  pecaEstrela(ctx, 90, 620, 16, sparkleColor)
  pecaEstrela(ctx, 980, 900, 22, sparkleColor)
  pecaTrianguloRodape(ctx)
}

// Versão branca da logo oficial — o mesmo arquivo recolorido no canvas (source-in)
function pecaLogoBranco(img) {
  if (LOGO_BRANCO_CACHE) return LOGO_BRANCO_CACHE
  const off = document.createElement('canvas')
  off.width = img.width
  off.height = img.height
  const octx = off.getContext('2d')
  octx.drawImage(img, 0, 0)
  octx.globalCompositeOperation = 'source-in'
  octx.fillStyle = '#FFFFFF'
  octx.fillRect(0, 0, off.width, off.height)
  LOGO_BRANCO_CACHE = off
  return off
}

function pecaLogoCard(ctx, x, y, logoImg, alturaAlvo) {
  if (!logoImg) return 0
  const imgBranco = pecaLogoBranco(logoImg)
  alturaAlvo = alturaAlvo || 90
  const largura = alturaAlvo * (logoImg.width / logoImg.height)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 2
  ctx.drawImage(imgBranco, x, y, largura, alturaAlvo)
  ctx.restore()
  return largura
}

function retanguloArredondado(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else {
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }
  ctx.fill()
}

function pecaSeloTopo(ctx, texto, x, y) {
  ctx.font = '700 26px Poppins'
  const largura = ctx.measureText(texto).width + 48
  ctx.fillStyle = PECA_GREEN
  retanguloArredondado(ctx, x, y, largura, 56, 28)
  ctx.fillStyle = PECA_WHITE
  ctx.textBaseline = 'middle'
  ctx.fillText(texto, x + 24, y + 29)
}

function pecaCaixaDestaque(ctx, texto, cor, y0, fontSizePx) {
  fontSizePx = fontSizePx || 52
  ctx.font = '800 ' + fontSizePx + 'px Poppins'
  const maxLargura = 900
  const linhas = pecaQuebrarTexto(ctx, texto, maxLargura)
  const linhaAltura = Math.round(fontSizePx * 1.23)
  const padY = Math.round(fontSizePx * 0.85)
  const altura = linhas.length * linhaAltura + padY * 2
  const largura = 940
  const x = (1080 - largura) / 2
  ctx.fillStyle = cor
  retanguloArredondado(ctx, x, y0, largura, altura, 24)
  ctx.fillStyle = PECA_WHITE
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  linhas.forEach((linha, i) => {
    ctx.fillText(linha, x + 40, y0 + padY + i * linhaAltura)
  })
  return y0 + altura
}

function pecaRodapeAtribuicao(ctx, curso, coordenador) {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#B9C1D6'
  ctx.font = '600 30px "Work Sans"'
  ctx.fillText(curso, 540, 1170)
  ctx.font = '500 24px "Work Sans"'
  ctx.fillText('Coordenação: ' + coordenador, 540, 1206)
}

function desenharCapaPeca(ctx, dados) {
  pecaFundoBase(ctx, 'rgba(255,255,255,0.85)', dados.foto)
  pecaLogoCard(ctx, 60, 60, dados.logo)
  pecaSeloTopo(ctx, 'RESULTADO DA CPA', 60, 170)

  ctx.fillStyle = PECA_WHITE
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '800 64px Poppins'
  let y = 420
  pecaQuebrarTexto(ctx, 'Você respondeu a CPA.', 940).forEach((l) => { ctx.fillText(l, 60, y); y += 74 })

  ctx.fillStyle = '#DCE7F5'
  ctx.font = '600 38px "Work Sans"'
  y += 16
  pecaQuebrarTexto(ctx, 'Isso é o que fizemos com a sua resposta:', 940).forEach((l) => { ctx.fillText(l, 60, y); y += 50 })

  y += 34
  y = pecaCaixaDestaque(ctx, dados.curso, PECA_GREEN, y, 50)

  y += 26
  ctx.fillStyle = '#B9C1D6'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top' // como no antigo (herdado da caixa de destaque)
  ctx.font = '500 30px "Work Sans"'
  ctx.fillText('Coordenação: ' + dados.coordenador, 60, y)
}

function desenharItemPeca(ctx, dados) {
  pecaFundoBase(ctx, 'rgba(255,255,255,0.75)', dados.foto)
  pecaLogoCard(ctx, 60, 60, dados.logo)
  pecaSeloTopo(ctx, 'RESULTADO DA CPA', 60, 170)

  ctx.fillStyle = PECA_WHITE
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '800 44px Poppins'
  let y = 400
  pecaQuebrarTexto(ctx, dados.curso, 940).forEach((l) => { ctx.fillText(l, 60, y); y += 52 })
  y += 30

  ctx.fillStyle = '#9FC3EE'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '700 28px "Work Sans"'
  ctx.fillText('🔍 O QUE OS ALUNOS DISSERAM', 60, y)
  y += 22
  y = pecaCaixaDestaque(ctx, pecaTruncarTexto(dados.problema, 130), PECA_BLUE, y, 36)
  y += 40

  ctx.fillStyle = '#A9E8C4'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '700 28px "Work Sans"'
  ctx.fillText('✅ NOSSO PLANO DE AÇÃO', 60, y)
  y += 22
  pecaCaixaDestaque(ctx, pecaTruncarTexto(dados.solucao, 130), PECA_GREEN, y, 36)

  pecaRodapeAtribuicao(ctx, dados.curso, dados.coordenador)
}

function desenharEncerramentoPeca(ctx, dados) {
  pecaFundoBase(ctx, 'rgba(255,255,255,0.85)', dados.foto)
  pecaLogoCard(ctx, 60, 60, dados.logo)
  pecaSeloTopo(ctx, 'RESULTADO DA CPA', 60, 170)

  ctx.fillStyle = PECA_WHITE
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '800 50px Poppins'
  let y = 420
  const n = dados.totalItens || 1
  const tituloResumo = n === 1 ? '1 ação já em andamento pro seu curso.' : n + ' ações já em andamento pro seu curso.'
  pecaQuebrarTexto(ctx, tituloResumo, 940).forEach((l) => { ctx.fillText(l, 60, y); y += 58 })

  y += 30
  ctx.fillStyle = '#DCE7F5'
  ctx.font = '600 34px "Work Sans"'
  pecaQuebrarTexto(ctx, 'Esse plano passa pela Coordenação, pela CPA e pela Direção da Faculdade — sua opinião muda a faculdade de verdade.', 940)
    .forEach((l) => { ctx.fillText(l, 60, y); y += 46 })

  y += 40
  ctx.fillStyle = PECA_GREEN
  ctx.font = '800 42px Poppins'
  ctx.fillText('Seu sonho, nossa meta!', 60, y)

  pecaRodapeAtribuicao(ctx, dados.curso, dados.coordenador)
}

// Gera as telas da peça. Lança Error com a mensagem do antigo se não conseguir carregar imagens/fontes.
export async function gerarPeca({ curso, coordenador, itens }) {
  if (!itens || !itens.length) throw new Error('Selecione pelo menos 1 plano de ação pra gerar a peça.')
  if (itens.length > PECA_MAX_ITENS) throw new Error('Você pode escolher até 3 planos por peça.')
  try {
    if (!IMG_LOGO) IMG_LOGO = await pecaCarregarImagem('/logo-unifecaf.png')
    if (!IMG_FOTO) IMG_FOTO = await pecaCarregarImagem('/campus.jpg')
    await carregarFontes()
    await document.fonts.load('800 64px Poppins')
    await document.fonts.load('700 26px Poppins')
    await document.fonts.load('600 40px "Work Sans"')
    await document.fonts.load('500 24px "Work Sans"')
    await document.fonts.ready
  } catch (e) {
    console.error('Erro ao carregar imagens/fontes da peça:', e)
    throw new Error('Não foi possível carregar os recursos da peça agora. Tente de novo em alguns segundos.', { cause: e })
  }

  const dadosBase = { curso, coordenador, foto: IMG_FOTO, logo: IMG_LOGO }
  const telas = [{ nome: 'capa', desenhar: (ctx) => desenharCapaPeca(ctx, dadosBase) }]
  itens.forEach((it, idx) => {
    telas.push({ nome: 'item-' + (idx + 1), desenhar: (ctx) => desenharItemPeca(ctx, { ...dadosBase, problema: it.problema, solucao: it.solucao || '' }) })
  })
  telas.push({ nome: 'encerramento', desenhar: (ctx) => desenharEncerramentoPeca(ctx, { ...dadosBase, totalItens: itens.length }) })

  return telas.map((t) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1350
    t.desenhar(canvas.getContext('2d'))
    return { nome: t.nome, canvas }
  })
}

export function baixarTela(canvas, nomeArquivo) {
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  a.remove()
}
