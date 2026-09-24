import { useCallback, useEffect, useMemo, useState } from 'react'
import { sb, carregarPerfil, carregarBase, sair } from './lib/dados.js'
import { ROLE_LABELS, IMPORTA_ROLES, LINKS } from './lib/config.js'
import { cursosDoEscopo, ehSetor, planosDoEscopo } from './lib/escopo.js'
import { Carregando, Erro } from './components/ui.jsx'
import Login, { TrocarSenha } from './views/Login.jsx'
import Inicio from './views/Inicio.jsx'
import Curso from './views/Curso.jsx'
import Questionarios from './views/Questionarios.jsx'
import Comentarios from './views/Comentarios.jsx'
import Planos from './views/Planos.jsx'
import Setores from './views/Setores.jsx'
import Importar from './views/Importar.jsx'

function lerRota() {
  const [rota = 'inicio', ...resto] = location.hash.replace(/^#\/?/, '').split('/')
  return { rota: rota || 'inicio', param: resto.join('/') ? decodeURIComponent(resto.join('/')) : '' }
}

export default function App() {
  const [sessao, setSessao] = useState(undefined)
  const [perfil, setPerfil] = useState(null)
  const [base, setBase] = useState(null)
  const [erro, setErro] = useState(null)
  const [rota, setRota] = useState(lerRota)
  const [recuperando, setRecuperando] = useState(false)

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = sb.auth.onAuthStateChange((evento, s) => {
      setSessao(s)
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true)
    })
    const onHash = () => setRota(lerRota())
    window.addEventListener('hashchange', onHash)
    return () => {
      data.subscription.unsubscribe()
      window.removeEventListener('hashchange', onHash)
    }
  }, [])

  const userId = sessao?.user?.id
  useEffect(() => {
    if (!userId) return
    let vivo = true
    Promise.all([carregarPerfil(), carregarBase()])
      .then(([p, b]) => {
        if (!vivo) return
        setPerfil(p)
        setBase(b)
      })
      .catch((e) => vivo && setErro(e))
    return () => {
      vivo = false
    }
  }, [userId])

  const recarregarBase = useCallback(() => carregarBase().then(setBase), [])

  const escopo = useMemo(() => (perfil && base && !perfil.semPerfil ? cursosDoEscopo(perfil, base.cursos) : []), [perfil, base])
  const planos = useMemo(() => (perfil && base && !perfil.semPerfil ? planosDoEscopo(perfil, base.planos, escopo) : []), [perfil, base, escopo])

  if (sessao === undefined) return <Carregando texto="Abrindo o Portal…" />
  if (recuperando) return <TrocarSenha onFim={() => setRecuperando(false)} />
  if (!sessao) return <Login />
  if (erro)
    return (
      <div className="conteudo">
        <Erro erro={erro} />
        <button className="btn" onClick={() => sair()}>Sair</button>
      </div>
    )
  if (!perfil || !base) return <Carregando texto="Carregando os resultados da CPA…" />
  if (perfil.semPerfil)
    return (
      <div className="centro">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 440 }}>
          <h2>Seu acesso ainda não foi liberado</h2>
          <p className="muted">O e-mail {perfil.email} entrou, mas ainda não tem perfil no Portal. Peça a liberação para a Coordenação da CPA.</p>
          <button className="btn" onClick={() => sair()}>Sair</button>
        </div>
      </div>
    )

  const setor = ehSetor(perfil)
  const podeImportar = IMPORTA_ROLES.includes(perfil.role)
  const nav = setor
    ? [
        { k: 'setores', t: 'Meu setor' },
        { k: 'planos', t: 'Planos e demandas' },
      ]
    : [
        { k: 'inicio', t: 'Visão geral' },
        { k: 'curso', t: 'Cursos' },
        { k: 'questionarios', t: 'Pergunta por pergunta' },
        { k: 'comentarios', t: 'Comentários' },
        { k: 'planos', t: 'Planos de ação' },
        ...(perfil.global ? [{ k: 'setores', t: 'Setores' }] : []),
        ...(podeImportar ? [{ k: 'importar', t: 'Importar CPA' }] : []),
      ]
  const atual = nav.some((n) => n.k === rota.rota) ? rota.rota : nav[0].k
  const props = { perfil, base, escopo, planos, param: atual === rota.rota ? rota.param : '', recarregarBase }
  const iniciais = (perfil.nome || perfil.email || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      <header className="top">
        <a href="#/"><img className="logo" src="/logo-unifecaf.png" alt="UniFECAF · Portal CPA" /></a>
        <nav className="pilula" aria-label="Áreas do Portal">
          {nav.map((n) => (
            <a key={n.k} href={'#/' + n.k} aria-current={atual === n.k ? 'page' : undefined}>{n.t}</a>
          ))}
          <a href={LINKS.bancoPerguntas} target="_blank" rel="noreferrer">Banco de perguntas ↗</a>
        </nav>
        <div className="spacer" />
        <div className="quem">
          <div className="av" aria-hidden="true">{iniciais}</div>
          <div className="nm">
            <b>{perfil.nome}</b>
            <span>{ROLE_LABELS[perfil.role] || perfil.role}</span>
          </div>
        </div>
        <button className="btn sm" onClick={() => sair()}>Sair</button>
      </header>
      <main className="conteudo">
        {atual === 'inicio' && <Inicio {...props} />}
        {atual === 'curso' && <Curso {...props} />}
        {atual === 'questionarios' && <Questionarios {...props} />}
        {atual === 'comentarios' && <Comentarios {...props} />}
        {atual === 'planos' && <Planos {...props} />}
        {atual === 'setores' && <Setores {...props} />}
        {atual === 'importar' && <Importar {...props} />}
      </main>
    </>
  )
}
