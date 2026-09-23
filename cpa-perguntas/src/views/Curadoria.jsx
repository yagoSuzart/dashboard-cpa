import { useMemo, useState } from 'react'
import { EIXOS, DIMENSOES, EIXO_DA_DIM, eixoInfo } from '../lib/model.js'
import { QuestionCard, EixoTag, DimTag } from '../components/ui.jsx'

const FILTROS = [
  { k: 'todas', rotulo: 'Todas' },
  { k: 'pendentes', rotulo: 'Sem decisão' },
  { k: 'sim', rotulo: 'Entra' },
  { k: 'talvez', rotulo: 'Dúvida' },
  { k: 'nao', rotulo: 'Não entra' },
]

export default function Curadoria({ model, sel, decidir, setSugestoes }) {
  const [cego, setCego] = useState(true)
  const [agrupar, setAgrupar] = useState(false)
  const [filtro, setFiltro] = useState('todas')
  const [eixo, setEixo] = useState('')

  const props = model.propostas
  const cont = useMemo(() => {
    const c = { sim: 0, talvez: 0, nao: 0 }
    for (const q of props) {
      const s = sel.decisoes[q.id]?.status
      if (s) c[s]++
    }
    return c
  }, [props, sel])
  const decididas = cont.sim + cont.talvez + cont.nao

  const lista = props.filter((q) => {
    const s = sel.decisoes[q.id]?.status
    if (eixo && String(q.eixo) !== eixo) return false
    if (filtro === 'pendentes') return !s
    if (filtro !== 'todas') return s === filtro
    return true
  })

  const card = (q) => (
    <QuestionCard key={q.id} q={q} decisao={sel.decisoes[q.id]} onDecide={decidir} cego={cego && !agrupar} />
  )

  return (
    <>
      <div className="page-h">
        <div>
          <div className="eyebrow">Curadoria</div>
          <h1>Montar a base de perguntas</h1>
          <p>
            Leia cada pergunta proposta e marque se ela entra. No modo leitura às cegas, o eixo e a dimensão aparecem
            só depois da sua decisão — a escolha fica pela clareza da pergunta, e depois você vê o que ela cobre.
          </p>
        </div>
        <div className="spacer" />
        <div style={{ minWidth: 220 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            {decididas} de {props.length} avaliadas · <b style={{ color: 'var(--green)' }}>{cont.sim} entram</b>
          </div>
          <div className="progress" title={`${cont.sim} entram · ${cont.talvez} em dúvida · ${cont.nao} não entram`}>
            <span style={{ width: `${(cont.sim / props.length) * 100}%`, background: 'var(--green)' }} />
            <span style={{ width: `${(cont.talvez / props.length) * 100}%`, background: '#d39a00' }} />
            <span style={{ width: `${(cont.nao / props.length) * 100}%`, background: '#8b93a3' }} />
          </div>
        </div>
      </div>

      <div className="filters">
        <div className="seg" aria-label="Filtrar por decisão">
          {FILTROS.map((f) => (
            <button key={f.k} className={filtro === f.k ? 'on' : ''} onClick={() => setFiltro(f.k)}>
              {f.rotulo}
            </button>
          ))}
        </div>
        <select className="select" value={eixo} onChange={(e) => setEixo(e.target.value)} aria-label="Eixo">
          <option value="">Todos os eixos</option>
          {EIXOS.map((e) => (
            <option key={e.n} value={e.n}>
              Eixo {e.n} — {e.nome}
            </option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <label className="toggle">
          <input type="checkbox" checked={agrupar} onChange={(e) => setAgrupar(e.target.checked)} />
          <span className="sw" /> Agrupar por eixo
        </label>
        <label className="toggle" style={{ opacity: agrupar ? 0.4 : 1 }}>
          <input type="checkbox" checked={cego && !agrupar} disabled={agrupar} onChange={(e) => setCego(e.target.checked)} />
          <span className="sw" /> Leitura às cegas
        </label>
      </div>

      {!lista.length && <div className="card empty">Nenhuma pergunta com esse filtro.</div>}

      {agrupar ? (
        EIXOS.filter((e) => !eixo || String(e.n) === eixo).map((e) =>
          e.dims.map((d) => {
            const qs = lista.filter((q) => q.dim === d)
            if (!qs.length) return null
            return (
              <section key={d}>
                <div className="grp-h">
                  <span className="bullet" style={{ background: e.cor }} />
                  <h2>
                    Eixo {e.n} · D{d} — {DIMENSOES[d]}
                  </h2>
                  <span className="line" />
                  <span className="muted" style={{ fontSize: 12 }}>
                    {qs.length}
                  </span>
                </div>
                <div className="qlist">{qs.map(card)}</div>
              </section>
            )
          }),
        )
      ) : (
        <div className="qlist">{lista.map(card)}</div>
      )}

      <Sugestoes sugestoes={sel.sugestoes} setSugestoes={setSugestoes} />
    </>
  )
}

function Sugestoes({ sugestoes, setSugestoes }) {
  const [text, setText] = useState('')
  const [dim, setDim] = useState('')
  const [nota, setNota] = useState('')
  const add = (e) => {
    e.preventDefault()
    if (!text.trim() || !dim) return
    setSugestoes([...sugestoes, { id: 'u' + Date.now().toString(36), text: text.trim(), dim: Number(dim), nota: nota.trim() }])
    setText('')
    setNota('')
  }
  return (
    <div className="card" style={{ marginTop: 28 }}>
      <div className="card-h">
        <div>
          <h2>Sugerir uma pergunta nova</h2>
          <div className="muted" style={{ fontSize: 13 }}>
            Não achou o que precisava? Escreva a pergunta e diga em qual dimensão ela entra. Ela conta como “Entra”
            na sua cobertura e vai para o relatório.
          </div>
        </div>
      </div>
      <div className="card-b">
        <form onSubmit={add} className="grid sug-form">
          <textarea
            className="select"
            style={{ minHeight: 44, resize: 'vertical', fontFamily: 'var(--f-text)', fontSize: 14 }}
            placeholder="Texto da pergunta"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <select className="select" value={dim} onChange={(e) => setDim(e.target.value)} aria-label="Dimensão">
            <option value="">Escolha a dimensão…</option>
            {Object.entries(DIMENSOES).map(([n, nome]) => (
              <option key={n} value={n}>
                Eixo {EIXO_DA_DIM[n]} · D{n} — {nome}
              </option>
            ))}
          </select>
          <button className="btn primary" disabled={!text.trim() || !dim}>
            Adicionar
          </button>
          <input
            className="select"
            style={{ gridColumn: '1 / -1' }}
            placeholder="Comentário (opcional)"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </form>
        {sugestoes.length > 0 && (
          <div className="qlist" style={{ marginTop: 16 }}>
            {sugestoes.map((s) => (
              <div key={s.id} className="card qcard d-sim" style={{ boxShadow: 'none' }}>
                <div>
                  <div className="qt">{s.text}</div>
                  <div className="tags">
                    <EixoTag n={eixoInfo(EIXO_DA_DIM[s.dim])?.n} />
                    <DimTag n={s.dim} />
                    <span className="tag src">Sugestão sua</span>
                  </div>
                  {s.nota && (
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                      {s.nota}
                    </div>
                  )}
                </div>
                <button className="btn sm" onClick={() => setSugestoes(sugestoes.filter((x) => x.id !== s.id))}>
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
