// Componentes visuais reutilizáveis. Todos devolvem HTML seguro (ver lib/html.ts).
import { html, montar, type HtmlSeguro } from '../lib/html'

export type Tom = 'ok' | 'info' | 'warn' | 'alert' | 'mod' | 'neutro'

/** Etiqueta colorida de status. */
export function tag(texto: string, tom: Tom = 'neutro', titulo?: string): HtmlSeguro {
  const cls = tom === 'neutro' ? 'tag' : `tag tag-${tom}`
  return html`<span class="${cls}" ${titulo ? html`title="${titulo}"` : ''}>${texto}</span>`
}

/** Cabeçalho padrão de página. */
export function cabecalho(o: { codigo?: string; titulo: string; descricao?: string; acoes?: HtmlSeguro }): HtmlSeguro {
  return html`<header class="page-head">
    <div>
      ${o.codigo ? html`<div class="eyebrow">${o.codigo}</div>` : ''}
      <h1>${o.titulo}</h1>
      ${o.descricao ? html`<p>${o.descricao}</p>` : ''}
    </div>
    ${o.acoes ? html`<div class="page-actions">${o.acoes}</div>` : ''}
  </header>`
}

/** Estado vazio: quando não há nada para mostrar. */
export function estadoVazio(titulo: string, texto = '', icone = '🗂️'): HtmlSeguro {
  return html`<div class="state" role="status">
    <div class="state-icon" aria-hidden="true">${icone}</div>
    <div class="state-title">${titulo}</div>
    ${texto ? html`<div>${texto}</div>` : ''}
  </div>`
}

/** Carregando. */
export function carregando(texto = 'Carregando dados…'): HtmlSeguro {
  return html`<div class="state" role="status" aria-live="polite">
    <div class="spinner" aria-hidden="true"></div>
    <div>${texto}</div>
  </div>`
}

/** Erro com botão de tentar de novo (o botão dispara data-acao="tentar-de-novo"). */
export function estadoErro(texto: string, podeTentar = true): HtmlSeguro {
  return html`<div class="state is-error" role="alert">
    <div class="state-icon" aria-hidden="true">⚠️</div>
    <div class="state-title">Não foi possível carregar</div>
    <div>${texto}</div>
    ${podeTentar ? html`<button class="btn btn-ghost" data-acao="tentar-de-novo">Tentar de novo</button>` : ''}
  </div>`
}

/** Aviso em faixa (informação, atenção ou alerta). */
export function aviso(conteudo: HtmlSeguro, tom: 'info' | 'warn' | 'alert' = 'info'): HtmlSeguro {
  const icone = { info: 'ℹ️', warn: '⚠️', alert: '⛔' }[tom]
  return html`<div class="notice notice-${tom}"><span aria-hidden="true">${icone}</span><div>${conteudo}</div></div>`
}

/** Indicador numérico. */
export function indicador(o: { rotulo: string; valor: string | number; sub?: string; tom?: 'ok' | 'warn' | 'alert' }): HtmlSeguro {
  const cls = o.tom ? `stat is-${o.tom}` : 'stat'
  return html`<div class="${cls}">
    <span class="stat-label">${o.rotulo}</span>
    <span class="stat-value">${o.valor}</span>
    ${o.sub ? html`<span class="stat-sub">${o.sub}</span>` : ''}
  </div>`
}

/** Barras horizontais simples (sem biblioteca). */
export function barras(itens: { rotulo: string; valor: number }[], cor = 'var(--blue)'): HtmlSeguro {
  if (!itens.length) return estadoVazio('Sem dados')
  const max = Math.max(...itens.map((i) => i.valor), 1)
  return html`<div class="bars" role="list">
    ${itens.map(
      (i) => html`<div class="bar-row" role="listitem" aria-label="${i.rotulo}: ${i.valor}">
        <span class="bar-label" title="${i.rotulo}">${i.rotulo}</span>
        <span class="bar-track" aria-hidden="true"><span class="bar-fill" style="width:${((i.valor / max) * 100).toFixed(1)}%;background:${cor}"></span></span>
        <span class="bar-value">${i.valor}</span>
      </div>`,
    )}
  </div>`
}

/** Lista de rótulo/valor para fichas de detalhe. Valores vazios aparecem como "—". */
export function ficha(itens: [string, unknown][]): HtmlSeguro {
  return html`<dl class="ficha">
    ${itens.map(([r, v]) => html`<div><dt>${r}</dt><dd>${v === null || v === undefined || v === '' ? '—' : v}</dd></div>`)}
  </dl>`
}

// ---------------------------------------------------------------------
//  Modal (usa <dialog> nativo: fecha com Esc, prende o foco, devolve o foco)
// ---------------------------------------------------------------------
export function abrirModal(o: { titulo: string; codigo?: string; corpo: HtmlSeguro }) {
  const anterior = document.activeElement as HTMLElement | null
  const dlg = document.createElement('dialog')
  dlg.className = 'modal'
  dlg.setAttribute('aria-labelledby', 'modal-titulo')
  montar(
    dlg,
    html`<div class="modal-head">
        <div>
          ${o.codigo ? html`<div class="eyebrow">${o.codigo}</div>` : ''}
          <h2 id="modal-titulo">${o.titulo}</h2>
        </div>
        <button class="modal-close" data-fechar aria-label="Fechar">✕</button>
      </div>
      <div class="modal-body">${o.corpo}</div>`,
  )
  document.body.append(dlg)
  const fechar = () => dlg.close()
  dlg.addEventListener('click', (e) => {
    const alvo = e.target as HTMLElement
    if (alvo === dlg || alvo.closest('[data-fechar]')) fechar() // clique fora ou no X
  })
  dlg.addEventListener('close', () => {
    dlg.remove()
    anterior?.focus()
  })
  dlg.showModal()
  dlg.querySelector<HTMLElement>('[data-fechar]')?.focus()
  return { fechar, elemento: dlg }
}
