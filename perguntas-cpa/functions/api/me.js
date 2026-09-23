import { json, exigirUsuario, accessConfigurado } from '../../server/lib.js'

export async function onRequestGet(context) {
  // Sem Cloudflare Access configurado, o app abre em modo demonstração.
  if (!accessConfigurado(context.env)) return json({ configurado: false }, 503)
  const { u, erro } = await exigirUsuario(context)
  if (erro) return erro
  return json(u)
}
