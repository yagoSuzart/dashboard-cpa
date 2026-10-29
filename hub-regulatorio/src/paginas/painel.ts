// Bloco 2 (esboço) · Painel: contadores calculados na hora a partir dos dados reais do banco.
// Nenhum número aqui é digitado à mão: tudo vem de getCursos() e getPolos().
import { CONFIG } from '../config'
import { getCursos, getPolos, getUltimaSincronizacao, type Curso } from '../lib/dados'
import { html, montar, type HtmlSeguro } from '../lib/html'
import { compararTexto, diasAte, formatarData, type Conceito } from '../lib/normaliza'
import type { Contexto } from '../lib/router'
import { carregarPagina, recarregarTela } from '../ui/carregar'
import { aviso, barras, cabecalho, estadoVazio, indicador, tag } from '../ui/componentes'

const { minimoSatisfatorio: MIN, metaInstitucional: META } = CONFIG.conceitos

/** Conta quantas vezes cada valor aparece e devolve do maior para o menor. */
function contar<T>(itens: T[], chave: (i: T) => string): { rotulo: string; valor: number }[] {
  const m = new Map<string, number>()
  for (const i of itens) m.set(chave(i), (m.get(chave(i)) ?? 0) + 1)
  return [...m].map(([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => b.valor - a.valor || compararTexto(a.rotulo, b.rotulo))
}

const faixa = (c: Conceito) =>
  c.nota === null ? c.texto.replace(' (S/C)', '') : c.nota >= 5 ? '5' : c.nota >= 4 ? '4' : c.nota >= 3 ? '3' : 'Abaixo de 3'
const FAIXAS = ['5', '4', '3', 'Abaixo de 3', 'Sem conceito', 'Não há', 'Não informado']

function tabelaConceitos(cursos: Curso[]): HtmlSeguro {
  const col = (f: (c: Curso) => Conceito) => {
    const m = new Map(contar(cursos, (c) => faixa(f(c))).map((x) => [x.rotulo, x.valor]))
    return FAIXAS.map((fx) => m.get(fx) ?? 0)
  }
  const [cc, cpc, enade] = [col((c) => c.ccC), col((c) => c.cpcC), col((c) => c.enadeC)]
  const tom = (fx: string) => (fx === 'Abaixo de 3' ? 'alert' : fx === '3' ? 'warn' : fx === '4' || fx === '5' ? 'ok' : 'neutro')
  return html`<div class="table-wrap">
    <table class="data">
      <caption class="sr-only">Distribuição dos conceitos dos cursos ativos</caption>
      <thead><tr><th scope="col"><span>Faixa</span></th><th scope="col" class="num"><span>CC</span></th><th scope="col" class="num"><span>CPC</span></th><th scope="col" class="num"><span>ENADE</span></th></tr></thead>
      <tbody>
        ${FAIXAS.map(
          (fx, i) => html`<tr>
            <td>${tag(fx, tom(fx))}</td>
            <td class="num">${cc[i]}</td><td class="num">${cpc[i]}</td><td class="num">${enade[i]}</td>
          </tr>`,
        )}
      </tbody>
    </table>
  </div>`
}

function listaPrazos(cursos: Curso[]): HtmlSeguro {
  const comData = cursos
    .filter((c) => c.aberturaReconhecimento)
    .map((c) => ({ c, dias: diasAte(c.aberturaReconhecimento!) }))
    .sort((a, b) => a.dias - b.dias)
  if (!comData.length) return estadoVazio('Nenhum curso ativo com data de abertura do reconhecimento preenchida')
  return html`<div class="table-wrap">
    <table class="data">
      <caption class="sr-only">Datas de abertura do processo de reconhecimento</caption>
      <thead><tr><th scope="col"><span>Curso</span></th><th scope="col"><span>Modalidade</span></th><th scope="col"><span>Abertura do reconhecimento</span></th><th scope="col"><span>Prazo</span></th></tr></thead>
      <tbody>
        ${comData.map(
          ({ c, dias }) => html`<tr>
            <td><a class="link-btn" href="#/cursos/${encodeURIComponent(c.id)}">${c.curso}</a><div class="muted mono">e-MEC ${c.codigo_emec ?? '—'}</div></td>
            <td>${tag(c.modalidadeCurta, 'mod')}</td>
            <td>${formatarData(c.aberturaReconhecimento)}</td>
            <td>${dias < 0
              ? tag(`Data passou há ${-dias} dias`, 'alert')
              : dias <= 90
                ? tag(`Em ${dias} dias`, 'warn')
                : dias <= 365
                  ? tag(`Em ${dias} dias`, 'info')
                  : tag(`Em ${dias} dias`)}</td>
          </tr>`,
        )}
      </tbody>
    </table>
  </div>`
}

const MODULOS = [
  { codigo: 'MOD·01', titulo: 'Cadastro institucional', texto: 'Cursos e polos lidos do banco, com filtros, ficha e exportação CSV.', href: '#/cursos', status: tag('Disponível · esboço', 'ok'), meta: 'Cursos · Polos' },
  { codigo: 'MOD·02', titulo: 'Situação regulatória', texto: 'Este painel. Vencimento de atos depende de um campo de data que ainda não existe no banco.', href: '#/', status: tag('Parcial', 'warn'), meta: 'Conceitos · Prazos' },
  { codigo: 'MOD·03', titulo: 'Repositório de documentos', texto: 'Navegação nas pastas do Google Drive institucional, com busca e envio de arquivos.', href: '#/repositorio', status: tag('Esboço', 'info'), meta: 'Google Drive' },
  { codigo: 'MOD·04', titulo: 'Controle de diligências', texto: 'Registro manual de diligências, prazos e responsáveis.', href: '#/diligencias', status: tag('Planejado · Bloco 4'), meta: 'Prazos · Responsáveis' },
  { codigo: 'MOD·05', titulo: 'Perfis e permissões', texto: 'Login com Supabase Auth e escopo por perfil. Libera a edição pelo Hub.', href: '#/acessos', status: tag('Planejado · Bloco 5'), meta: 'Acesso · Perfis' },
]

export function paginaPainel(el: HTMLElement, ctx: Contexto) {
  const buscar = async () => {
    const [cursos, polos, sinc] = await Promise.all([getCursos(), getPolos(), getUltimaSincronizacao().catch(() => null)])
    return { cursos, polos, sinc }
  }

  carregarPagina(el, ctx, buscar, ({ cursos, polos, sinc }) => {
    const ativos = cursos.filter((c) => c.ativo)
    const polosAtivos = polos.filter((p) => p.ativo)
    const abaixoMin = ativos.filter((c) => [c.ccC.nota, c.cpcC.nota].some((n) => n !== null && n < MIN))
    const abaixoMeta = ativos.filter((c) => [c.ccC.nota, c.cpcC.nota].some((n) => n !== null && n < META))
    const enadeBaixo = ativos.filter((c) => c.enadeC.nota !== null && c.enadeC.nota < MIN)
    const semConceito = ativos.filter((c) => c.ccC.nota === null && c.cpcC.nota === null)
    const comPrazo = ativos.filter((c) => c.aberturaReconhecimento)
    const prazosPassados = comPrazo.filter((c) => diasAte(c.aberturaReconhecimento!) < 0)
    const prazos90 = comPrazo.filter((c) => {
      const d = diasAte(c.aberturaReconhecimento!)
      return d >= 0 && d <= 90
    })
    const porUf = contar(polosAtivos, (p) => (p.uf === 'EX' ? 'Exterior' : p.uf ?? 'Não identificada'))

    montar(
      el,
      html`${cabecalho({
          codigo: 'MOD·02 · Painel regulatório',
          titulo: 'Situação regulatória',
          descricao: `Contagens calculadas agora a partir do banco do Hub. Última sincronização da planilha: ${sinc ? sinc.toLocaleString('pt-BR') : 'não informada'}.`,
          acoes: html`<button class="btn btn-ghost" data-acao="atualizar">↻ Atualizar</button>`,
        })}
        <div class="stack">
          <section aria-labelledby="t-resumo">
            <h2 class="section-title" id="t-resumo">Resumo</h2>
            <div class="stat-grid">
              ${indicador({ rotulo: 'Cursos ativos', valor: ativos.length, sub: `de ${cursos.length} cadastrados (${cursos.length - ativos.length} inativos)` })}
              ${indicador({ rotulo: 'Polos ativos', valor: polosAtivos.length, sub: `de ${polos.length} cadastrados (${polos.length - polosAtivos.length} inativos)` })}
              ${indicador({ rotulo: `CC/CPC abaixo da meta (${META})`, valor: abaixoMeta.length, sub: `cursos ativos · ${abaixoMin.length} abaixo de ${MIN}`, tom: abaixoMeta.length ? 'warn' : 'ok' })}
              ${indicador({ rotulo: `ENADE abaixo de ${MIN}`, valor: enadeBaixo.length, sub: 'cursos ativos', tom: enadeBaixo.length ? 'alert' : 'ok' })}
              ${indicador({ rotulo: 'Sem CC e sem CPC', valor: semConceito.length, sub: 'cursos ativos (S/C, “Não há” ou vazio)' })}
              ${indicador({ rotulo: 'Reconhecimento: data passou', valor: prazosPassados.length, sub: `${prazos90.length} nos próximos 90 dias`, tom: prazosPassados.length ? 'alert' : prazos90.length ? 'warn' : 'ok' })}
            </div>
            <p class="card-sub" style="margin-top:var(--sp-2)">
              Ver na lista:
              <a href="#/cursos?situacao=ativo&conceito=abaixo-meta">CC/CPC abaixo da meta</a> ·
              <a href="#/cursos?situacao=ativo&conceito=enade-baixo">ENADE abaixo de ${MIN}</a> ·
              <a href="#/cursos?situacao=ativo&conceito=sem-conceito">sem conceito</a>
            </p>
          </section>

          <div class="grid-2">
            <section class="card" aria-labelledby="t-mod">
              <h2 class="card-title" id="t-mod">Cursos ativos por modalidade</h2>
              ${barras(contar(ativos, (c) => c.modalidadeCurta), 'var(--purple)')}
              <h2 class="card-title" style="margin-top:var(--sp-5)">Cursos ativos por grau</h2>
              ${barras(contar(ativos, (c) => c.habilitacao ?? 'Não informado'), 'var(--blue)')}
            </section>
            <section class="card" aria-labelledby="t-conc">
              <h2 class="card-title" id="t-conc">Conceitos dos cursos ativos</h2>
              ${tabelaConceitos(ativos)}
              <p class="card-sub" style="margin-top:var(--sp-2)">Meta institucional: conceito ${META} ou 5. Abaixo de ${MIN} o MEC considera insatisfatório.</p>
            </section>
          </div>

          <div class="grid-2">
            <section class="card" aria-labelledby="t-uf">
              <h2 class="card-title" id="t-uf">Polos ativos por UF</h2>
              ${barras(porUf, 'var(--green)')}
            </section>
            <section class="card" aria-labelledby="t-reg">
              <h2 class="card-title" id="t-reg">Polos ativos por região</h2>
              ${barras(contar(polosAtivos, (p) => p.regiao ?? 'Não informada'), 'var(--cyan)')}
            </section>
          </div>

          <section aria-labelledby="t-prazos">
            <h2 class="section-title" id="t-prazos">Prazos de abertura do processo de reconhecimento</h2>
            ${aviso(
              html`Datas vindas da coluna <code>cursos.abertura_processo_reconhecimento</code> (texto dd/mm/aaaa), preenchida em
                ${comPrazo.length} de ${ativos.length} cursos ativos. “Data passou” não significa irregularidade: confirme se o processo já foi protocolado.`,
              'info',
            )}
            ${listaPrazos(ativos)}
          </section>

          <section aria-labelledby="t-venc">
            <h2 class="section-title" id="t-venc">Vencimento de atos autorizativos</h2>
            ${aviso(
              html`<b>Ainda não dá para calcular.</b> O banco não tem data de validade dos atos: <code>cursos.portaria_autorizacao</code> é texto livre
                e não há registro de reconhecimento/renovação com data. Para este painel funcionar, falta uma tabela <code>atos_autorizativos</code> com:
                curso, tipo de ato (autorização, reconhecimento, renovação), número da portaria, <b>data de publicação</b> e <b>data de validade</b>.`,
              'warn',
            )}
          </section>

          <section aria-labelledby="t-modulos">
            <h2 class="section-title" id="t-modulos">Módulos do Hub</h2>
            <div class="module-grid">
              ${MODULOS.map(
                (m) => html`<a class="module-card" data-code="${m.codigo}" href="${m.href}">
                  ${m.status}
                  <h3>${m.titulo}</h3>
                  <p>${m.texto}</p>
                  <div class="meta">${m.meta}</div>
                </a>`,
              )}
            </div>
          </section>
        </div>`,
    )
    el.querySelector('[data-acao="atualizar"]')?.addEventListener('click', recarregarTela)
  })
}
