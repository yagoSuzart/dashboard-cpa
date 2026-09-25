import { useEffect, useMemo, useState } from 'react'
import { SATISFACAO } from '../lib/config.js'
import { carregarTurmas } from '../lib/dados.js'
import { fmtInt, textoComentario, SENTIMENTO } from '../lib/cpa.js'
import { cursosOrdenados, comentariosQuestionario, QUESTIONARIOS } from '../lib/criticos.js'
import { Anel, Carregando, Erro, Vazio, Paginacao } from '../components/ui.jsx'
import { FiltroCursos } from './Executiva.jsx'
import './resultados.css'

const POR_PAGINA = 10

// Props: as do App + cod ('cd' | 'ia' | 'pa' | 'pg' | 'dt' | 'sg').
// renderPlano(curso, categoria, comentariosSelecionados, limparSelecao) — opcional: formulário de plano abaixo dos comentários.
export default function Questionario6({ base, escopo, param, cod, renderPlano }) {
  const q = QUESTIONARIOS.find((x) => x.cod === cod) || QUESTIONARIOS[0]
  const doEscopo = useMemo(() => cursosOrdenados(base, escopo), [base, escopo])
  const [modalidade, setModalidade] = useState('')
  const [curso, setCurso] = useState(param && escopo.includes(param) ? param : doEscopo[0]?.id || '')

  function trocarModalidade(m) {
    setModalidade(m)
    const lista = m ? doEscopo.filter((c) => c.modalidade === m) : doEscopo
    setCurso(lista[0]?.id || '')
  }

  return (
    <>
      <section className="cab">
        <div className="txt">
          <div className="eyebrow">Questionário da CPA</div>
          <h1>{q.nome}</h1>
        </div>
      </section>
      <nav className="chips" aria-label="Questionários">
        {QUESTIONARIOS.map((x) => (
          <a key={x.cod} href={'#/q/' + x.cod} className="chip-btn" aria-pressed={x.cod === q.cod} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            {x.nome}
          </a>
        ))}
      </nav>
      <FiltroCursos cursos={doEscopo} modalidade={modalidade} curso={curso} onModalidade={trocarModalidade} onCurso={setCurso} idPrefixo={'q6-' + q.cod} />
      {curso ? (
        <UmCurso key={q.cod + curso} q={q} curso={base.cursos.find((c) => c.id === curso)} base={base} renderPlano={renderPlano} />
      ) : (
        <Vazio>Nenhum curso neste recorte.</Vazio>
      )}
    </>
  )
}

function UmCurso({ q, curso, base, renderPlano }) {
  const categoria = q.nome
  const escala10 = categoria === SATISFACAO
  const [turmas, setTurmas] = useState(null)
  const [erroTurmas, setErroTurmas] = useState(null)
  const [turma, setTurma] = useState('')
  const [selecionados, setSelecionados] = useState([])

  useEffect(() => {
    let vivo = true
    carregarTurmas(curso.id).then((t) => vivo && setTurmas(t)).catch((e) => vivo && setErroTurmas(e))
    return () => {
      vivo = false
    }
  }, [curso.id])

  const nomesTurmas = useMemo(() => [...new Set((turmas || []).map((t) => t.turma))].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true })), [turmas])
  const notaTurma = turma ? (turmas || []).find((t) => t.turma === turma && t.categoria === categoria) : null
  const notaCurso = base.notas[curso.id]?.[categoria]
  const valor = notaTurma ? Number(notaTurma.nota) : notaCurso
  const fallback = turma && !notaTurma

  const sub =
    (escala10 ? 'Escala de 0 a 10' : 'Escala de 1 a 5') +
    ' · média das respostas dos alunos' +
    (turma
      ? fallback
        ? ' · turma ' + turma + ' não tem dado suficiente nesta categoria, mostrando a média do curso inteiro'
        : ' · turma ' + turma
      : ' · curso inteiro')

  function alternar(c) {
    setSelecionados((s) => (s.some((x) => x.id === c.id) ? s.filter((x) => x.id !== c.id) : [...s, c]))
  }

  return (
    <>
      <div className="filtros">
        <label className="sr-only" htmlFor={'q6-turma-' + q.cod}>Turma</label>
        <select id={'q6-turma-' + q.cod} className="input" value={turma} onChange={(e) => setTurma(e.target.value)} disabled={!turmas}>
          <option value="">{turmas ? 'Todas as turmas (média do curso)' : 'Carregando turmas…'}</option>
          {nomesTurmas.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <Erro erro={erroTurmas} />

      <section className="card escuro res-hero">
        <Anel valor={valor} max={escala10 ? 10 : 5} rotulo={categoria} />
        <div className="meio">
          <div className="eyebrow" style={{ color: '#9FE0B8' }}>{categoria}</div>
          <div className="small muted" style={{ lineHeight: 1.5 }}>{sub}</div>
        </div>
      </section>

      <section className="card">
        <div className="card-h">
          <div className="t">
            <h2>Comentários deste questionário</h2>
            <p className="muted small">Clique nos comentários que você achar relevantes pra usar como base do plano de ação abaixo.</p>
          </div>
        </div>
        <ComentariosSelecionaveis key={turma} cursoId={curso.id} categoria={categoria} turma={turma || null} selecionados={selecionados} onAlternar={alternar} />
      </section>

      <section className="card">
        {selecionados.length === 0 ? (
          <p className="small muted">Nenhum comentário selecionado ainda — clique nos comentários acima que quiser usar como base (opcional).</p>
        ) : (
          <div className="aviso ok" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ flex: 1 }}><b>{fmtInt(selecionados.length)} comentário(s) selecionado(s)</b> — serão anexados como evidência deste plano.</span>
            <button type="button" className="btn sm" onClick={() => setSelecionados([])}>Limpar seleção</button>
          </div>
        )}
        {renderPlano ? renderPlano(curso, categoria, selecionados, () => setSelecionados([])) : null}
      </section>
    </>
  )
}

function ComentariosSelecionaveis({ cursoId, categoria, turma, selecionados, onAlternar }) {
  const [pagina, setPagina] = useState(0)
  const [estado, setEstado] = useState({ chave: null })
  const chave = JSON.stringify([cursoId, categoria, turma, pagina])

  useEffect(() => {
    let vivo = true
    comentariosQuestionario({ cursoId, categoria, turma, pagina, porPagina: POR_PAGINA })
      .then((r) => vivo && setEstado({ chave, res: r }))
      .catch((e) => vivo && setEstado({ chave, erro: e }))
    return () => {
      vivo = false
    }
  }, [chave, cursoId, categoria, turma, pagina])

  if (estado.chave !== chave) return <Carregando texto="Buscando comentários…" />
  if (estado.erro) return <Erro erro={estado.erro} />
  const { itens, total } = estado.res
  if (!total) return <Vazio>Nenhum comentário para este recorte.</Vazio>
  const ids = new Set(selecionados.map((c) => c.id))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span className="small muted">{fmtInt(total)} comentário(s) no total</span>
      {itens.map((c) => {
        const sel = ids.has(c.id)
        return (
          <button key={c.id} type="button" className="coment selecionavel" aria-pressed={sel} onClick={() => onAlternar(c)}>
            <span className="marca" aria-hidden="true">{sel ? '✓' : ''}</span>
            <span className="corpo-c">
              <span className="txt-c">{textoComentario(c.texto)}</span>
              <span className="meta">
                <span className={'selo ' + (SENTIMENTO[c.sentimento]?.selo || 'cinza')}>{SENTIMENTO[c.sentimento]?.rotulo || c.sentimento}</span>
                {c.turma && <span>Turma {c.turma}</span>}
                {c.professor && <span>· {c.professor}</span>}
              </span>
            </span>
          </button>
        )
      })}
      <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} onPagina={setPagina} />
    </div>
  )
}
