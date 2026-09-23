// Utilitários das funções (Cloudflare Pages Functions).
// A identidade vem do Cloudflare Access: o token JWT enviado no cabeçalho
// Cf-Access-Jwt-Assertion é verificado com as chaves públicas da sua equipe
// Zero Trust — nunca confiamos só no e-mail informado pelo navegador.

export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  })

const lista = (s) =>
  String(s || '')
    .split(/[,;\s]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)

// NOMES="email1=Pró-Reitora Acadêmica;email2=Coordenadora da CPA"
export function nomeDe(env, email) {
  for (const par of String(env.NOMES || '').split(';')) {
    const [e, n] = par.split('=')
    if (e && n && e.trim().toLowerCase() === email) return n.trim()
  }
  return email.split('@')[0]
}

export const isAdmin = (env, email) => lista(env.ADMIN_EMAILS).includes(email)

const b64urlToBytes = (s) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
  return Uint8Array.from(b, (c) => c.charCodeAt(0))
}

let certCache = { at: 0, keys: [] }
async function chavesAccess(team) {
  if (Date.now() - certCache.at < 10 * 60 * 1000 && certCache.keys.length) return certCache.keys
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`)
  if (!res.ok) throw new Error('Não foi possível obter as chaves do Cloudflare Access')
  certCache = { at: Date.now(), keys: (await res.json()).keys || [] }
  return certCache.keys
}

function lerCookie(request, nome) {
  const c = request.headers.get('cookie') || ''
  const m = c.match(new RegExp('(?:^|;\\s*)' + nome + '=([^;]+)'))
  return m ? m[1] : null
}

export async function usuario(request, env) {
  const team = String(env.ACCESS_TEAM_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (!team || !env.ACCESS_AUD) return null
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || lerCookie(request, 'CF_Authorization')
  if (!token) return null
  const partes = token.split('.')
  if (partes.length !== 3) return null
  try {
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(partes[0])))
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(partes[1])))
    const jwk = (await chavesAccess(team)).find((k) => k.kid === header.kid)
    if (!jwk || header.alg !== 'RS256') return null
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      b64urlToBytes(partes[2]),
      new TextEncoder().encode(partes[0] + '.' + partes[1]),
    )
    if (!ok) return null
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!aud.includes(env.ACCESS_AUD)) return null
    if (payload.iss !== `https://${team}`) return null
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    const email = String(payload.email || '').toLowerCase()
    if (!email) return null
    // Camada extra: se ALLOWED_EMAILS estiver definido, só esses e-mails entram.
    const permitidos = lista(env.ALLOWED_EMAILS)
    if (permitidos.length && !permitidos.includes(email) && !isAdmin(env, email)) return null
    return { email, nome: nomeDe(env, email), admin: isAdmin(env, email) }
  } catch {
    return null
  }
}

export const accessConfigurado = (env) => Boolean(env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD && env.CPA_KV)

export async function exigirUsuario(context) {
  const u = await usuario(context.request, context.env)
  if (!u) return { erro: json({ erro: 'Não autenticado' }, 401) }
  return { u }
}
