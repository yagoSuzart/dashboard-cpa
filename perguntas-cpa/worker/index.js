// Ponto de entrada para publicar como Cloudflare Worker (Workers + arquivos estáticos).
// Reaproveita as mesmas funções da pasta functions/api (formato Pages Functions):
// /api/* passa por aqui; o resto é o site (pasta dist), servido pelo binding ASSETS.
import * as me from '../functions/api/me.js'
import * as selecoes from '../functions/api/selecoes.js'
import * as consolidado from '../functions/api/consolidado.js'
import * as planilha from '../functions/api/planilha.js'

const ROTAS = {
  '/api/me': me,
  '/api/selecoes': selecoes,
  '/api/consolidado': consolidado,
  '/api/planilha': planilha,
}

const metodo = (m) => 'onRequest' + m.charAt(0) + m.slice(1).toLowerCase()

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) {
      const mod = ROTAS[url.pathname]
      if (!mod) return new Response('Não encontrado', { status: 404 })
      const handler = mod[metodo(request.method)] || mod.onRequest
      if (!handler) return new Response('Método não permitido', { status: 405 })
      return handler({ request, env, waitUntil: (p) => ctx.waitUntil(p) })
    }
    return env.ASSETS.fetch(request)
  },
}
