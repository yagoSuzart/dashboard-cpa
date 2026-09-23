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
  const id = context.env.DRIVE_FILE_ID
  if (!id) return new Response('DRIVE_FILE_ID não configurado', { status: 404 })

  const cache = caches.default
  const cacheKey = new Request(`https://cache.cpa/planilha/${id}`)
  const hit = await cache.match(cacheKey)
  if (hit && !new URL(context.request.url).searchParams.has('atualizar')) {
    return new Response(hit.body, { headers: { ...Object.fromEntries(hit.headers), 'cache-control': 'private, no-store' } })
  }

  const urls = [
    `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`,
    `https://drive.google.com/uc?export=download&id=${id}`,
  ]
  for (const url of urls) {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) continue
    const buf = await res.arrayBuffer()
    const b = new Uint8Array(buf, 0, 2)
    if (b[0] !== 0x50 || b[1] !== 0x4b) continue // não é .xlsx (ex.: página de login do Google)
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
  return new Response('Não foi possível baixar a planilha do Drive. Confira o compartilhamento do arquivo.', {
    status: 502,
  })
}
