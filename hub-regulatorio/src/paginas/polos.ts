// Bloco 1 · Polos: 712 registros com filtros (UF, região, situação), ordenação, paginação, CSV e detalhe.
import { getPolos, type Polo } from '../lib/dados'
import { baixarCsv, hojeArquivo, type ColunaCsv } from '../lib/csv'
import { html, montar, type HtmlSeguro } from '../lib/html'
import { chave, compararTexto, formatarData } from '../lib/normaliza'
import type { Contexto } from '../lib/router'
import { carregarPagina, parametrosDaRota, recarregarTela } from '../ui/carregar'
import { abrirModal, cabecalho, estadoVazio, ficha, tag, tagSituacao } from '../ui/componentes'
import { Tabela, type Coluna } from '../ui/tabela'

const filtros = { busca: '', uf: '', regiao: '', situacao: '' }

const rotuloUf = (uf: string | null) => (uf === 'EX' ? 'Exterior' : uf ?? 'Não identificada')

function filtrar(polos: Polo[]): Polo[] {
  const termo = chave(filtros.busca)
  return polos.filter(
    (p) =>
      (!termo || chave(`${p.nome_polo} ${p.cidade} ${p.representante} ${p.codigo} ${p.nome_fantasia_parceiro} ${p.cnpj}`).includes(termo)) &&
      (!filtros.uf || (p.uf ?? '?') === filtros.uf) &&
      (!filtros.regiao || p.regiao === filtros.regiao) &&
      (!filtros.situacao || (p.situacao ?? '').toLowerCase() === filtros.situacao),
  )
}

function select(id: string, rotulo: string, valor: string, itens: [string, string][]): HtmlSeguro {
  return html`<div class="field">
    <label for="${id}">${rotulo}</label>
    <select class="select" id="${id}" data-filtro="${id.replace('f-', '')}">
      <option value="">Todos</option>
      ${itens.map(([v, r]) => html`<option value="${v}" ${v === valor ? html`selected` : ''}>${r}</option>`)}
    </select>
  </div>`
}

const COLUNAS: Coluna<Polo>[] = [
  {
    id: 'nome',
    titulo: 'Polo',
    ordenar: (p) => p.nome_polo,
    celula: (p) =>
      html`<button type="button" class="link-btn" data-polo="${p.id}">${p.nome_polo ?? '(sem nome)'}</button>
        <div class="muted mono">e-MEC ${p.codigo ?? '—'}</div>`,
  },
  { id: 'cidade', titulo: 'Cidade', ordenar: (p) => p.cidade, celula: (p) => p.cidade },
  { id: 'uf', titulo: 'UF', ordenar: (p) => p.uf, celula: (p) => (p.uf ? tag(rotuloUf(p.uf), 'neutro', p.estado ?? '') : html`<span class="muted">${p.estado ?? '—'}</span>`) },
  { id: 'representante', titulo: 'Representante', ordenar: (p) => p.representante, celula: (p) => p.representante },
  { id: 'cadastro', titulo: 'Cadastro', ordenar: (p) => p.dataCadastro?.getTime() ?? null, celula: (p) => formatarData(p.dataCadastro) },
  { id: 'situacao', titulo: 'Situação', ordenar: (p) => p.situacao, celula: (p) => tagSituacao(p.ativo, p.situacaoTexto) },
]

const CSV: ColunaCsv<Polo>[] = [
  { titulo: 'Código e-MEC', valor: (p) => p.codigo },
  { titulo: 'Polo', valor: (p) => p.nome_polo },
  { titulo: 'Cidade', valor: (p) => p.cidade },
  { titulo: 'UF', valor: (p) => p.uf },
  { titulo: 'Estado (como está no banco)', valor: (p) => p.estado },
  { titulo: 'Região', valor: (p) => p.regiao },
  { titulo: 'Endereço', valor: (p) => p.endereco },
  { titulo: 'Representante', valor: (p) => p.representante },
  { titulo: 'Parceiro (nome fantasia)', valor: (p) => p.nome_fantasia_parceiro },
  { titulo: 'Razão social', valor: (p) => p.razao_social_parceiro },
  { titulo: 'CNPJ', valor: (p) => p.cnpj },
  { titulo: 'Data de cadastro', valor: (p) => p.dataCadastro },
  { titulo: 'Ato de cadastro', valor: (p) => p.ato_cadastro },
  { titulo: 'Situação', valor: (p) => p.situacaoTexto },
]

function abrirDetalhe(p: Polo) {
  abrirModal({
    codigo: `Polo · e-MEC ${p.codigo ?? '—'}`,
    titulo: p.nome_polo ?? 'Polo',
    corpo: html`<section class="ficha-section">
        <h3>Localização</h3>
        ${ficha([
          ['Cidade', p.cidade],
          ['UF', rotuloUf(p.uf)],
          ['Estado (como está no banco)', p.estado],
          ['Região', p.regiao],
          ['Endereço', p.endereco],
        ])}
      </section>
      <section class="ficha-section">
        <h3>Parceiro</h3>
        ${ficha([
          ['Representante', p.representante],
          ['Nome fantasia', p.nome_fantasia_parceiro],
          ['Razão social', p.razao_social_parceiro],
          ['CNPJ', p.cnpj],
        ])}
      </section>
      <section class="ficha-section">
        <h3>Situação regulatória</h3>
        ${ficha([
          ['Situação', tagSituacao(p.ativo, p.situacaoTexto)],
          ['Data de cadastro', formatarData(p.dataCadastro)],
          ['Ato de cadastro', p.ato_cadastro],
          ['Cursos ofertados', p.cursos_ofertados],
        ])}
      </section>
      <p class="card-sub">Última atualização do registro: ${p.updated_at ? new Date(p.updated_at).toLocaleString('pt-BR') : '—'}</p>`,
  })
}

export function paginaPolos(el: HTMLElement, ctx: Contexto) {
  const p = parametrosDaRota()
  // Se o link traz filtros, eles substituem os anteriores
  if ([...p.keys()].length) {
    for (const k of Object.keys(filtros) as (keyof typeof filtros)[]) filtros[k] = p.get(k) ?? ''
  }

  carregarPagina(el, ctx, getPolos, (polos) => {
    const ufs = [...new Set(polos.map((x) => x.uf ?? '?'))].sort(compararTexto).map((u): [string, string] => [u, u === '?' ? 'Não identificada' : rotuloUf(u)])
    const regioes = [...new Set(polos.map((x) => x.regiao).filter((r): r is string => !!r))].sort(compararTexto).map((r): [string, string] => [r, r])
    const naoIdentificados = polos.filter((x) => !x.uf).length

    montar(
      el,
      html`${cabecalho({
          codigo: 'MOD·01 · Cadastro institucional',
          titulo: 'Polos de apoio presencial',
          descricao: 'Consulta dos polos cadastrados no banco do Hub. A UF é padronizada a partir do nome do estado (o banco tem grafias diferentes para o mesmo estado).',
          acoes: html`<button class="btn btn-ghost" data-acao="atualizar">↻ Atualizar</button>
            <button class="btn btn-primary" data-acao="csv">⬇ Exportar CSV</button>`,
        })}
        <form class="toolbar" role="search" aria-label="Filtrar polos">
          <div class="field field-grow">
            <label for="f-busca">Buscar</label>
            <input class="input" id="f-busca" type="search" data-filtro="busca" value="${filtros.busca}" placeholder="Nome, cidade, representante, código e-MEC, CNPJ…" autocomplete="off" />
          </div>
          ${select('f-uf', 'UF', filtros.uf, ufs)}
          ${select('f-regiao', 'Região', filtros.regiao, regioes)}
          ${select('f-situacao', 'Situação', filtros.situacao, [['ativo', 'Ativo'], ['inativo', 'Inativo']])}
          <div class="toolbar-end"><button type="button" class="btn btn-ghost btn-sm" data-acao="limpar">Limpar filtros</button></div>
        </form>
        <p class="result-count" id="contagem" aria-live="polite"></p>
        <div id="tabela"></div>
        ${naoIdentificados ? html`<p class="card-sub" style="margin-top:var(--sp-3)">${naoIdentificados} polo(s) com estado não reconhecido aparecem como “Não identificada” no filtro de UF.</p>` : ''}`,
    )

    const tabela = new Tabela<Polo>(el.querySelector('#tabela')!, {
      rotulo: 'Polos de apoio presencial',
      colunas: COLUNAS,
      chave: (x) => x.id,
      porPagina: 50,
      ordemInicial: { coluna: 'nome', direcao: 'asc' },
      vazio: estadoVazio('Nenhum polo encontrado', 'Ajuste ou limpe os filtros para ver mais resultados.', '🔍'),
    })
    const porId = new Map(polos.map((x) => [x.id, x]))

    const aplicar = () => {
      const lista = filtrar(polos)
      tabela.definirDados(lista)
      el.querySelector('#contagem')!.textContent = `${lista.length} de ${polos.length} polos`
    }
    aplicar()

    let espera: number | undefined
    el.addEventListener('submit', (e) => e.preventDefault())
    el.addEventListener('input', (e) => {
      const alvo = e.target as HTMLInputElement
      const k = alvo.dataset.filtro as keyof typeof filtros | undefined
      if (!k) return
      filtros[k] = alvo.value
      clearTimeout(espera)
      espera = window.setTimeout(aplicar, alvo.type === 'search' ? 150 : 0)
    })
    el.addEventListener('click', (e) => {
      const t = e.target as HTMLElement
      const idPolo = t.closest<HTMLElement>('[data-polo]')?.dataset.polo
      if (idPolo && porId.has(idPolo)) abrirDetalhe(porId.get(idPolo)!)
      const acao = t.closest<HTMLElement>('[data-acao]')?.dataset.acao
      if (acao === 'csv') baixarCsv(`polos-${hojeArquivo()}.csv`, CSV, tabela.ordenadas())
      if (acao === 'atualizar') {
        recarregarTela()
      }
      if (acao === 'limpar') {
        Object.keys(filtros).forEach((k) => (filtros[k as keyof typeof filtros] = ''))
        el.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-filtro]').forEach((i) => (i.value = ''))
        aplicar()
      }
    })
  })
}
