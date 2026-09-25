import { useEffect, useMemo, useState } from 'react'
import { MODALIDADE_LABEL } from '../lib/config.js'
import { fmtNota, fmtInt, textoComentario, SENTIMENTO } from '../lib/cpa.js'
import { cursosOrdenados, comentariosDosProfessores } from '../lib/criticos.js'
import { Carregando, Erro, Vazio, Paginacao } from '../components/ui.jsx'
import { FiltroCursos } from './Executiva.jsx'
import './resultados.css'

const POR_PAGINA = 8
const DOCENCIA = 'Docência e Tutoria'

// "Por professor" — como no sistema anterior, não aparece para Professor(a) Auxiliar.
export default function Professores({ perfil, base, escopo, param }) {
  const doEscopo = useMemo(() => cursosOrdenados(base, escopo), [base, escopo])
  const inicial = param && escopo.includes(param) ? param : doEscopo[0]?.id || ''
  const [modalidade, setModalidade] = useState('')
  const [curso, setCurso] = useState(inicial)

  if (perfil.role === 'professor_auxiliar')
    return <div className="aviso">A visão por professor não está disponível para o seu perfil.</div>

  function trocarModalidade(m) {
    setModalidade(m)
    const lista = m ? doEscopo.filter((c) => c.modalidade === m) : doEscopo
    setCurso(lista[0]?.id || '')
  }

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Resultados por professor</div>
          <h1>Por professor</h1>
        </div>
      </section>
      <FiltroCursos cursos={doEscopo} modalidade={modalidade} curso={curso} onModalidade={trocarModalidade} onCurso={setCurso} idPrefixo="prof" />
      {curso ? <UmCurso key={curso} curso={base.cursos.find((c) => c.id === curso)} base={base} /> : <Vazio>Nenhum curso neste recorte.</Vazio>}
    </>
  )
}

function UmCurso({ curso, base }) {
  const profs = useMemo(
    () => base.professores.filter((p) => p.curso_id === curso.id).map((p) => ({ ...p, nota: Number(p.nota) })),
    [base.professores, curso.id],
  )
  const notaDocencia = base.notas[curso.id]?.[DOCENCIA]
  const [busca, setBusca] = useState('')
  const [verTodos, setVerTodos] = useState(false)
  const [pagina, setPagina] = useState(0)
  const [coment, setComent] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (!profs.length) return
    let vivo = true
    comentariosDosProfessores(curso.id).then((r) => vivo && setComent(r)).catch((e) => vivo && setErro(e))
    return () => {
      vivo = false
    }
  }, [curso.id, profs.length])

  const porProf = useMemo(() => {
    const m = {}
    for (const c of coment || []) (m[c.professor] ||= []).push(c)
    return m
  }, [coment])

  const piores = [...profs].sort((a, b) => a.nota - b.nota).slice(0, 2)
  const termo = busca.trim().toLowerCase()
  const lista = (termo ? profs.filter((p) => p.nome.toLowerCase().includes(termo)) : profs).slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const tamanho = verTodos ? Math.max(1, lista.length) : POR_PAGINA
  const pag = Math.min(pagina, Math.max(0, Math.ceil(lista.length / tamanho) - 1))
  const visiveis = lista.slice(pag * tamanho, pag * tamanho + tamanho)

  return (
    <>
      <section className="res-grid-auto">
        <div className="card res-kpi">
          <span className="l">Nota geral do corpo docente</span>
          <span className="v grande">{fmtNota(notaDocencia)}</span>
        </div>
        <div className="card res-kpi">
          <span className="l">Professores avaliados</span>
          <span className="v grande">{fmtInt(profs.length)}</span>
        </div>
      </section>

      {!profs.length ? (
        <div className="card">
          <b style={{ fontSize: 15 }}>A pesquisa deste curso ({MODALIDADE_LABEL[curso.modalidade] || curso.modalidade}) não identifica o professor individualmente.</b>
          <p className="muted" style={{ lineHeight: 1.6 }}>
            Nas modalidades EAD e Semipresencial, o questionário da CPA avalia Docência e Tutoria de forma geral (incluindo Lives e Tutoria), sem vincular a resposta a um professor específico — por isso não é possível mostrar um card por professor aqui.
          </p>
          <p className="muted" style={{ lineHeight: 1.6 }}>
            A nota de <b>Docência e Tutoria</b> deste curso ({fmtNota(notaDocencia)} / 5) já reflete essa avaliação geral, e pode ser vista também em "Visão geral" e "Cursos".
          </p>
        </div>
      ) : (
        <>
          <section className="coluna">
            <h2>Pontos a melhorar (geral do corpo docente)</h2>
            <div className="res-grid-auto">
              {piores.map((p, i) => (
                <div key={p.nome + i} className="destaque oport">
                  <span className="tag">Oportunidade</span>
                  <span className="cat">{p.nome}</span>
                  <span className="val">{fmtNota(p.nota)}</span>
                  <span className="msg">{p.disciplina || '—'} · menor nota entre os professores deste curso.</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-h">
              <div className="t"><h2>Pesquisar professor</h2></div>
            </div>
            <div className="filtros">
              <label className="sr-only" htmlFor="prof-busca">Buscar professor</label>
              <input
                id="prof-busca"
                type="search"
                className="input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Buscar um professor específico (opcional)..."
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setPagina(0) }}
              />
              <button type="button" className="btn sm" onClick={() => { setVerTodos((v) => !v); setPagina(0) }}>
                {verTodos ? 'Ver paginado' : 'Ver todos'}
              </button>
            </div>
            <Erro erro={erro} />
            {!lista.length && <Vazio>Nenhum professor encontrado com esse nome neste curso.</Vazio>}
            {!verTodos && <Paginacao pagina={pag} total={lista.length} porPagina={POR_PAGINA} onPagina={setPagina} />}
            {visiveis.map((p, i) => (
              <CartaoProfessor key={p.nome + p.disciplina + i} p={p} comentarios={coment ? porProf[p.nome] || [] : null} />
            ))}
            {!verTodos && <Paginacao pagina={pag} total={lista.length} porPagina={POR_PAGINA} onPagina={setPagina} />}
          </section>
        </>
      )}
    </>
  )
}

function CartaoProfessor({ p, comentarios }) {
  const [aberto, setAberto] = useState(false)
  const [pagina, setPagina] = useState(0)
  const melhorar = (comentarios || []).filter((c) => c.sentimento === 'warn')
  const positivos = (comentarios || []).filter((c) => c.sentimento === 'good')
  const meta = (c) => (c.turma ? 'Turma ' + c.turma : '')

  return (
    <article className="prof-card">
      <div className="cabeca">
        <div>
          <h3>{p.nome}</h3>
          <div className="small muted">{p.disciplina || '—'} · {fmtInt(p.respondentes)} respondentes</div>
        </div>
        <span className="num">{fmtNota(p.nota)}</span>
      </div>
      {comentarios == null ? (
        <Carregando texto="Carregando comentários…" />
      ) : (
        <>
          <div className="prof-pontos">
            <div className="pt">
              <span className="selo laranja" style={{ alignSelf: 'flex-start' }}>Pontos a melhorar</span>
              {melhorar.length ? (
                <ul>{melhorar.slice(0, 3).map((c) => <li key={c.id}>{textoComentario(c.texto)}{meta(c) && <><br /><span className="small muted">{meta(c)}</span></>}</li>)}</ul>
              ) : (
                <span className="small muted">Nenhum registrado.</span>
              )}
            </div>
            <div className="pt">
              <span className="selo azul" style={{ alignSelf: 'flex-start' }}>Pontos positivos</span>
              {positivos.length ? (
                <ul>{positivos.slice(0, 3).map((c) => <li key={c.id}>{textoComentario(c.texto)}{meta(c) && <><br /><span className="small muted">{meta(c)}</span></>}</li>)}</ul>
              ) : (
                <span className="small muted">Nenhum registrado.</span>
              )}
            </div>
          </div>
          <button type="button" className="btn sm" style={{ alignSelf: 'flex-start' }} aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
            {aberto ? 'Esconder os comentários' : `Ver todos os comentários (${fmtInt(comentarios.length)})`}
          </button>
          {aberto && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!comentarios.length && <Vazio>Nenhum comentário para este recorte.</Vazio>}
              {comentarios.slice(pagina * 10, pagina * 10 + 10).map((c) => (
                <div key={c.id} className="coment">
                  <p>{textoComentario(c.texto)}</p>
                  <div className="meta">
                    <span className={'selo ' + (SENTIMENTO[c.sentimento]?.selo || 'cinza')}>{SENTIMENTO[c.sentimento]?.rotulo || c.sentimento}</span>
                    <span>{c.categoria}</span>
                    {c.turma && <span>· Turma {c.turma}</span>}
                  </div>
                </div>
              ))}
              <Paginacao pagina={pagina} total={comentarios.length} porPagina={10} onPagina={setPagina} />
            </div>
          )}
        </>
      )}
    </article>
  )
}

