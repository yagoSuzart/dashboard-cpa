// Navegação por "#/rota" (funciona em qualquer hospedagem estática, sem servidor).

export interface Migalha {
  rotulo: string
  href?: string
}

export interface Contexto {
  /** Parâmetros da rota, ex.: #/cursos/:id → { id } */
  params: Record<string, string>
  /** Falso quando o usuário já foi para outra tela (evita desenhar resultado atrasado). */
  ativo: () => boolean
  /** Acrescenta itens ao breadcrumb (ex.: nome do curso depois de carregar). */
  migalhas: (extra: Migalha[]) => void
}

export interface Rota {
  caminho: string // ex.: '/cursos/:id'
  secao: string // item do menu que fica marcado
  titulo: string
  migalhas: Migalha[]
  render: (el: HTMLElement, ctx: Contexto) => void | Promise<void>
}

function casar(padrao: string, caminho: string): Record<string, string> | null {
  const a = padrao.split('/').filter(Boolean)
  const b = caminho.split('/').filter(Boolean)
  if (a.length !== b.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return params
}

export function caminhoAtual(): string {
  const h = location.hash.replace(/^#/, '')
  return h.split('?')[0] || '/'
}

export function iniciarRotas(
  rotas: Rota[],
  aoTrocar: (rota: Rota, el: HTMLElement, ctx: Contexto) => void,
  el: HTMLElement,
) {
  let geracao = 0
  const trocar = () => {
    const caminho = caminhoAtual()
    let rota = rotas[0]
    let params: Record<string, string> = {}
    for (const r of rotas) {
      const p = casar(r.caminho, caminho)
      if (p) {
        rota = r
        params = p
        break
      }
    }
    const minha = ++geracao
    const ctx: Contexto = {
      params,
      ativo: () => minha === geracao,
      migalhas: () => {},
    }
    aoTrocar(rota, el, ctx)
  }
  window.addEventListener('hashchange', trocar)
  trocar()
}
