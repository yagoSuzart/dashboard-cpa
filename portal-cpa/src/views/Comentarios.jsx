import { useEffect, useMemo, useState } from 'react'
import { DIMENSOES, MODALIDADE_LABEL } from '../lib/config.js'
import { buscarComentarios } from '../lib/dados.js'
import { textoComentario, fmtInt, SENTIMENTO } from '../lib/cpa.js'
import { rotuloCurso } from '../lib/escopo.js'
import { Erro, Vazio, Paginacao, Carregando } from '../components/ui.jsx'

export default function Comentarios({ base, escopo, perfil }) {
  const { cursos } = base
  const doEscopo = cursos.filter((c) => escopo.includes(c.id))
  const [curso, setCurso] = useState(doEscopo.length === 1 ? doEscopo[0].id : '')
  const [modalidade, setModalidade] = useState('')
  const [categoria, setCategoria] = useState('')
  const lista = modalidade ? doEscopo.filter((c) => c.modalidade === modalidade) : doEscopo
  const ids = curso ? [curso] : perfil.global && !modalidade ? null : lista.map((c) => c.id)

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Voz dos alunos</div>
          <h1>Comentários</h1>
          <p className="muted" style={{ fontSize: 15 }}>Os comentários aparecem exatamente como os alunos escreveram. Use a busca com várias palavras separadas por vírgula.</p>
        </div>
      </div>
      <div className="card">
        <div className="filtros">
          <label className="sr-only" htmlFor="c-mod">Modalidade</label>
          <select id="c-mod" className="input" value={modalidade} onChange={(e) => { setModalidade(e.target.value); setCurso('') }}>
            <option value="">Todas as modalidades</option>
            {Object.entries(MODALIDADE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <label className="sr-only" htmlFor="c-curso">Curso</label>
          <select id="c-curso" className="input" value={curso} onChange={(e) => setCurso(e.target.value)} style={{ minWidth: 280 }}>
            <option value="">{perfil.global ? 'Todos os cursos' : 'Todos os meus cursos'}</option>
            {lista.map((c) => <option key={c.id} value={c.id}>{rotuloCurso(c)}</option>)}
          </select>
          <label className="sr-only" htmlFor="c-cat">Dimensão</label>
          <select id="c-cat" className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas as dimensões</option>
            {DIMENSOES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <ListaComentarios key={(ids || []).join(',') + categoria} cursos={ids} categoria={categoria || null} base={base} />
      </div>
    </>
  )
}

export function ListaComentarios({ cursos, categoria = null, professor = null, base, porPagina = 20, selecionados, onAlternar }) {
  const [sentimento, setSentimento] = useState('warn')
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')
  const [pagina, setPagina] = useState(0)
  const [estado, setEstado] = useState({ chave: null })
  const porId = useMemo(() => Object.fromEntries(base.cursos.map((c) => [c.id, c])), [base.cursos])
  const chaveCursos = cursos ? cursos.join(',') : '*'

  const chave = JSON.stringify([chaveCursos, categoria, professor, sentimento, buscaAtiva, pagina, porPagina])
  const res = estado.chave === chave ? estado.res : null
  const erro = estado.chave === chave ? estado.erro : null

  useEffect(() => {
    let vivo = true
    buscarComentarios({
      cursos: chaveCursos === '*' ? null : chaveCursos.split(',').filter(Boolean),
      categoria,
      professor,
      sentimento: sentimento || null,
      busca: buscaAtiva,
      pagina,
      porPagina,
    })
      .then((r) => vivo && setEstado({ chave, res: r }))
      .catch((e) => vivo && setEstado({ chave, erro: e }))
    return () => {
      vivo = false
    }
  }, [chave, chaveCursos, categoria, professor, sentimento, buscaAtiva, pagina, porPagina])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="filtros">
        <div className="seg" role="group" aria-label="Tipo de comentário">
          {[['warn', 'Pedem atenção'], ['bad', 'Negativos'], ['good', 'Positivos'], ['', 'Todos']].map(([k, t]) => (
            <button key={k} aria-pressed={sentimento === k} onClick={() => { setSentimento(k); setPagina(0) }}>{t}</button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setBuscaAtiva(busca); setPagina(0) }}
          style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}
        >
          <label className="sr-only" htmlFor={'busca-' + chaveCursos + categoria}>Buscar nos comentários</label>
          <input id={'busca-' + chaveCursos + categoria} type="search" className="input" style={{ flex: 1 }} placeholder="palavras-chave, ex.: wi-fi, cantina" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <button className="btn sm">Buscar</button>
        </form>
        {res && <span className="small muted">{fmtInt(res.total)} comentários</span>}
      </div>
      <Erro erro={erro} />
      {!res && !erro && <Carregando texto="Buscando comentários…" />}
      {res && !res.itens.length && <Vazio>Nenhum comentário com esses filtros.</Vazio>}
      {res?.itens.map((c) => (
        <div key={c.id} className="coment">
          <p>{textoComentario(c.texto)}</p>
          <div className="meta">
            <span className={'selo ' + (SENTIMENTO[c.sentimento]?.selo || 'cinza')}>{c.categoria}</span>
            {rotuloCurso(porId[c.curso_id])}
            {c.turma && <span>· {c.turma}</span>}
            {c.professor && <span>· {c.professor}</span>}
            {onAlternar && (
              <button type="button" className={'btn sm' + (selecionados?.includes(c.texto) ? ' escuro' : '')} style={{ marginLeft: 'auto', height: 30 }}
                aria-pressed={!!selecionados?.includes(c.texto)} onClick={() => onAlternar(c.texto)}>
                {selecionados?.includes(c.texto) ? 'Anexado ao plano ✓' : 'Usar no plano'}
              </button>
            )}
          </div>
        </div>
      ))}
      {res && <Paginacao pagina={pagina} total={res.total} porPagina={porPagina} onPagina={setPagina} />}
    </div>
  )
}
