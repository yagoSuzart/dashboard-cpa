import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { carregarSessao, entrarDemo, sairDemo, carregarSelecoes, salvarSelecoes, carregarPlanilha } from './lib/api.js'
import { cobertura } from './lib/model.js'
import { escolhidasDe } from './lib/escolhas.js'
import { Loading } from './components/ui.jsx'
import Login from './views/Login.jsx'
import Overview from './views/Overview.jsx'
import Banco from './views/Banco.jsx'
import Curadoria from './views/Curadoria.jsx'
import Cobertura from './views/Cobertura.jsx'
import Setores from './views/Setores.jsx'
import Relatorio from './views/Relatorio.jsx'
import Consolidado from './views/Consolidado.jsx'

const ROTAS = [
  { k: 'visao', rotulo: 'Visão geral', ico: '◎', sec: 'Painel' },
  { k: 'banco', rotulo: 'Perguntas de hoje', ico: '☰', sec: 'Painel' },
  { k: 'curadoria', rotulo: 'Montar a base', ico: '✓', sec: 'Curadoria' },
  { k: 'cobertura', rotulo: 'Cobertura e pendências', ico: '▦', sec: 'Curadoria' },
  { k: 'setores', rotulo: 'Outras abas (setores)', ico: '⧉', sec: 'Curadoria' },
  { k: 'relatorio', rotulo: 'Relatório para o T.I', ico: '⎙', sec: 'Entrega' },
  { k: 'consolidado', rotulo: 'Visão consolidada', ico: '⚑', sec: 'Entrega', admin: true },
]

const rotaAtual = () => {
  const k = location.hash.replace(/^#\/?/, '')
  return ROTAS.some((r) => r.k === k) ? k : 'visao'
}

export default function App() {
  const [sessao, setSessao] = useState(null)
  const [dados, setDados] = useState(null)
  const [erroPlanilha, setErroPlanilha] = useState('')
  const [sel, setSel] = useState(null)
  const [salvo, setSalvo] = useState('ok')
  const [rota, setRota] = useState(rotaAtual)
  const timer = useRef(null)

  useEffect(() => {
    carregarSessao().then(setSessao)
    carregarPlanilha()
      .then(setDados)
      .catch((e) => setErroPlanilha(e.message))
    const onHash = () => {
      setRota(rotaAtual())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!sessao?.email) return
    carregarSelecoes(sessao)
      .then(setSel)
      .catch(() => setSel({ decisoes: {}, sugestoes: [], atualizadoEm: null }))
  }, [sessao])

  const persistir = useCallback(
    (novo) => {
      setSel(novo)
      setSalvo('salvando')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        salvarSelecoes(sessao, novo)
          .then(() => setSalvo('ok'))
          .catch(() => setSalvo('erro'))
      }, 700)
    },
    [sessao],
  )

  const selRef = useRef(null)
  useEffect(() => {
    selRef.current = sel
  }, [sel])

  const decidir = useCallback(
    (id, status, nota, soNota) => {
      const atual = selRef.current
      const decisoes = { ...atual.decisoes }
      const antes = decisoes[id] || {}
      const d = { status: soNota ? antes.status || null : status, nota: nota ?? antes.nota ?? '', em: new Date().toISOString() }
      if (!d.status && !d.nota) delete decisoes[id]
      else decisoes[id] = d
      const novo = { ...atual, decisoes }
      selRef.current = novo
      persistir(novo)
    },
    [persistir],
  )

  const setSugestoes = useCallback((sugestoes) => {
    const novo = { ...selRef.current, sugestoes }
    selRef.current = novo
    persistir(novo)
  }, [persistir])

  const model = dados?.model
  const escolhidas = useMemo(
    () => (model && sel ? escolhidasDe(model, [{ ...sel, email: sessao?.email, nome: sessao?.nome }]) : []),
    [model, sel, sessao],
  )
  const cobHoje = useMemo(() => (model ? cobertura(model) : []), [model])
  const cobSel = useMemo(() => (model ? cobertura(model, escolhidas.filter((q) => q.dim)) : []), [model, escolhidas])

  if (!sessao) return <Loading texto="Verificando acesso…" />
  if (sessao.modo === 'negado') return <Login negado />
  if (!sessao.email) return <Login onEntrar={(email) => setSessao(entrarDemo(email))} />
  if (erroPlanilha)
    return (
      <div className="center-screen">
        <div style={{ maxWidth: 460 }}>
          <h2>Não foi possível ler a planilha</h2>
          <p className="muted">{erroPlanilha}</p>
        </div>
      </div>
    )
  if (!model || !sel) return <Loading texto="Lendo a planilha da CPA…" />

  const ir = (k) => (location.hash = '/' + k)
  const recarregar = () =>
    carregarPlanilha(true)
      .then(setDados)
      .catch((e) => setErroPlanilha(e.message))
  const rotas = ROTAS.filter((r) => !r.admin || sessao.admin)
  const nDecididas = model.propostas.filter((q) => sel.decisoes[q.id]?.status).length
  const titulo = ROTAS.find((r) => r.k === rota)?.rotulo
  const sair = () => {
    if (sessao.modo === 'nuvem') location.href = '/cdn-cgi/access/logout'
    else {
      sairDemo()
      setSel(null)
      setSessao({ modo: 'demo', email: null })
    }
  }
  const props = { model, sessao, sel, decidir, setSugestoes, cobHoje, cobSel, escolhidas, nDecididas, ir }

  return (
    <div className="shell">
      <aside className="side">
        <div className="side-logo">
          <img src="/logo-unifecaf-branco.png" alt="UniFECAF" />
          <div className="side-tag">
            <span className="dot" /> CPA · Banco de Perguntas
          </div>
        </div>
        <nav className="nav">
          {rotas.map((r, i) => (
            <div key={r.k} style={{ display: 'contents' }}>
              {(i === 0 || rotas[i - 1].sec !== r.sec) && <div className="nav-sec">{r.sec}</div>}
              <a href={'#/' + r.k} className={rota === r.k ? 'on' : ''}>
                <span className="ico" aria-hidden="true">
                  {r.ico}
                </span>
                {r.rotulo}
                {r.k === 'curadoria' && (
                  <span className="count">
                    {nDecididas}/{model.propostas.length}
                  </span>
                )}
              </a>
            </div>
          ))}
        </nav>
        <div className="side-deco" aria-hidden="true">
          <i className="t1" />
          <i className="t2" />
          <i className="t3" />
        </div>
        <div className="side-foot">
          Fonte: {dados.fonte}
          <br />
          Lida às {dados.carregadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
          <button type="button" onClick={recarregar}>
            recarregar
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <div className="crumb">
            CPA 2026 / <b>{titulo}</b>
          </div>
          <div className="spacer" />
          <span className="chip" title="Salvamento automático">
            <span className={`led ${salvo === 'ok' ? '' : salvo === 'salvando' ? 'warn' : 'off'}`} />
            {salvo === 'ok' ? 'Tudo salvo' : salvo === 'salvando' ? 'Salvando…' : 'Erro ao salvar'}
          </span>
          <span className="chip" title={dados.fonte}>
            <span className={`led ${dados.fonte.includes('Drive') ? '' : 'off'}`} />
            {dados.fonte.includes('Drive') ? 'Planilha ao vivo' : 'Cópia local da planilha'}
          </span>
          <span className="chip user-chip">
            <span className="avatar">{(sessao.nome || sessao.email)[0]}</span>
            {sessao.nome || sessao.email}
            {sessao.admin && sessao.modo === 'nuvem' ? ' · admin' : ''}
          </span>
          <button className="btn sm" onClick={sair}>
            Sair
          </button>
        </header>
        <div className="content">
          {sessao.modo === 'demo' && (
            <div className="banner no-print">
              <b>Modo demonstração.</b> As escolhas ficam salvas só neste navegador. Com o Cloudflare Access
              configurado, cada pessoa entra com o próprio e-mail e as escolhas ficam na nuvem.
            </div>
          )}
          {rota === 'visao' && <Overview {...props} />}
          {rota === 'banco' && <Banco {...props} />}
          {rota === 'curadoria' && <Curadoria {...props} />}
          {rota === 'cobertura' && <Cobertura {...props} />}
          {rota === 'setores' && <Setores {...props} />}
          {rota === 'relatorio' && <Relatorio {...props} />}
          {rota === 'consolidado' && sessao.admin && <Consolidado {...props} />}
        </div>
      </main>
    </div>
  )
}
