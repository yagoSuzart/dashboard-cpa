import { useCallback, useEffect, useMemo, useState } from 'react'
import { sb, carregarPerfil, carregarBase, sair } from './lib/dados.js'
import { ROLE_LABELS, IMPORTA_ROLES, LINKS } from './lib/config.js'
import { cursosDoEscopo, ehSetor, planosDoEscopo } from './lib/escopo.js'
import { Carregando, Erro } from './components/ui.jsx'
import Login, { TrocarSenha } from './views/Login.jsx'
import SolicitarAcesso from './views/SolicitarAcesso.jsx'
import PrimeiroAcesso from './views/PrimeiroAcesso.jsx'
import Inicio from './views/Inicio.jsx'
import Executiva from './views/Executiva.jsx'
import Curso from './views/Curso.jsx'
import Questionario6 from './views/Questionario6.jsx'
import Questionarios from './views/Questionarios.jsx'
import Professores from './views/Professores.jsx'
import Comentarios from './views/Comentarios.jsx'
import Planos from './views/Planos.jsx'
import Nucleo from './views/Nucleo.jsx'
import Setores from './views/Setores.jsx'
import MeuSetor from './views/MeuSetor.jsx'
import NucleoSetores from './views/NucleoSetores.jsx'
import Agenda from './views/Agenda.jsx'
import Feedback from './views/Feedback.jsx'
import Importar from './views/Importar.jsx'
import Admin from './views/Admin.jsx'
import ProximaCPA from './views/ProximaCPA.jsx'
import FormPlano from './components/FormPlano.jsx'
import { LE_PROPOSTA } from './lib/proxima.js'
import { podeVerAgenda, verificarCumprimentoEntrega } from './lib/agenda.js'
import { ESCREVE_PLANO } from './lib/planos.js'

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
  const [pedindo, setPedindo] = useState(false)
  const [aviso, setAviso] = useState(null)

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
  // Depois de enviar um plano: dá baixa na cobrança de entrega pendente (como no sistema anterior)
  const aoEnviarPlano = useCallback(() => perfil && verificarCumprimentoEntrega(perfil), [perfil])

  const escopoIds = useMemo(() => (perfil && base && !perfil.semPerfil ? cursosDoEscopo(perfil, base.cursos) : []), [perfil, base])
  const planos = useMemo(() => (perfil && base && !perfil.semPerfil ? planosDoEscopo(perfil, base.planos, escopoIds) : []), [perfil, base, escopoIds])

  if (sessao === undefined) return <Carregando texto="Abrindo o Portal…" />
  if (recuperando) return <TrocarSenha onFim={() => setRecuperando(false)} />
  if (!sessao) return pedindo ? <SolicitarAcesso onVoltar={() => setPedindo(false)} /> : <Login onSolicitar={() => setPedindo(true)} />
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
  const r = perfil.role
  const podeImportar = IMPORTA_ROLES.includes(r)
  const temCursos = perfil.cursos.length > 0
  const grupos = setor
    ? [
        {
          g: 'Setor',
          itens: [
            ...(r === 'diretor_nucleo_setor' ? [{ k: 'nucleo-setores', t: 'Núcleo de setores' }] : [{ k: 'meu-setor', t: 'Meu setor' }]),
            { k: 'setores', t: 'Setores' },
            { k: 'planos', t: 'Planos e demandas' },
          ],
        },
      ]
    : [
        {
          g: 'Resultados',
          itens: [
            { k: 'inicio', t: 'Visão geral' },
            { k: 'executiva', t: 'Visão executiva' },
            { k: 'curso', t: 'Cursos' },
            { k: 'q', t: 'Questionários' },
            { k: 'questionarios', t: 'Pergunta por pergunta' },
            ...(r !== 'professor_auxiliar' ? [{ k: 'professores', t: 'Por professor' }] : []),
            { k: 'comentarios', t: 'Comentários' },
            ...(r === 'diretor_nucleo' || perfil.global ? [{ k: 'nucleo', t: 'Núcleos' }] : []),
            ...(perfil.global ? [{ k: 'setores', t: 'Setores' }] : []),
          ],
        },
        {
          g: 'Planos',
          itens: [
            { k: 'planos', t: 'Planos de ação' },
            ...(podeVerAgenda(perfil) ? [{ k: 'agenda', t: r === 'admin' ? 'Agenda e prazos' : 'Agenda de entregas' }] : []),
            ...(temCursos ? [{ k: 'feedback', t: 'Feedback para os alunos' }] : []),
          ],
        },
        {
          g: 'CPA',
          itens: [
            ...(LE_PROPOSTA.includes(r) ? [{ k: 'proxima', t: 'Próxima CPA' }] : []),
            ...(podeImportar ? [{ k: 'importar', t: 'Importar CPA' }] : []),
            ...(r === 'admin' ? [{ k: 'admin', t: 'Administração' }] : []),
          ],
        },
      ].filter((g) => g.itens.length)
  const nav = grupos.flatMap((g) => g.itens)
  const atual = nav.some((n) => n.k === rota.rota) ? rota.rota : nav[0].k
  const param = atual === rota.rota ? rota.param : ''
  const props = { perfil, base, escopo: escopoIds, planos, param, recarregarBase, aoEnviarPlano }
  const iniciais = (perfil.nome || perfil.email || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const escreve = ESCREVE_PLANO.includes(r) && temCursos
  const [codQ, paramQ = ''] = param.split('/')

  // Formulário do plano dentro de cada questionário (sem rascunho: envia direto para a análise)
  const planoNoQuestionario = (curso, categoria, selecionados, limpar) =>
    escreve && curso && perfil.cursos.includes(curso.id) ? (
      <FormPlano key={curso.id + categoria} perfil={perfil} base={base} escopo={[curso]} cursoInicial={curso.id} categoriaInicial={categoria}
        titulo={`Plano de ação · ${categoria}`} comentarios={selecionados.map((c) => c.texto)} mostrarSelecao={false}
        onEnviado={() => { limpar(); aoEnviarPlano(); recarregarBase() }} />
    ) : null

  return (
    <>
      <header className="top">
        <a href="#/"><img className="logo" src="/logo-unifecaf.png" alt="UniFECAF · Portal CPA" /></a>
        <div className="spacer" />
        <div className="links-top">
          <a href={LINKS.bancoPerguntas} target="_blank" rel="noreferrer">Banco de perguntas ↗</a>
          {LINKS.sistemaAtual && <a href={LINKS.sistemaAtual} target="_blank" rel="noreferrer">Sistema anterior ↗</a>}
        </div>
        <div className="quem">
          <div className="av" aria-hidden="true">{iniciais}</div>
          <div className="nm">
            <b>{perfil.nome}</b>
            <span>{ROLE_LABELS[r] || r}</span>
          </div>
        </div>
        <button className="btn sm" onClick={() => sair()}>Sair</button>
      </header>
      <nav className="menu" aria-label="Áreas do Portal">
        {grupos.map((g) => (
          <div key={g.g} className="menu-grupo">
            <span className="menu-g">{g.g}</span>
            {g.itens.map((n) => (
              <a key={n.k} href={'#/' + n.k} aria-current={atual === n.k ? 'page' : undefined}>{n.t}</a>
            ))}
          </div>
        ))}
      </nav>
      <PrimeiroAcesso perfil={perfil} onFim={(x) => x?.mensagem && setAviso(x.mensagem)} />
      <main className="conteudo">
        {aviso && <div className="aviso ok" role="status" onClick={() => setAviso(null)}>{aviso}</div>}
        {atual === 'inicio' && <Inicio {...props} />}
        {atual === 'executiva' && <Executiva {...props} />}
        {atual === 'curso' && <Curso {...props} />}
        {atual === 'q' && <Questionario6 {...props} key={codQ || 'cd'} cod={codQ || 'cd'} param={paramQ} renderPlano={planoNoQuestionario} />}
        {atual === 'questionarios' && <Questionarios {...props} />}
        {atual === 'professores' && <Professores {...props} />}
        {atual === 'comentarios' && <Comentarios {...props} />}
        {atual === 'planos' && <Planos {...props} key={param} />}
        {atual === 'nucleo' && <Nucleo {...props} />}
        {atual === 'setores' && <Setores {...props} />}
        {atual === 'meu-setor' && <MeuSetor {...props} key={param} />}
        {atual === 'nucleo-setores' && <NucleoSetores {...props} key={param} />}
        {atual === 'agenda' && <Agenda {...props} key={param} />}
        {atual === 'feedback' && <Feedback {...props} />}
        {atual === 'importar' && <Importar {...props} />}
        {atual === 'admin' && <Admin {...props} />}
        {atual === 'proxima' && <ProximaCPA {...props} />}
      </main>
    </>
  )
}
