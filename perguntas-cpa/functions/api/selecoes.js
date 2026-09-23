import { json, exigirUsuario } from '../../server/lib.js'

// Cada pessoa lê e grava só o próprio registro (chave = e-mail verificado).
const chave = (email) => 'sel:' + email

export async function onRequestGet(context) {
  const { u, erro } = await exigirUsuario(context)
  if (erro) return erro
  const data = await context.env.CPA_KV.get(chave(u.email), 'json')
  return json(data || { decisoes: {}, sugestoes: [], atualizadoEm: null })
}

export async function onRequestPut(context) {
  const { u, erro } = await exigirUsuario(context)
  if (erro) return erro
  const texto = await context.request.text()
  if (texto.length > 300_000) return json({ erro: 'Conteúdo grande demais' }, 413)
  let body
  try {
    body = JSON.parse(texto)
  } catch {
    return json({ erro: 'JSON inválido' }, 400)
  }
  const decisoes = {}
  for (const [id, d] of Object.entries(body.decisoes || {})) {
    if (!/^[a-z0-9]{1,20}$/.test(id) || !d) continue
    const status = ['sim', 'talvez', 'nao'].includes(d.status) ? d.status : null
    const nota = String(d.nota || '').slice(0, 2000)
    const texto = String(d.texto || '').slice(0, 1000)
    if (!status && !nota && !texto) continue
    decisoes[id] = { status, nota, texto, em: String(d.em || '').slice(0, 40) }
  }
  const sugestoes = (Array.isArray(body.sugestoes) ? body.sugestoes : []).slice(0, 200).map((s) => ({
    id: String(s.id || '').slice(0, 20),
    text: String(s.text || '').slice(0, 1000),
    dim: Number(s.dim) >= 1 && Number(s.dim) <= 10 ? Number(s.dim) : null,
    tipo: String(s.tipo || '').slice(0, 80),
    status: ['sim', 'talvez', 'nao'].includes(s.status) ? s.status : 'sim',
    nota: String(s.nota || '').slice(0, 2000),
  }))
  const registro = { email: u.email, nome: u.nome, decisoes, sugestoes, atualizadoEm: new Date().toISOString() }
  await context.env.CPA_KV.put(chave(u.email), JSON.stringify(registro))
  return json(registro)
}
