import { json, exigirUsuario } from '../../server/lib.js'

// Visão de todas as pessoas — só para os e-mails em ADMIN_EMAILS.
export async function onRequestGet(context) {
  const { u, erro } = await exigirUsuario(context)
  if (erro) return erro
  if (!u.admin) return json({ erro: 'Acesso restrito à administração' }, 403)
  const pessoas = []
  let cursor
  do {
    const page = await context.env.CPA_KV.list({ prefix: 'sel:', cursor })
    for (const k of page.keys) {
      const reg = await context.env.CPA_KV.get(k.name, 'json')
      if (reg) pessoas.push(reg)
    }
    cursor = page.list_complete ? null : page.cursor
  } while (cursor)
  return json({ pessoas })
}
