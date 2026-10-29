// Tabela reutilizável: ordenação por coluna (clique no título) + paginação.
// Os filtros ficam fora dela: a página filtra e chama tabela.definirDados(linhas).
import { html, montar, type HtmlSeguro } from '../lib/html'
import { compararTexto } from '../lib/normaliza'

export interface Coluna<T> {
  id: string
  titulo: string
  celula: (linha: T) => HtmlSeguro | string | number | null
  /** Valor usado para ordenar. Sem isso, a coluna não é ordenável. */
  ordenar?: (linha: T) => string | number | null
  classe?: string
}

interface Opcoes<T> {
  rotulo: string // descrição da tabela para leitores de tela
  colunas: Coluna<T>[]
  chave: (linha: T) => string
  vazio: HtmlSeguro
  porPagina?: number
  ordemInicial?: { coluna: string; direcao: 'asc' | 'desc' }
}

const TAMANHOS = [25, 50, 100]
let contador = 0

export class Tabela<T> {
  private linhas: T[] = []
  private pagina = 0
  private porPagina: number
  private ordem: { coluna: string; direcao: 'asc' | 'desc' } | null
  private uid = `tabela-${++contador}`

  constructor(private el: HTMLElement, private o: Opcoes<T>) {
    this.porPagina = o.porPagina ?? 25
    this.ordem = o.ordemInicial ?? null
    el.addEventListener('click', (e) => {
      const alvo = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]')
      if (!alvo) return
      const acao = alvo.dataset.tab
      if (acao === 'ordenar') this.alternarOrdem(alvo.dataset.coluna!)
      if (acao === 'anterior') this.irPara(this.pagina - 1)
      if (acao === 'proxima') this.irPara(this.pagina + 1)
    })
    el.addEventListener('change', (e) => {
      const alvo = e.target as HTMLSelectElement
      if (alvo.dataset.tab === 'tamanho') {
        this.porPagina = Number(alvo.value)
        this.irPara(0)
      }
    })
  }

  definirDados(linhas: T[]) {
    this.linhas = linhas
    this.pagina = 0
    this.desenhar()
  }

  /** Linhas na ordem atual (todas as páginas) — usado na exportação CSV. */
  ordenadas(): T[] {
    if (!this.ordem) return this.linhas
    const col = this.o.colunas.find((c) => c.id === this.ordem!.coluna)
    if (!col?.ordenar) return this.linhas
    const f = col.ordenar
    const mult = this.ordem.direcao === 'asc' ? 1 : -1
    return [...this.linhas].sort((a, b) => {
      const va = f(a)
      const vb = f(b)
      // Vazios sempre no fim, em qualquer direção
      if (va === null || va === '') return vb === null || vb === '' ? 0 : 1
      if (vb === null || vb === '') return -1
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : compararTexto(String(va), String(vb))
      return r * mult
    })
  }

  private alternarOrdem(coluna: string) {
    this.ordem =
      this.ordem?.coluna === coluna
        ? { coluna, direcao: this.ordem.direcao === 'asc' ? 'desc' : 'asc' }
        : { coluna, direcao: 'asc' }
    this.desenhar()
    this.el.querySelector<HTMLElement>(`[data-coluna="${coluna}"]`)?.focus()
  }

  private irPara(p: number) {
    const total = Math.max(1, Math.ceil(this.linhas.length / this.porPagina))
    this.pagina = Math.min(Math.max(0, p), total - 1)
    this.desenhar()
  }

  private desenhar() {
    if (!this.linhas.length) {
      montar(this.el, this.o.vazio)
      return
    }
    const total = this.linhas.length
    const paginas = Math.ceil(total / this.porPagina)
    const ini = this.pagina * this.porPagina
    const visiveis = this.ordenadas().slice(ini, ini + this.porPagina)

    const cabecalho = this.o.colunas.map((c) => {
      const ativa = this.ordem?.coluna === c.id
      const ariaSort = ativa ? (this.ordem!.direcao === 'asc' ? 'ascending' : 'descending') : 'none'
      if (!c.ordenar) return html`<th scope="col" class="${c.classe ?? ''}"><span>${c.titulo}</span></th>`
      return html`<th scope="col" class="${c.classe ?? ''}" aria-sort="${ariaSort}">
        <button type="button" data-tab="ordenar" data-coluna="${c.id}">${c.titulo}<span class="sort-ind" aria-hidden="true">${ativa ? (this.ordem!.direcao === 'asc' ? '▲' : '▼') : '↕'}</span></button>
      </th>`
    })

    montar(
      this.el,
      html`<div class="table-wrap">
          <table class="data">
            <caption class="sr-only">${this.o.rotulo}. Clique no título de uma coluna para ordenar.</caption>
            <thead><tr>${cabecalho}</tr></thead>
            <tbody>
              ${visiveis.map(
                (l) => html`<tr data-linha="${this.o.chave(l)}">
                  ${this.o.colunas.map((c) => html`<td class="${c.classe ?? ''}">${c.celula(l) ?? '—'}</td>`)}
                </tr>`,
              )}
            </tbody>
          </table>
        </div>
        <div class="pager">
          <span aria-live="polite">Mostrando ${ini + 1}–${Math.min(ini + this.porPagina, total)} de ${total}</span>
          <div class="pager-btns">
            <label class="sr-only" for="${this.uid}-tam">Linhas por página</label>
            <select class="select" id="${this.uid}-tam" data-tab="tamanho" style="height:32px">
              ${TAMANHOS.map((t) => html`<option value="${t}" ${t === this.porPagina ? html`selected` : ''}>${t} por página</option>`)}
            </select>
            <button class="btn btn-ghost btn-sm" data-tab="anterior" ${this.pagina === 0 ? html`disabled` : ''}>← Anterior</button>
            <span>Página ${this.pagina + 1} de ${paginas}</span>
            <button class="btn btn-ghost btn-sm" data-tab="proxima" ${this.pagina >= paginas - 1 ? html`disabled` : ''}>Próxima →</button>
          </div>
        </div>`,
    )
  }
}
