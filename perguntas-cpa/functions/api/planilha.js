import { exigirUsuario, accessConfigurado } from '../../server/lib.js'

// Baixa a planilha do Google Drive (arquivo compartilhado como "Qualquer pessoa com o link")
// e entrega o .xlsx para o app. Fica em cache por alguns minutos para não sobrecarregar o Drive.
const CACHE_SEGUNDOS = 120

export async function onRequestGet(context) {
  // Com o login configurado, só quem entrou pode baixar a planilha.
  if (accessConfigurado(context.env)) {
    const { erro } = await exigirUsuario(context)
    if (erro) return erro
  }
  const id = extrairId(context.env.DRIVE_FILE_ID)
  if (!id) return new Response('DRIVE_FILE_ID não configurado', { status: 404 })

  const cache = caches.default
  const cacheKey = new Request(`https://cache.cpa/planilha/${id}`)
  const hit = await cache.match(cacheKey)
  if (hit && !new URL(context.request.url).searchParams.has('atualizar')) {
    return new Response(hit.body, { headers: { ...Object.fromEntries(hit.headers), 'cache-control': 'private, no-store' } })
  }

  // .xlsx enviado ao Drive → drive.usercontent (confirm=t pula o aviso de antivírus);
  // planilha nativa do Google Sheets → docs.google.com/export.
  const urls = [
    `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${id}`,
    `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`,
  ]
  const tentativas = []
  for (const url of urls) {
    let res
    try {
      res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (Perguntas-CPA)' } })
    } catch (e) {
      tentativas.push(`${new URL(url).host}: ${e.message}`)
      continue
    }
    if (!res.ok) {
      tentativas.push(`${new URL(url).host}: HTTP ${res.status}`)
      continue
    }
    const buf = await res.arrayBuffer()
    const b = new Uint8Array(buf, 0, Math.min(2, buf.byteLength))
    if (b[0] !== 0x50 || b[1] !== 0x4b) {
      // não é .xlsx (ex.: página de login ou de aviso do Google)
      tentativas.push(`${new URL(url).host}: resposta não é .xlsx (${res.headers.get('content-type') || 'sem tipo'})`)
      continue
    }
    const headers = {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'x-planilha-data': new Date().toISOString(),
    }
    // cópia para o cache interno do Cloudflare (não é o cache do navegador)
    context.waitUntil(
      cache.put(cacheKey, new Response(buf.slice(0), { headers: { ...headers, 'cache-control': `public, max-age=${CACHE_SEGUNDOS}` } })),
    )
    return new Response(buf, { headers: { ...headers, 'cache-control': 'private, no-store' } })
  }
  return new Response(
    `Não foi possível baixar a planilha do Drive. Confira o compartilhamento do arquivo.\n\nID usado: ${id}\n${tentativas.join('\n')}`,
    { status: 502, headers: { 'content-type': 'text/plain; charset=utf-8' } },
  )
}

// Aceita o ID puro ou o link inteiro do Drive/Sheets colado na variável.
function extrairId(valor) {
  const v = (valor || '').trim()
  const m = v.match(/\/d\/([\w-]{20,})/) || v.match(/[?&]id=([\w-]{20,})/)
  return m ? m[1] : v
}
