// Bloco 1 · Cursos: lista com filtros, ordenação, paginação, CSV e ficha completa.
import { CONFIG } from '../config'
import { getCurso, getCursos, getResultadosAvaliacao, type Curso, type ResultadoAvaliacao } from '../lib/dados'
import { baixarCsv, hojeArquivo, type ColunaCsv } from '../lib/csv'
import { html, montar, urlSegura, type HtmlSeguro } from '../lib/html'
import { chave, compararTexto, conceito, diasAte, formatarData } from '../lib/normaliza'
import type { Contexto } from '../lib/router'
import { carregarPagina, parametrosDaRota, recarregarTela } from '../ui/carregar'
import { aviso, cabecalho, estadoVazio, ficha, tag, tagConceito, tagSituacao } from '../ui/componentes'
import { Tabela, type Coluna } from '../ui/tabela'

// Filtros ficam guardados enquanto a aba estiver aberta (voltar da ficha mantém a busca)
const filtros = { busca: '', modalidade: '', situacao: '', grau: '', conceito: '' }

const FILTROS_CONCEITO: Record<string, { rotulo: string; teste: (c: Curso) => boolean }> = {
  'abaixo-minimo': {
    rotulo: `CC ou CPC abaixo de ${CONFIG.conceitos.minimoSatisfatorio}`,
    teste: (c) => [c.ccC.nota, c.cpcC.nota].some((n) => n !== null && n < CONFIG.conceitos.minimoSatisfatorio),
  },
  'abaixo-meta': {
    rotulo: `CC ou CPC abaixo da meta (${CONFIG.conceitos.metaInstitucional})`,
    teste: (c) => [c.ccC.nota, c.cpcC.nota].some((n) => n !== null && n < CONFIG.conceitos.metaInstitucional),
  },
  'enade-baixo': {
    rotulo: `ENADE abaixo de ${CONFIG.conceitos.minimoSatisfatorio}`,
    teste: (c) => c.enadeC.nota !== null && c.enadeC.nota < CONFIG.conceitos.minimoSatisfatorio,
  },
  'sem-conceito': { rotulo: 'Sem CC e sem CPC', teste: (c) => c.ccC.nota === null && c.cpcC.nota === null },
}

const opcoes = (valores: (string | null)[]) =>
  [...new Set(valores.filter((v): v is string => !!v))].sort(compararTexto)

function select(id: string, rotulo: string, valor: string, itens: [string, string][]): HtmlSeguro {
  return html`<div class="field">
    <label for="${id}">${rotulo}</label>
    <select class="select" id="${id}" data-filtro="${id.replace('f-', '')}">
      <option value="">Todos</option>
      ${itens.map(([v, r]) => html`<option value="${v}" ${v === valor ? html`selected` : ''}>${r}</option>`)}
    </select>
  </div>`
}

function filtrar(cursos: Curso[]): Curso[] {
  const termo = chave(filtros.busca)
  const testeConceito = FILTROS_CONCEITO[filtros.conceito]?.teste
  return cursos.filter(
    (c) =>
      (!termo || chave(`${c.curso} ${c.codigo_emec} ${c.coordenador} ${c.rotulo}`).includes(termo)) &&
      (!filtros.modalidade || c.modalidadeCurta === filtros.modalidade) &&
      (!filtros.situacao || (c.status ?? '').toLowerCase() === filtros.situacao) &&
      (!filtros.grau || c.habilitacao === filtros.grau) &&
      (!testeConceito || testeConceito(c)),
  )
}

const COLUNAS: Coluna<Curso>[] = [
  {
    id: 'curso',
    titulo: 'Curso',
    ordenar: (c) => c.curso,
    celula: (c) =>
      html`<a class="link-btn" href="#/cursos/${encodeURIComponent(c.id)}">${c.curso ?? '(sem nome)'}</a>
        <div class="muted mono">e-MEC ${c.codigo_emec ?? '—'}</div>`,
  },
  { id: 'grau', titulo: 'Grau', ordenar: (c) => c.habilitacao, celula: (c) => c.habilitacao },
  { id: 'modalidade', titulo: 'Modalidade', ordenar: (c) => c.modalidadeCurta, celula: (c) => tag(c.modalidadeCurta, 'mod') },
  { id: 'coordenador', titulo: 'Coordenação', ordenar: (c) => c.coordenador, celula: (c) => c.coordenador },
  { id: 'cc', titulo: 'CC', classe: 'num', ordenar: (c) => c.ccC.nota, celula: (c) => tagConceito(c.ccC) },
  { id: 'cpc', titulo: 'CPC', classe: 'num', ordenar: (c) => c.cpcC.nota, celula: (c) => tagConceito(c.cpcC) },
  { id: 'enade', titulo: 'ENADE', classe: 'num', ordenar: (c) => c.enadeC.nota, celula: (c) => tagConceito(c.enadeC) },
  { id: 'situacao', titulo: 'Situação', ordenar: (c) => c.status, celula: (c) => tagSituacao(c.ativo, c.ativo ? 'Ativo' : 'Inativo') },
]

const CSV: ColunaCsv<Curso>[] = [
  { titulo: 'Código e-MEC', valor: (c) => c.codigo_emec },
  { titulo: 'Curso', valor: (c) => c.curso },
  { titulo: 'Grau', valor: (c) => c.habilitacao },
  { titulo: 'Modalidade', valor: (c) => c.modalidadeCurta },
  { titulo: 'Situação', valor: (c) => (c.ativo ? 'Ativo' : 'Inativo') },
  { titulo: 'Área geral', valor: (c) => c.area_geral },
  { titulo: 'Coordenação', valor: (c) => c.coordenador },
  { titulo: 'E-mail coordenação', valor: (c) => c.coordenador_email },
  { titulo: 'CC', valor: (c) => c.ccC.texto },
  { titulo: 'CPC', valor: (c) => c.cpcC.texto },
  { titulo: 'ENADE', valor: (c) => c.enadeC.texto },
  { titulo: 'Vagas anuais', valor: (c) => c.vagas_anuais_autorizadas },
  { titulo: 'Carga horária total', valor: (c) => c.carga_horaria_total },
  { titulo: 'Início de funcionamento', valor: (c) => c.data_inicio_funcionamento ?? c.inicio_funcionamento },
  { titulo: 'Abertura do processo de reconhecimento', valor: (c) => c.abertura_processo_reconhecimento },
  { titulo: 'Ato de autorização', valor: (c) => c.portaria_autorizacao?.replace(/\s+/g, ' ') },
]

export function paginaCursos(el: HTMLElement, ctx: Contexto) {
  // Filtro vindo de um link do Painel (ex.: #/cursos?conceito=abaixo-minimo)
  const p = parametrosDaRota()
  // Se o link traz filtros, eles substituem os anteriores
  if ([...p.keys()].length) {
    for (const k of Object.keys(filtros) as (keyof typeof filtros)[]) filtros[k] = p.get(k) ?? ''
  }

  carregarPagina(el, ctx, getCursos, (cursos) => {
    montar(
      el,
      html`${cabecalho({
          codigo: 'MOD·01 · Cadastro institucional',
          titulo: 'Cursos de graduação',
          descricao: 'Consulta dos cursos cadastrados no banco do Hub. Para corrigir um dado, edite no painel do Supabase (edição pelo Hub chega com o login, no Bloco 5).',
          acoes: html`<button class="btn btn-ghost" data-acao="atualizar">↻ Atualizar</button>
            <button class="btn btn-primary" data-acao="csv">⬇ Exportar CSV</button>`,
        })}
        <form class="toolbar" role="search" aria-label="Filtrar cursos">
          <div class="field field-grow">
            <label for="f-busca">Buscar</label>
            <input class="input" id="f-busca" type="search" data-filtro="busca" value="${filtros.busca}" placeholder="Nome, código e-MEC, coordenação…" autocomplete="off" />
          </div>
          ${select('f-modalidade', 'Modalidade', filtros.modalidade, opcoes(cursos.map((c) => c.modalidadeCurta)).map((v) => [v, v]))}
          ${select('f-situacao', 'Situação', filtros.situacao, [['ativo', 'Ativo'], ['inativo', 'Inativo']])}
          ${select('f-grau', 'Grau', filtros.grau, opcoes(cursos.map((c) => c.habilitacao)).map((v) => [v, v]))}
          ${select('f-conceito', 'Conceitos', filtros.conceito, Object.entries(FILTROS_CONCEITO).map(([k, f]) => [k, f.rotulo]))}
          <div class="toolbar-end"><button type="button" class="btn btn-ghost btn-sm" data-acao="limpar">Limpar filtros</button></div>
        </form>
        <p class="result-count" id="contagem" aria-live="polite"></p>
        <div id="tabela"></div>`,
    )

    const tabela = new Tabela<Curso>(el.querySelector('#tabela')!, {
      rotulo: 'Cursos de graduação',
      colunas: COLUNAS,
      chave: (c) => c.id,
      ordemInicial: { coluna: 'curso', direcao: 'asc' },
      vazio: estadoVazio('Nenhum curso encontrado', 'Ajuste ou limpe os filtros para ver mais resultados.', '🔍'),
    })

    const aplicar = () => {
      const lista = filtrar(cursos)
      tabela.definirDados(lista)
      el.querySelector('#contagem')!.textContent = `${lista.length} de ${cursos.length} cursos`
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
      const acao = (e.target as HTMLElement).closest<HTMLElement>('[data-acao]')?.dataset.acao
      if (acao === 'csv') baixarCsv(`cursos-${hojeArquivo()}.csv`, CSV, tabela.ordenadas())
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

// =====================================================================
//  Ficha completa do curso  (#/cursos/:id)
// =====================================================================
const link = (rotulo: string, u: unknown): HtmlSeguro | null => {
  const url = urlSegura(u)
  return url ? html`<a href="${url}" target="_blank" rel="noopener">${rotulo} ↗</a>` : null
}

/** Tenta achar o resultado de avaliação in loco do curso pelo nome (a tabela não tem código e-MEC). */
function resultadoDoCurso(c: Curso, todos: ResultadoAvaliacao[]): ResultadoAvaliacao | null {
  const alvo = chave(`${c.curso}${c.modalidadeCurta === 'EAD' ? ' EAD' : ''}`)
  return todos.find((r) => chave(r.curso_label) === alvo) ?? null
}

const nota = (n: number | null) => (n === null || n === undefined ? '—' : tagConceito(conceito(n)))

function prazoReconhecimento(c: Curso): HtmlSeguro | string {
  if (!c.aberturaReconhecimento) return c.abertura_processo_reconhecimento ?? '—'
  const d = diasAte(c.aberturaReconhecimento)
  const quando = d < 0 ? tag(`passou há ${-d} dias`, 'alert') : d <= 90 ? tag(`em ${d} dias`, 'warn') : tag(`em ${d} dias`, 'info')
  return html`${formatarData(c.aberturaReconhecimento)} ${quando}`
}

export function paginaFichaCurso(el: HTMLElement, ctx: Contexto) {
  const buscar = async () => {
    const [curso, todos, resultados] = await Promise.all([
      getCurso(ctx.params.id),
      getCursos(),
      getResultadosAvaliacao().catch(() => [] as ResultadoAvaliacao[]), // ficha abre mesmo se essa tabela falhar
    ])
    return { curso, todos, resultados }
  }

  carregarPagina(el, ctx, buscar, ({ curso: c, todos, resultados }) => {
    if (!c) {
      montar(el, estadoVazio('Curso não encontrado', 'O endereço pode estar desatualizado. Volte para a lista de cursos.', '❓'))
      return
    }
    ctx.migalhas([{ rotulo: `${c.curso ?? 'Curso'} · ${c.modalidadeCurta}` }])
    const outras = todos.filter((o) => o.id !== c.id && chave(o.curso) === chave(c.curso))
    const r = resultadoDoCurso(c, resultados)
    const links = [
      link('PPC', c.link_ppc),
      link('Guia do curso', c.link_guia_curso),
      link('Cadastro no e-MEC', c.link_emec),
      link('Portaria (PDF)', c.link_portaria_pdf),
      link('Conselho de classe', c.conselho_classe),
    ].filter(Boolean)

    montar(
      el,
      html`${cabecalho({
          codigo: `Ficha do curso · e-MEC ${c.codigo_emec ?? '—'}`,
          titulo: c.curso ?? '(sem nome)',
          descricao: [c.habilitacao, c.modalidadeCurta, c.area_geral].filter(Boolean).join(' · '),
          acoes: html`<a class="btn btn-ghost" href="#/cursos">← Voltar para a lista</a>`,
        })}
        ${!c.ativo ? aviso(html`Este curso está marcado como <b>inativo</b> no banco.`, 'warn') : ''}
        <div class="stat-grid" style="margin-bottom:var(--sp-5)">
          <div class="stat"><span class="stat-label">Situação</span><span>${tagSituacao(c.ativo, c.ativo ? 'Ativo' : 'Inativo')}</span></div>
          <div class="stat"><span class="stat-label">CC</span><span>${tagConceito(c.ccC)}</span><span class="stat-sub">${c.ccC.texto}</span></div>
          <div class="stat"><span class="stat-label">CPC</span><span>${tagConceito(c.cpcC)}</span><span class="stat-sub">${c.cpcC.texto}</span></div>
          <div class="stat"><span class="stat-label">ENADE</span><span>${tagConceito(c.enadeC)}</span><span class="stat-sub">${c.enadeC.texto}</span></div>
        </div>

        <div class="card">
          <section class="ficha-section">
            <h3>Identificação</h3>
            ${ficha([
              ['Código e-MEC', c.codigo_emec],
              ['Grau', c.habilitacao],
              ['Modalidade (como está no banco)', c.modalidade],
              ['Rótulo (Cine Brasil)', c.rotulo],
              ['Área geral', c.area_geral],
              ['Área específica', c.area_especifica],
              ['Área detalhada', c.area_detalhada],
              ['Código do endereço e-MEC', c.codigo_endereco_emec],
            ])}
          </section>
          <section class="ficha-section">
            <h3>Funcionamento</h3>
            ${ficha([
              ['Início de funcionamento', c.data_inicio_funcionamento ?? c.inicio_funcionamento],
              ['Duração', c.tempo_duracao],
              ['Vagas anuais autorizadas', c.vagas_anuais_autorizadas],
              ['Carga horária total', c.carga_horaria_total],
              ['Atividades complementares (h)', c.carga_horaria_atividades_complementares],
              ['Estágio (h)', c.carga_horaria_estagio],
              ['Semestres de estágio', c.semestres_estagio],
              ['Possui TCC', c.possui_tcc],
            ])}
          </section>
          <section class="ficha-section">
            <h3>Atos e processos regulatórios</h3>
            ${ficha([
              ['Ato de autorização', c.portaria_autorizacao],
              ['Abertura do processo de reconhecimento', prazoReconhecimento(c)],
              ['Processo em andamento', c.situacao_processo_andamento],
            ])}
          </section>
          <section class="ficha-section">
            <h3>Coordenação</h3>
            ${ficha([
              ['Coordenador(a)', c.coordenador],
              ['E-mail', c.coordenador_email ? html`<a href="mailto:${c.coordenador_email}">${c.coordenador_email}</a>` : null],
              ['Telefone', c.coordenador_telefone],
            ])}
          </section>
          <section class="ficha-section">
            <h3>Avaliação in loco (tabela resultados_avaliacao_curso)</h3>
            ${r
              ? html`${ficha([
                  ['Registro', r.curso_label],
                  ['Conceito na autorização', nota(r.conceito_autorizacao)],
                  ['Conceito no reconhecimento', nota(r.conceito_reconhecimento)],
                  ['Dimensão 1 (aut. / rec.)', html`${nota(r.dim1_autorizacao)} / ${nota(r.dim1_reconhecimento)}`],
                  ['Dimensão 2 (aut. / rec.)', html`${nota(r.dim2_autorizacao)} / ${nota(r.dim2_reconhecimento)}`],
                  ['Dimensão 3 (aut. / rec.)', html`${nota(r.dim3_autorizacao)} / ${nota(r.dim3_reconhecimento)}`],
                ])}
                <p class="card-sub" style="margin-top:var(--sp-2)">Ligado pelo nome do curso (a tabela não guarda o código e-MEC). Confira se o registro é o desta oferta.</p>`
              : html`<p class="card-sub">Nenhum resultado de avaliação in loco encontrado com o nome “${c.curso}${c.modalidadeCurta === 'EAD' ? ' EAD' : ''}”.</p>`}
          </section>
          <section class="ficha-section">
            <h3>Documentos e links</h3>
            ${links.length ? html`<p style="display:flex;gap:var(--sp-4);flex-wrap:wrap">${links}</p>` : html`<p class="card-sub">Nenhum link cadastrado.</p>`}
          </section>
          ${c.mercado_trabalho
            ? html`<section class="ficha-section"><h3>Mercado de trabalho</h3><p style="white-space:pre-line">${c.mercado_trabalho}</p></section>`
            : ''}
          ${outras.length
            ? html`<section class="ficha-section">
                <h3>Outras ofertas do mesmo curso</h3>
                <p style="display:flex;gap:var(--sp-3);flex-wrap:wrap">
                  ${outras.map((o) => html`<a href="#/cursos/${encodeURIComponent(o.id)}">${o.modalidadeCurta} · e-MEC ${o.codigo_emec ?? '—'}${o.ativo ? '' : ' (inativo)'}</a>`)}
                </p>
              </section>`
            : ''}
          <p class="card-sub">Última atualização do registro: ${c.updated_at ? new Date(c.updated_at).toLocaleString('pt-BR') : '—'}</p>
        </div>
`,
    )
  })
}
