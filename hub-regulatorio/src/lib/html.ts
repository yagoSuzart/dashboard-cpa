// Montagem de HTML segura (proteção contra XSS).
//
// Regra do projeto: NUNCA concatene texto vindo do banco direto no innerHTML.
// Use sempre o "html`...`": tudo o que entra em ${...} é escapado automaticamente.
// Só passa sem escape o que já foi montado com html`...` (ou marcado com confiavel()).

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escapa um valor para ser exibido como texto dentro do HTML. */
export function esc(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  return String(valor).replace(/[&<>"']/g, (c) => ESCAPES[c])
}

/** Pedaço de HTML que já é seguro (montado por html`` ou escrito por nós). */
export class HtmlSeguro {
  constructor(readonly valor: string) {}
  toString() {
    return this.valor
  }
}

function emHtml(v: unknown): string {
  if (v instanceof HtmlSeguro) return v.valor
  if (Array.isArray(v)) return v.map(emHtml).join('')
  if (v === null || v === undefined || v === false) return ''
  return esc(v)
}

/** Template seguro: html`<b>${nomeDoBanco}</b>` escapa nomeDoBanco. */
export function html(partes: TemplateStringsArray, ...valores: unknown[]): HtmlSeguro {
  let out = partes[0]
  for (let i = 0; i < valores.length; i++) out += emHtml(valores[i]) + partes[i + 1]
  return new HtmlSeguro(out)
}

/** Marca um texto fixo, escrito no código, como HTML confiável. Nunca use com dados do banco. */
export const confiavel = (s: string) => new HtmlSeguro(s)

/** Coloca o HTML seguro dentro de um elemento. */
export function montar(el: Element, conteudo: HtmlSeguro) {
  el.innerHTML = conteudo.valor
}

/** Só aceita links http(s). Bloqueia "javascript:" e similares vindos do banco. */
export function urlSegura(u: unknown): string | null {
  if (typeof u !== 'string') return null
  const t = u.trim()
  return /^https?:\/\/[^\s]+$/i.test(t) ? t : null
}
