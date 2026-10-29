// Ponto de entrada: monta o app shell (menu + topo) e liga as rotas às páginas.
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/shell.css'

import { CONFIG } from './config'
import { html, montar } from './lib/html'
import { iniciarRotas, type Migalha, type Rota } from './lib/router'
import { paginaPainel } from './paginas/painel'
import { paginaCursos, paginaFichaCurso } from './paginas/cursos'
import { paginaPolos } from './paginas/polos'
import { paginaRepositorio } from './paginas/repositorio'
import { paginaDiligencias } from './paginas/diligencias'
import { paginaAcessos } from './paginas/acessos'

const RAIZ: Migalha = { rotulo: 'Hub Regulatório', href: '#/' }

const MENU = [
  { secao: 'painel', href: '#/', rotulo: 'Painel', icone: '📊', codigo: 'MOD·02' },
  { secao: 'cursos', href: '#/cursos', rotulo: 'Cursos', icone: '🎓', codigo: 'MOD·01' },
  { secao: 'polos', href: '#/polos', rotulo: 'Polos', icone: '📍', codigo: 'MOD·01' },
  { secao: 'repositorio', href: '#/repositorio', rotulo: 'Repositório', icone: '🗂️', codigo: 'MOD·03' },
  { secao: 'diligencias', href: '#/diligencias', rotulo: 'Diligências', icone: '⏱️', codigo: 'MOD·04' },
  { secao: 'acessos', href: '#/acessos', rotulo: 'Acessos', icone: '🔐', codigo: 'MOD·05' },
]

const ROTAS: Rota[] = [
  { caminho: '/', secao: 'painel', titulo: 'Painel', migalhas: [{ rotulo: 'Painel' }], render: paginaPainel },
  { caminho: '/cursos', secao: 'cursos', titulo: 'Cursos', migalhas: [{ rotulo: 'Cursos' }], render: paginaCursos },
  { caminho: '/cursos/:id', secao: 'cursos', titulo: 'Ficha do curso', migalhas: [{ rotulo: 'Cursos', href: '#/cursos' }], render: paginaFichaCurso },
  { caminho: '/polos', secao: 'polos', titulo: 'Polos', migalhas: [{ rotulo: 'Polos' }], render: paginaPolos },
  { caminho: '/repositorio', secao: 'repositorio', titulo: 'Repositório', migalhas: [{ rotulo: 'Repositório' }], render: paginaRepositorio },
  { caminho: '/diligencias', secao: 'diligencias', titulo: 'Diligências', migalhas: [{ rotulo: 'Diligências' }], render: paginaDiligencias },
  { caminho: '/acessos', secao: 'acessos', titulo: 'Acessos', migalhas: [{ rotulo: 'Perfis e acessos' }], render: paginaAcessos },
]

const $ = (id: string) => document.getElementById(id) as HTMLElement
const shell = $('shell')
const menuBtn = $('menu-btn')

// ---------- Menu lateral ----------
function desenharMenu(secaoAtual: string) {
  montar(
    $('menu-itens'),
    html`<div class="nav-title">Módulos</div>
      <ul class="nav">
        ${MENU.map(
          (m) => html`<li><a href="${m.href}" ${m.secao === secaoAtual ? html`aria-current="page"` : ''}>
            <span class="ico" aria-hidden="true">${m.icone}</span>${m.rotulo}<span class="code">${m.codigo}</span></a></li>`,
        )}
      </ul>
      <div class="nav-title">Atalhos externos</div>
      <ul class="nav">
        ${CONFIG.atalhos.map(
          (a) => html`<li><a href="${a.url}" target="_blank" rel="noopener">
            <span class="ico" aria-hidden="true">↗</span>${a.nome}<span class="ext">(nova aba)</span></a></li>`,
        )}
      </ul>`,
  )
}

// ---------- Breadcrumb ----------
function desenharMigalhas(itens: Migalha[]) {
  const todos = [RAIZ, ...itens]
  montar(
    $('migalhas'),
    html`<ol>
      ${todos.map((m, i) =>
        i === todos.length - 1 || !m.href
          ? html`<li><span ${i === todos.length - 1 ? html`aria-current="page"` : ''}>${m.rotulo}</span></li>`
          : html`<li><a href="${m.href}">${m.rotulo}</a></li>`,
      )}
    </ol>`,
  )
}

// ---------- Menu no celular ----------
function abrirMenu(abrir: boolean) {
  shell.classList.toggle('menu-aberto', abrir)
  menuBtn.setAttribute('aria-expanded', String(abrir))
  menuBtn.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu')
  if (abrir) $('menu').querySelector<HTMLElement>('a')?.focus()
}
menuBtn.addEventListener('click', () => abrirMenu(!shell.classList.contains('menu-aberto')))
$('scrim').addEventListener('click', () => abrirMenu(false))
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && shell.classList.contains('menu-aberto')) {
    abrirMenu(false)
    menuBtn.focus()
  }
})

// ---------- Troca de página ----------
let primeiraVez = true
iniciarRotas(
  ROTAS,
  (rota, el, ctx) => {
    abrirMenu(false)
    desenharMenu(rota.secao)
    desenharMigalhas(rota.migalhas)
    document.title = `${rota.titulo} · Hub Regulatório · UniFECAF`
    ctx.migalhas = (extra) => {
      if (!ctx.ativo()) return
      desenharMigalhas([...rota.migalhas, ...extra])
      document.title = `${extra[extra.length - 1]?.rotulo ?? rota.titulo} · Hub Regulatório · UniFECAF`
    }
    // Cada página ganha um contêiner novo: os "ouvintes" de clique da página anterior somem junto com ele
    const pagina = document.createElement('div')
    el.replaceChildren(pagina)
    window.scrollTo(0, 0)
    // Leva o foco ao conteúdo ao trocar de tela (quem usa leitor de tela ouve a nova página)
    if (!primeiraVez) el.focus({ preventScroll: true })
    primeiraVez = false
    Promise.resolve(rota.render(pagina, ctx)).catch((erro) => console.error(erro))
  },
  $('conteudo'),
)
