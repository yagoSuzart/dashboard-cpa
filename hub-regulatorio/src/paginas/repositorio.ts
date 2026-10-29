// Bloco 3 (esboço) · Repositório: navegação no Google Drive de verdade (pastas, busca, abrir, enviar).
// Sem Client ID configurado → modo somente leitura: mostra as pastas institucionais e abre no Drive.
import { CONFIG } from '../config'
import {
  PASTA, buscarNoDrive, conectado, driveConfigurado, entrar, enviarArquivo, ErroDrive,
  linkPastaNoDrive, listarPasta, sair, tamanho, tipoArquivo, type ArquivoDrive,
} from '../lib/drive'
import { html, montar, urlSegura, type HtmlSeguro } from '../lib/html'
import { chave } from '../lib/normaliza'
import type { Contexto } from '../lib/router'
import { aviso, cabecalho, carregando, estadoErro, estadoVazio, tag } from '../ui/componentes'

type Visao = 'lista' | 'grade'
interface Nivel {
  id: string
  nome: string
}

// Estado guardado enquanto a aba estiver aberta
const estado = {
  caminho: [] as Nivel[], // vazio = raiz (pastas institucionais)
  visao: lerVisao(),
  filtro: '',
  busca: null as { termo: string; itens: ArquivoDrive[] } | null,
}
const cachePastas = new Map<string, ArquivoDrive[]>()

function lerVisao(): Visao {
  try {
    return localStorage.getItem('hub.repositorio.visao') === 'grade' ? 'grade' : 'lista'
  } catch {
    return 'lista'
  }
}
function salvarVisao(v: Visao) {
  try {
    localStorage.setItem('hub.repositorio.visao', v)
  } catch {
    /* navegador sem armazenamento: só não lembra a preferência */
  }
}

const pastaAtual = () => estado.caminho[estado.caminho.length - 1] ?? null
const dataCurta = (s?: string) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—')

// Itens da raiz = pastas configuradas em config.ts (não vêm da API)
const raiz = (): ArquivoDrive[] => CONFIG.pastasRaiz.map((p) => ({ id: p.id, name: p.nome, mimeType: PASTA }))

// ---------------------------------------------------------------------
//  Desenho
// ---------------------------------------------------------------------
function itemLista(a: ArquivoDrive): HtmlSeguro {
  const t = tipoArquivo(a.mimeType)
  const nome = html`<span class="file-row-name"><span class="file-ico" aria-hidden="true">${t.icone}</span>${a.name}</span>`
  const link = urlSegura(a.webViewLink)
  const abrir =
    a.mimeType === PASTA
      ? html`<button type="button" class="link-btn" data-abrir-pasta="${a.id}" data-nome="${a.name}">${nome}</button>`
      : link
        ? html`<a class="link-btn" href="${link}" target="_blank" rel="noopener">${nome}<span class="sr-only"> (abre no Google Drive)</span></a>`
        : nome
  return html`<tr>
    <td>${abrir}</td>
    <td>${t.rotulo}</td>
    <td>${a.owners?.[0]?.displayName ?? '—'}</td>
    <td>${dataCurta(a.modifiedTime)}</td>
    <td class="num">${a.mimeType === PASTA ? '—' : tamanho(a.size)}</td>
  </tr>`
}

function itemGrade(a: ArquivoDrive): HtmlSeguro {
  const t = tipoArquivo(a.mimeType)
  const corpo = html`<span class="file-ico" aria-hidden="true">${t.icone}</span>
    <span class="file-name">${a.name}</span>
    <span class="file-meta">${t.rotulo}${a.modifiedTime ? html` · ${dataCurta(a.modifiedTime)}` : ''}</span>`
  const link = urlSegura(a.webViewLink)
  if (a.mimeType === PASTA) return html`<button type="button" class="file-tile" data-abrir-pasta="${a.id}" data-nome="${a.name}">${corpo}</button>`
  return link ? html`<a class="file-tile" href="${link}" target="_blank" rel="noopener">${corpo}</a>` : html`<div class="file-tile">${corpo}</div>`
}

function conteudo(itens: ArquivoDrive[], vazio: HtmlSeguro): HtmlSeguro {
  const termo = chave(estado.filtro)
  const visiveis = termo ? itens.filter((a) => chave(a.name).includes(termo)) : itens
  if (!visiveis.length) return termo ? estadoVazio('Nada com esse nome nesta pasta', 'Tente “Buscar no conteúdo dos arquivos”, que procura também dentro dos documentos.', '🔍') : vazio
  if (estado.visao === 'grade') return html`<div class="file-grid">${visiveis.map(itemGrade)}</div>`
  return html`<div class="table-wrap"><table class="data">
    <caption class="sr-only">Conteúdo da pasta</caption>
    <thead><tr>
      <th scope="col"><span>Nome</span></th><th scope="col"><span>Tipo</span></th><th scope="col"><span>Proprietário</span></th>
      <th scope="col"><span>Modificado</span></th><th scope="col" class="num"><span>Tamanho</span></th>
    </tr></thead>
    <tbody>${visiveis.map(itemLista)}</tbody>
  </table></div>`
}

function migalhasDrive(): HtmlSeguro {
  const niveis = [{ id: '', nome: 'Pastas institucionais' }, ...estado.caminho]
  return html`<nav aria-label="Pastas"><ol class="drive-crumbs">
    ${niveis.map((n, i) =>
      i === niveis.length - 1 && !estado.busca
        ? html`<li><span aria-current="page">${n.nome}</span></li>`
        : html`<li><button type="button" data-nivel="${i}">${n.nome}</button></li>`,
    )}
    ${estado.busca ? html`<li><span aria-current="page">Busca: “${estado.busca.termo}”</span></li>` : ''}
  </ol></nav>`
}

// ---------------------------------------------------------------------
//  Página
// ---------------------------------------------------------------------
export function paginaRepositorio(el: HTMLElement, ctx: Contexto) {
  const configurado = driveConfigurado()

  const desenharTopo = () => {
    const logado = conectado()
    const podeEnviar = logado && !!pastaAtual() && !estado.busca
    montar(
      el,
      html`${cabecalho({
          codigo: 'MOD·03 · Repositório de documentos',
          titulo: 'Repositório',
          descricao: 'Pastas e arquivos do Google Drive institucional. Os arquivos ficam no Drive: o Hub só navega, abre e envia.',
          acoes: html`${configurado
            ? logado
              ? html`<button class="btn btn-ghost" data-acao="sair">Sair do Google</button>`
              : html`<button class="btn btn-primary" data-acao="entrar">Entrar com Google</button>`
            : ''}
            <button class="btn ${logado ? 'btn-primary' : 'btn-ghost'}" data-acao="enviar" ${podeEnviar ? '' : html`disabled`}
              title="${podeEnviar ? 'Enviar arquivos para esta pasta' : !configurado ? 'Disponível depois de configurar o Client ID' : !logado ? 'Entre com Google para enviar' : 'Abra uma pasta para enviar arquivos'}">⬆ Enviar arquivo</button>
            <input type="file" id="arquivo" multiple hidden />`,
        })}
        ${!configurado
          ? aviso(
              html`<b>Modo somente leitura.</b> O Client ID do Google ainda não foi configurado (arquivo <code>src/config.ts</code>, campo
                <code>google.clientId</code>). Por enquanto as pastas abrem direto no Google Drive, em nova aba. Veja o passo a passo no README.`,
              'warn',
            )
          : !logado
            ? aviso(html`Entre com sua conta Google institucional para navegar nas pastas e enviar arquivos. O acesso segue as permissões que você já tem no Drive.`, 'info')
            : ''}
        <form class="toolbar" role="search" aria-label="Buscar arquivos">
          <div class="field field-grow">
            <label for="f-arquivo">Filtrar nesta pasta</label>
            <input class="input" id="f-arquivo" type="search" value="${estado.filtro}" placeholder="Nome ou palavra (Enter busca dentro dos documentos)…" autocomplete="off" />
          </div>
          <button type="submit" class="btn btn-ghost" ${logado ? '' : html`disabled`}>🔎 Buscar no conteúdo dos arquivos</button>
          <div class="toolbar-end">
            <div class="seg" role="group" aria-label="Modo de exibição">
              <button type="button" data-visao="lista" aria-pressed="${estado.visao === 'lista'}">☰ Lista</button>
              <button type="button" data-visao="grade" aria-pressed="${estado.visao === 'grade'}">▦ Grade</button>
            </div>
          </div>
        </form>
        <div id="migalhas-drive">${migalhasDrive()}</div>
        <div class="dropzone" id="area" aria-live="polite"></div>
        <ul class="uploads" id="envios" aria-label="Envios em andamento"></ul>`,
    )
  }

  const area = () => el.querySelector<HTMLElement>('#area')!
  let itensAtuais: ArquivoDrive[] = []

  const mostrarErro = (e: unknown) => {
    const msg = e instanceof ErroDrive || e instanceof Error ? e.message : 'Erro inesperado.'
    montar(area(), estadoErro(msg))
  }

  async function carregarArea() {
    montar(el.querySelector('#migalhas-drive')!, migalhasDrive())
    const pasta = pastaAtual()

    if (estado.busca) {
      itensAtuais = estado.busca.itens
      montar(area(), html`<p class="result-count">${itensAtuais.length}${itensAtuais.length === 200 ? '+' : ''} arquivo(s) com “${estado.busca.termo}” no nome ou no texto, do mais para o menos relevante. O Drive não informa o trecho encontrado: abra o arquivo e use Ctrl+F.</p>${conteudo(itensAtuais, estadoVazio('Nenhum arquivo encontrado', `Nenhum arquivo com “${estado.busca.termo}” no nome ou no texto.`, '🔍'))}`)
      return
    }
    if (!pasta) {
      itensAtuais = raiz()
      if (!conectado()) {
        // Sem login: cada pasta abre direto no Drive (nova aba)
        montar(
          area(),
          html`<div class="file-grid">${CONFIG.pastasRaiz.map(
            (p) => html`<a class="file-tile" href="${linkPastaNoDrive(p.id)}" target="_blank" rel="noopener">
              <span class="file-ico" aria-hidden="true">${p.icone}</span>
              <span class="file-name">${p.nome}</span>
              <span class="file-meta">Abrir no Google Drive ↗</span>
            </a>`,
          )}</div>`,
        )
        return
      }
      montar(area(), conteudo(itensAtuais, estadoVazio('Nenhuma pasta configurada', 'Adicione pastas em CONFIG.pastasRaiz.')))
      return
    }

    try {
      if (!cachePastas.has(pasta.id)) {
        montar(area(), carregando('Abrindo pasta no Google Drive…'))
        cachePastas.set(pasta.id, await listarPasta(pasta.id))
      }
      if (!ctx.ativo() || pastaAtual()?.id !== pasta.id) return
      itensAtuais = cachePastas.get(pasta.id)!
      montar(area(), conteudo(itensAtuais, estadoVazio('Pasta vazia', 'Arraste arquivos para cá ou use “Enviar arquivo”.', '📂')))
    } catch (e) {
      if (e instanceof ErroDrive && e.tipo === 'sessao') {
        // Sessão expirou: volta para o início, mostra "Entrar com Google" de novo
        estado.caminho = []
        desenharTopo()
      }
      mostrarErro(e)
    }
  }

  const desenharTudo = () => {
    desenharTopo()
    carregarArea()
  }

  async function fazerLogin() {
    try {
      await entrar()
      desenharTudo()
    } catch (e) {
      mostrarErro(e)
    }
  }

  async function enviar(arquivos: FileList | File[]) {
    const pasta = pastaAtual()
    if (!pasta || !conectado()) return
    const lista = el.querySelector<HTMLElement>('#envios')!
    await Promise.all(
      [...arquivos].map(async (arq) => {
        const li = document.createElement('li')
        montar(li, html`<span>${arq.name}</span><progress max="1" value="0" aria-label="Progresso de ${arq.name}"></progress><span class="estado">${tamanho(String(arq.size))}</span>`)
        lista.append(li)
        const barra = li.querySelector('progress')!
        const st = li.querySelector<HTMLElement>('.estado')!
        try {
          await enviarArquivo(arq, pasta.id, (p) => (barra.value = p))
          barra.value = 1
          montar(st, tag('Enviado', 'ok'))
        } catch (e) {
          montar(st, tag(e instanceof Error ? e.message : 'Falhou', 'alert'))
        }
      }),
    )
    cachePastas.delete(pasta.id)
    if (pastaAtual()?.id === pasta.id) carregarArea()
  }

  // ---------- Eventos ----------
  el.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    const pasta = t.closest<HTMLElement>('[data-abrir-pasta]')
    if (pasta) {
      if (!conectado()) return void fazerLogin()
      if (estado.busca) {
        estado.busca = null
        estado.caminho = [] // a busca não sabe o caminho completo: a pasta vira o início
      }
      estado.caminho.push({ id: pasta.dataset.abrirPasta!, nome: pasta.dataset.nome ?? 'Pasta' })
      estado.filtro = ''
      ;(el.querySelector('#f-arquivo') as HTMLInputElement).value = ''
      desenharTopo()
      carregarArea()
      return
    }
    const nivel = t.closest<HTMLElement>('[data-nivel]')?.dataset.nivel
    if (nivel !== undefined) {
      estado.caminho = estado.caminho.slice(0, Number(nivel))
      estado.busca = null
      desenharTopo()
      carregarArea()
      return
    }
    const visao = t.closest<HTMLElement>('[data-visao]')?.dataset.visao as Visao | undefined
    if (visao) {
      estado.visao = visao
      salvarVisao(visao)
      el.querySelectorAll<HTMLElement>('[data-visao]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.visao === visao)))
      carregarArea()
      return
    }
    const acao = t.closest<HTMLElement>('[data-acao]')?.dataset.acao
    if (acao === 'entrar') fazerLogin()
    if (acao === 'sair') {
      sair()
      cachePastas.clear()
      estado.caminho = []
      estado.busca = null
      desenharTudo()
    }
    if (acao === 'enviar') el.querySelector<HTMLInputElement>('#arquivo')?.click()
    if (acao === 'tentar-de-novo') {
      const p = pastaAtual()
      if (p) cachePastas.delete(p.id)
      carregarArea()
    }
  })

  el.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement
    if (t.id !== 'f-arquivo') return
    estado.filtro = t.value
    if (pastaAtual() || estado.busca || conectado()) montar(area(), conteudo(itensAtuais, estadoVazio('Pasta vazia')))
  })

  el.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement
    if (t.id === 'arquivo' && t.files?.length) {
      enviar(t.files)
      t.value = ''
    }
  })

  el.addEventListener('submit', async (e) => {
    e.preventDefault()
    const termo = estado.filtro.trim()
    if (!termo || !conectado()) return
    montar(area(), carregando('Buscando no Google Drive…'))
    try {
      estado.busca = { termo, itens: await buscarNoDrive(termo) }
      estado.filtro = ''
      ;(el.querySelector('#f-arquivo') as HTMLInputElement).value = ''
      desenharTopo()
      carregarArea()
    } catch (err) {
      mostrarErro(err)
    }
  })

  // Arrastar e soltar arquivos na área da pasta
  el.addEventListener('dragover', (e) => {
    if (!(e.target as HTMLElement).closest('#area') || !pastaAtual() || !conectado() || estado.busca) return
    e.preventDefault()
    area().classList.add('is-over')
  })
  el.addEventListener('dragleave', (e) => {
    if (!(e.relatedTarget as HTMLElement | null)?.closest?.('#area')) area().classList.remove('is-over')
  })
  el.addEventListener('drop', (e) => {
    if (!(e.target as HTMLElement).closest('#area')) return
    e.preventDefault()
    area().classList.remove('is-over')
    if (e.dataTransfer?.files.length) enviar(e.dataTransfer.files)
  })

  desenharTudo()
}
