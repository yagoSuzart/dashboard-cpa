// Sessão e armazenamento.
// Modo "nuvem": o site fica atrás do Cloudflare Access (login por e-mail com código,
// sem senha) e as escolhas de cada pessoa ficam no Cloudflare KV, separadas por e-mail.
// Modo "demonstração": sem backend (ex.: rodando local ou no Netlify sem funções) —
// as escolhas ficam só no navegador.
import { readWorkbook } from './xlsx.js'
import { buildModel } from './model.js'

const DEMO_KEY = 'cpa-demo-email'
const vazio = () => ({ decisoes: {}, sugestoes: [], atualizadoEm: null })

async function getJson(url, opts) {
  const res = await fetch(url, { credentials: 'same-origin', ...opts })
  const type = res.headers.get('content-type') || ''
  if (!res.ok || !type.includes('application/json')) {
    const err = new Error(`HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export async function carregarSessao() {
  try {
    const me = await getJson('/api/me')
    return { ...me, modo: 'nuvem' }
  } catch (e) {
    if (e.status === 401 || e.status === 403) return { modo: 'negado' }
    let email = null
    try {
      email = localStorage.getItem(DEMO_KEY)
    } catch {
      /* navegador sem armazenamento */
    }
    return { modo: 'demo', email, nome: email ? email.split('@')[0] : null, admin: true }
  }
}

export function entrarDemo(email) {
  try {
    localStorage.setItem(DEMO_KEY, email)
  } catch {
    /* ignora */
  }
  return { modo: 'demo', email, nome: email.split('@')[0], admin: true }
}

export function sairDemo() {
  try {
    localStorage.removeItem(DEMO_KEY)
  } catch {
    /* ignora */
  }
}

const demoKey = (email) => 'cpa-demo-sel:' + email

export async function carregarSelecoes(sessao) {
  if (sessao.modo === 'nuvem') {
    const data = await getJson('/api/selecoes')
    return { ...vazio(), ...data }
  }
  try {
    return { ...vazio(), ...JSON.parse(localStorage.getItem(demoKey(sessao.email)) || '{}') }
  } catch {
    return vazio()
  }
}

export async function salvarSelecoes(sessao, sel) {
  const body = { ...sel, atualizadoEm: new Date().toISOString() }
  if (sessao.modo === 'nuvem') {
    return getJson('/api/selecoes', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }
  localStorage.setItem(demoKey(sessao.email), JSON.stringify(body))
  return body
}

// Visão consolidada (só administradores). No modo demo, lê todos os e-mails deste navegador.
export async function carregarConsolidado(sessao) {
  if (sessao.modo === 'nuvem') return getJson('/api/consolidado')
  const pessoas = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k.startsWith('cpa-demo-sel:')) continue
    const email = k.slice('cpa-demo-sel:'.length)
    try {
      pessoas.push({ email, nome: email.split('@')[0], ...vazio(), ...JSON.parse(localStorage.getItem(k)) })
    } catch {
      /* ignora registro inválido */
    }
  }
  return { pessoas }
}

// Planilha: tenta a versão ao vivo do Google Drive (via função /api/planilha);
// se não houver, usa a cópia publicada junto com o site.
export async function carregarPlanilha(forcar = false) {
  const tentativas = [
    { url: forcar ? '/api/planilha?atualizar=1' : '/api/planilha', fonte: 'Google Drive (ao vivo)' },
    { url: '/planilha.xlsx', fonte: 'Cópia publicada com o site' },
  ]
  let ultimoErro
  for (const t of tentativas) {
    try {
      const res = await fetch(t.url, { credentials: 'same-origin', cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = await res.arrayBuffer()
      const b = new Uint8Array(buf, 0, 2)
      if (b[0] !== 0x50 || b[1] !== 0x4b) throw new Error('Resposta não é um arquivo .xlsx')
      const model = buildModel(readWorkbook(buf))
      return { model, fonte: t.fonte, carregadoEm: new Date(), atualizadoDrive: res.headers.get('x-planilha-data') }
    } catch (e) {
      ultimoErro = e
    }
  }
  throw ultimoErro
}
