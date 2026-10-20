// Feedback para os alunos: carrossel 1080x1350 (Instagram/WhatsApp) no mesmo estilo das peças da CPA no LinkedIn —
// capa com a foto do campus, uma tela clara por ação, tela de "ponto forte" para as devolutivas sem pontos a melhorar
// e encerramento escuro. Gerado no navegador (Canvas2D), com as fontes do Portal (Poppins, Roboto Condensed e
// IBM Plex Mono).
//
// Uso:
//   const telas = await gerarPeca({ curso, modalidade, coordenador, itens: [{ tipo: 'plano' | 'forte', questionario,
//     titulo, descricao, prazo, status }] })
//   → [{ nome: 'capa' | 'acao-1' | 'forte-1' | ... | 'encerramento', canvas: HTMLCanvasElement }]

export const PECA_MAX_ITENS = 6

const W = 1080
const H = 1350
const P = 80
const C = {
  navy: '#1a3666', deep: '#002156', blue: '#0e77cc', green: '#17a460', mint: '#9fe0b8', cyan: '#00b1d2',
  paper: '#f4f6f9', ink: '#14223a', muted: '#5b6b7f', soft: '#cfdbea', branco: '#ffffff', cinza: '#e9edf3',
}
const F = {
  titulo: (px, peso = 700) => `${peso} ${px}px Poppins`,
  texto: (px, peso = 400) => `${peso} ${px}px "Roboto Condensed"`,
  mono: (px, peso = 600) => `${peso} ${px}px "IBM Plex Mono"`,
}

const imagens = {}
function carregarImagem(src) {
  if (imagens[src]) return imagens[src]
  imagens[src] = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
  return imagens[src]
}

// ---------- texto ----------
function espacamento(ctx, em, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = em ? `${(em * px).toFixed(1)}px` : '0px'
}
function quebrar(ctx, texto, largura) {
  const linhas = []
  for (const paragrafo of String(texto || '').split('\n')) {
    let atual = ''
    for (const p of paragrafo.split(/\s+/).filter(Boolean)) {
      const teste = atual ? atual + ' ' + p : p
      if (ctx.measureText(teste).width > largura && atual) {
        linhas.push(atual)
        atual = p
      } else atual = teste
    }
    linhas.push(atual)
  }
  return linhas
}
// Quebra e limita a N linhas, com reticências na última
function linhasAte(ctx, texto, largura, max) {
  const ls = quebrar(ctx, texto, largura).filter((l, i, a) => l || (i > 0 && i < a.length - 1))
  if (ls.length <= max) return ls
  const corte = ls.slice(0, max)
  let ult = corte[max - 1]
  while (ult && ctx.measureText(ult + '…').width > largura) ult = ult.replace(/\s*\S+$/, '')
  corte[max - 1] = ult + '…'
  return corte
}
// Maior fonte (de inicio até minimo) em que o texto cabe em até maxLinhas
function ajustar(ctx, texto, largura, maxLinhas, inicio, minimo, fonte) {
  for (let px = inicio; px >= minimo; px -= 2) {
    ctx.font = fonte(px)
    const ls = quebrar(ctx, texto, largura)
    if (ls.length <= maxLinhas) return { px, linhas: ls }
  }
  ctx.font = fonte(minimo)
  return { px: minimo, linhas: linhasAte(ctx, texto, largura, maxLinhas) }
}
// Maior fonte em que o texto cabe inteiro numa área (largura x altura); entrelinha = fator x fonte
function caberNaArea(ctx, texto, largura, altura, inicio, minimo, fonte, fator = 1.4) {
  for (let px = inicio; px >= minimo; px -= 1) {
    ctx.font = fonte(px)
    const ls = quebrar(ctx, texto, largura)
    if (ls.length * px * fator <= altura) return { px, lh: Math.round(px * fator), linhas: ls }
  }
  ctx.font = fonte(minimo)
  const lh = Math.round(minimo * fator)
  return { px: minimo, lh, linhas: linhasAte(ctx, texto, largura, Math.max(1, Math.floor(altura / lh))) }
}
function escrever(ctx, linhas, x, y, alturaLinha) {
  linhas.forEach((l, i) => ctx.fillText(l, x, y + i * alturaLinha))
  return y + linhas.length * alturaLinha
}

// ---------- formas ----------
function caixa(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.stroke()
  }
}
function pilula(ctx, texto, x, y, { fundo, borda, cor = C.branco, destaque, alinhar = 'esq' } = {}) {
  ctx.font = F.mono(20)
  espacamento(ctx, 0.12, 20)
  const partes = destaque ? texto.split(destaque) : [texto]
  const larg = ctx.measureText(texto).width + 48
  const x0 = alinhar === 'dir' ? x - larg : x
  caixa(ctx, x0, y, larg, 54, 27, fundo, borda)
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  let cx = x0 + 24
  partes.forEach((p, i) => {
    ctx.fillStyle = cor
    ctx.fillText(p, cx, y + 28)
    cx += ctx.measureText(p).width
    if (i < partes.length - 1) {
      ctx.fillStyle = C.mint
      ctx.fillText(destaque, cx, y + 28)
      cx += ctx.measureText(destaque).width
    }
  })
  espacamento(ctx, 0, 20)
  ctx.textBaseline = 'alphabetic'
}
function logo(ctx, img, x, y, largura, alinhar = 'esq') {
  if (!img) return
  const h = largura * (img.height / img.width)
  ctx.drawImage(img, alinhar === 'dir' ? x - largura : x, y, largura, h)
}
function barraCores(ctx) {
  const g = ctx.createLinearGradient(0, 0, W, 0)
  g.addColorStop(0, C.blue); g.addColorStop(0.45, C.blue); g.addColorStop(0.45, C.green)
  g.addColorStop(0.75, C.green); g.addColorStop(0.75, C.cyan); g.addColorStop(1, C.cyan)
  ctx.fillStyle = g
  ctx.fillRect(0, H - 8, W, 8)
}
function rodape(ctx, esquerda, direita, { cor, corDireita } = {}) {
  ctx.font = F.mono(19)
  espacamento(ctx, 0.1, 19)
  ctx.textBaseline = 'alphabetic'
  ctx.globalAlpha = 0.75
  ctx.fillStyle = cor
  ctx.textAlign = 'left'
  ctx.fillText(esquerda.toUpperCase(), P, H - 46)
  ctx.fillStyle = corDireita || cor
  ctx.textAlign = 'right'
  ctx.fillText(direita.toUpperCase(), W - P, H - 46)
  ctx.globalAlpha = 1
  ctx.textAlign = 'left'
  espacamento(ctx, 0, 19)
}
function eyebrow(ctx, texto, x, y, cor) {
  ctx.font = F.mono(22)
  espacamento(ctx, 0.16, 22)
  ctx.fillStyle = cor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(texto.toUpperCase(), x, y)
  espacamento(ctx, 0, 22)
}
function fundoEscuro(ctx) {
  ctx.fillStyle = C.deep
  ctx.fillRect(0, 0, W, H)
  const g = ctx.createRadialGradient(W * 0.85, -H * 0.1, 0, W * 0.85, -H * 0.1, 1200)
  g.addColorStop(0, '#12407d')
  g.addColorStop(1, 'rgba(0,33,86,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}
function circuloNumero(ctx, n, cx, cy, r, fundo, cor = C.branco) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = fundo
  ctx.fill()
  ctx.fillStyle = cor
  ctx.font = F.titulo(Math.round(r * 0.9))
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(n), cx, cy + 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

const dataBR = (s) => {
  if (!s) return ''
  const d = new Date(s + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

// ---------- telas ----------
function capa(ctx, d) {
  ctx.fillStyle = C.deep
  ctx.fillRect(0, 0, W, H)
  if (d.foto) {
    const e = Math.max(W / d.foto.width, H / d.foto.height)
    ctx.globalAlpha = 0.62
    ctx.drawImage(d.foto, (W - d.foto.width * e) / 2, (H - d.foto.height * e) / 2, d.foto.width * e, d.foto.height * e)
    ctx.globalAlpha = 1
  }
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, 'rgba(0,33,86,.25)'); g.addColorStop(0.4, 'rgba(0,33,86,.55)'); g.addColorStop(0.78, 'rgba(0,33,86,.96)'); g.addColorStop(1, 'rgba(0,33,86,.98)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  logo(ctx, d.logoBranco, P, P, 230)
  pilula(ctx, 'RESULTADO DA CPA', W - P, P + 4, { fundo: 'rgba(255,255,255,.12)', borda: 'rgba(255,255,255,.25)', alinhar: 'dir' })

  // Passos na base; o texto sobe a partir deles
  const yPassos = H - 96 - 190
  const passos = [['Você respondeu', 'a avaliação da CPA'], ['A coordenação', 'analisou cada resposta'], ['Virou plano', 'de ação no seu curso']]
  const wP = (W - 2 * P - 32) / 3
  passos.forEach(([b, s], i) => {
    const x = P + i * (wP + 16)
    caixa(ctx, x, yPassos, wP, 190, 24, 'rgba(255,255,255,.10)', 'rgba(255,255,255,.22)')
    circuloNumero(ctx, i + 1, x + 50, yPassos + 52, 26, [C.blue, C.green, C.mint][i], i === 2 ? C.deep : C.branco)
    ctx.fillStyle = C.branco
    ctx.font = F.titulo(27)
    ctx.fillText(b, x + 24, yPassos + 120)
    ctx.fillStyle = '#d5dfec'
    ctx.font = F.texto(22)
    ctx.fillText(s, x + 24, yPassos + 154)
  })

  // Bloco de texto alinhado por baixo, acima dos passos
  ctx.font = F.texto(36)
  const sub = linhasAte(ctx, `Veja o que o curso de ${d.curso} (${d.modalidade}) está fazendo a partir das respostas de vocês.`, W - 2 * P, 3)
  const t = ajustar(ctx, 'Sua voz virou plano de ação.', W - 2 * P, 2, 108, 84, (px) => F.titulo(px))
  const lhT = Math.round(t.px * 1.02)
  const lhS = 50
  const altura = 22 + 44 + t.linhas.length * lhT + 24 + sub.length * lhS
  let y = yPassos - 64 - altura
  eyebrow(ctx, 'Você falou · a gente ouviu', P, y + 22, C.mint)
  y += 22 + 44
  ctx.fillStyle = C.branco
  ctx.font = F.titulo(t.px)
  espacamento(ctx, -0.02, t.px)
  t.linhas.forEach((l, i) => ctx.fillText(l, P, y + Math.round(t.px * 0.82) + i * lhT))
  espacamento(ctx, 0, t.px)
  y += t.linhas.length * lhT + 24
  ctx.fillStyle = '#e3eaf3'
  ctx.font = F.texto(36)
  sub.forEach((l, i) => ctx.fillText(l, P, y + 36 + i * lhS))

  rodape(ctx, 'CPA UniFECAF', 'Deslize →', { cor: C.branco, corDireita: C.mint })
  barraCores(ctx)
}

function acao(ctx, d, it, n, total) {
  ctx.fillStyle = C.paper
  ctx.fillRect(0, 0, W, H)
  pilula(ctx, `AÇÃO ${n} DE ${total}`, P, P, { fundo: C.navy, destaque: String(n) })
  logo(ctx, d.logoCor, W - P, P - 4, 200, 'dir')

  let y = 228
  eyebrow(ctx, it.questionario || 'Plano de ação', P, y, C.green)
  y += 30
  const t = ajustar(ctx, it.titulo, W - 2 * P, 3, 72, 50, (px) => F.titulo(px))
  ctx.fillStyle = C.navy
  ctx.font = F.titulo(t.px)
  espacamento(ctx, -0.02, t.px)
  y = escrever(ctx, t.linhas, P, y + t.px * 0.9, Math.round(t.px * 1.06))
  espacamento(ctx, 0, t.px)

  // Cards da base (prazo / situação)
  const hBase = 156
  const yBase = H - 110 - hBase
  const cards = [
    ...(it.prazo ? [['PRAZO', dataBR(it.prazo), C.navy]] : []),
    ['SITUAÇÃO', it.status === 'concluido' ? '✓ Concluído' : '✓ Em andamento', C.green],
  ]
  const wC = (W - 2 * P - (cards.length - 1) * 24) / cards.length
  cards.forEach(([r, v, cor], i) => {
    const x = P + i * (wC + 24)
    ctx.save()
    ctx.shadowColor = 'rgba(20,45,80,.10)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 10
    caixa(ctx, x, yBase, wC, hBase, 28, C.branco)
    ctx.restore()
    eyebrow(ctx, r, x + 36, yBase + 52, C.muted)
    const vv = ajustar(ctx, v, wC - 72, 1, 40, 26, (px) => F.titulo(px))
    ctx.fillStyle = cor
    ctx.font = F.titulo(vv.px)
    ctx.fillText(vv.linhas[0], x + 36, yBase + 112)
  })

  // Card azul-marinho com o que será feito, ocupando o espaço do meio
  const yCard = y + 40
  const hCard = yBase - 32 - yCard
  caixa(ctx, P, yCard, W - 2 * P, hCard, 32, C.navy)
  eyebrow(ctx, 'O que vamos fazer', P + 48, yCard + 74, C.mint)
  const txt = caberNaArea(ctx, it.descricao || it.titulo, W - 2 * P - 96 - 52, hCard - 150, 46, 22, (px) => F.texto(px), 1.36)
  const y1 = yCard + 112 + txt.px
  ctx.fillStyle = C.mint
  ctx.font = F.titulo(Math.round(txt.px * 0.95))
  ctx.fillText('✓', P + 48, y1)
  ctx.fillStyle = C.branco
  ctx.font = F.texto(txt.px)
  escrever(ctx, txt.linhas, P + 48 + 52, y1, txt.lh)

  rodape(ctx, 'CPA UniFECAF', `${d.curso} · ${d.modalidade}`, { cor: C.muted })
}

function forte(ctx, d, it) {
  fundoEscuro(ctx)
  pilula(ctx, 'PONTO FORTE', P, P, { fundo: 'rgba(255,255,255,.12)', borda: 'rgba(255,255,255,.25)' })
  logo(ctx, d.logoBranco, W - P, P - 4, 210, 'dir')
  let y = 250
  eyebrow(ctx, it.questionario || 'Ponto forte', P, y, C.mint)
  y += 30
  const t = ajustar(ctx, 'Aqui, vocês aprovaram o curso.', W - 2 * P, 2, 80, 56, (px) => F.titulo(px))
  ctx.fillStyle = C.branco
  ctx.font = F.titulo(t.px)
  espacamento(ctx, -0.02, t.px)
  y = escrever(ctx, t.linhas, P, y + t.px * 0.9, Math.round(t.px * 1.06))
  espacamento(ctx, 0, t.px)

  const yCard = y + 40
  const hCard = H - 130 - yCard
  caixa(ctx, P, yCard, W - 2 * P, hCard, 28, 'rgba(159,224,184,.10)', 'rgba(159,224,184,.35)')
  ctx.fillStyle = C.mint
  ctx.fillRect(P, yCard + 28, 8, hCard - 56)
  const txt = caberNaArea(ctx, it.descricao, W - 2 * P - 110, hCard - 100, 36, 22, (px) => F.texto(px), 1.38)
  ctx.fillStyle = '#e3eaf3'
  ctx.font = F.texto(txt.px)
  escrever(ctx, txt.linhas, P + 56, yCard + 50 + txt.px, txt.lh)

  rodape(ctx, 'CPA UniFECAF', `${d.curso} · ${d.modalidade}`, { cor: C.branco })
  barraCores(ctx)
}

function encerramento(ctx, d) {
  fundoEscuro(ctx)
  pilula(ctx, 'RESULTADO DA CPA', P, P, { fundo: 'rgba(255,255,255,.12)', borda: 'rgba(255,255,255,.25)' })
  logo(ctx, d.logoBranco, W - P, P - 4, 210, 'dir')

  let y = 236
  ;[C.mint, 'rgba(159,224,184,.35)', 'rgba(159,224,184,.35)'].forEach((cor, i) => {
    ctx.beginPath()
    ctx.arc(P + 10 + i * 30, y - 8, 9, 0, Math.PI * 2)
    ctx.fillStyle = cor
    ctx.fill()
  })
  eyebrow(ctx, 'Obrigado por participar', P + 110, y, C.mint)
  y += 30
  const t = ajustar(ctx, 'Sua resposta muda o curso.', W - 2 * P, 2, 92, 64, (px) => F.titulo(px))
  ctx.fillStyle = C.branco
  ctx.font = F.titulo(t.px)
  espacamento(ctx, -0.02, t.px)
  y = escrever(ctx, t.linhas, P, y + t.px * 0.9, Math.round(t.px * 1.04))
  espacamento(ctx, 0, t.px)

  const n = d.totalAcoes
  const lead = n
    ? `${n === 1 ? '1 ação está' : n + ' ações estão'} em andamento em ${d.curso} (${d.modalidade}). E cada plano segue um caminho até virar realidade:`
    : `As respostas de vocês sobre ${d.curso} (${d.modalidade}) foram analisadas uma a uma. E cada plano segue um caminho até virar realidade:`
  ctx.font = F.texto(31)
  ctx.fillStyle = C.soft
  y = escrever(ctx, linhasAte(ctx, lead, W - 2 * P, 3), P, y + 20, 44)

  const passos = [['Coordenação', 'escreve o plano a partir das respostas', C.blue], ['CPA', 'analisa se o plano responde ao que vocês apontaram', C.cyan], ['Pró-Reitoria', 'aprova e acompanha até a conclusão', C.green]]
  y += 24
  passos.forEach(([b, s, cor], i) => {
    caixa(ctx, P, y, W - 2 * P, 116, 26, 'rgba(255,255,255,.07)', 'rgba(255,255,255,.14)')
    circuloNumero(ctx, i + 1, P + 28 + 38, y + 58, 38, cor)
    ctx.fillStyle = C.branco
    ctx.font = F.titulo(31)
    ctx.fillText(b, P + 136, y + 50)
    ctx.fillStyle = C.soft
    ctx.font = F.texto(25)
    ctx.fillText(s, P + 136, y + 88)
    y += 132
  })

  y += 20
  ctx.font = F.titulo(34)
  const frase = 'Seu sonho, nossa meta!'
  const wF = ctx.measureText(frase).width + 72
  caixa(ctx, P, y, wF, 84, 42, C.mint)
  ctx.fillStyle = C.deep
  ctx.textBaseline = 'middle'
  ctx.fillText(frase, P + 36, y + 44)
  ctx.textBaseline = 'alphabetic'

  rodape(ctx, 'CPA UniFECAF', `Coordenação: ${d.coordenador}`, { cor: C.branco })
  barraCores(ctx)
}

export async function gerarPeca({ curso, modalidade = '', coordenador, itens }) {
  if (!itens || !itens.length) throw new Error('Selecione pelo menos 1 item para montar o feedback.')
  if (itens.length > PECA_MAX_ITENS) throw new Error(`Você pode escolher até ${PECA_MAX_ITENS} itens por feedback.`)
  let foto, logoCor, logoBranco
  try {
    ;[foto, logoCor, logoBranco] = await Promise.all([carregarImagem('/campus.jpg'), carregarImagem('/logo-unifecaf.png'), carregarImagem('/logo-unifecaf-branco.png')])
    await Promise.all([
      document.fonts.load(F.titulo(80)), document.fonts.load(F.texto(34)), document.fonts.load(F.texto(34, 600)), document.fonts.load(F.mono(22)),
    ])
    await document.fonts.ready
  } catch (e) {
    console.error('Erro ao carregar imagens/fontes do feedback:', e)
    throw new Error('Não foi possível carregar as imagens do feedback agora. Tente de novo em alguns segundos.', { cause: e })
  }

  const acoes = itens.filter((it) => it.tipo !== 'forte')
  const d = { curso, modalidade, coordenador, foto, logoCor, logoBranco, totalAcoes: acoes.length }
  const telas = [{ nome: 'capa', desenhar: (ctx) => capa(ctx, d) }]
  let na = 0
  let nf = 0
  for (const it of itens) {
    if (it.tipo === 'forte') {
      nf += 1
      telas.push({ nome: 'forte-' + nf, desenhar: (ctx) => forte(ctx, d, it) })
    } else {
      na += 1
      const n = na
      telas.push({ nome: 'acao-' + n, desenhar: (ctx) => acao(ctx, d, it, n, acoes.length) })
    }
  }
  telas.push({ nome: 'encerramento', desenhar: (ctx) => encerramento(ctx, d) })

  return telas.map((t) => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
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
