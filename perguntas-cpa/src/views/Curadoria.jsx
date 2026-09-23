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
  const [criar, setCriar] = useState(false)

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

  const emUsoDa = (d) => model.atual.filter((q) => q.dim === d)
  const card = (q) => (
    <QuestionCard
      key={q.id}
      q={q}
      decisao={sel.decisoes[q.id]}
      onDecide={decidir}
      cego={cego && !agrupar}
      emUso={agrupar ? null : emUsoDa(q.dim).length}
      verEmUso={() => {
        setEixo('')
        setAgrupar(true)
        setTimeout(() => document.getElementById('dim-' + q.dim)?.scrollIntoView({ behavior: 'smooth' }), 80)
      }}
    />
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
        <button
          className="btn"
          onClick={() => {
            setCriar(true)
            setTimeout(() => document.getElementById('criar')?.scrollIntoView({ behavior: 'smooth' }), 50)
          }}
        >
          + Criar pergunta
        </button>
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
          <span className="sw" /> Agrupar por eixo + ver as que já usamos
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
            const uso = emUsoDa(d)
            return (
              <section key={d} id={'dim-' + d} className="dim-sec">
                <div className="grp-h">
                  <span className="bullet" style={{ background: e.cor }} />
                  <h2>
                    Eixo {e.n} · D{d} — {DIMENSOES[d]}
                  </h2>
                  <span className="line" />
                  <span className="muted" style={{ fontSize: 12 }}>
                    {uso.length} em uso · {qs.length} proposta(s)
                  </span>
                </div>
                <EmUso qs={uso} />
                {qs.length ? (
                  <div className="qlist">{qs.map(card)}</div>
                ) : (
                  <div className="muted sem-prop">Nenhuma pergunta proposta nesta dimensão{filtro !== 'todas' ? ' com esse filtro' : ''}.</div>
                )}
              </section>
            )
          }),
        )
      ) : (
        <div className="qlist">{lista.map(card)}</div>
      )}

      <Sugestoes sugestoes={sel.sugestoes} setSugestoes={setSugestoes} abrir={criar} setAbrir={setCriar} />
    </>
  )
}

// Perguntas que o instrumento 2026.1 já usa nesta dimensão (somente leitura)
function EmUso({ qs }) {
  if (!qs.length)
    return (
      <div className="emuso vazio">
        <span className="st st-crit">
          <span className="i">✕</span>Nenhuma pergunta em uso hoje
        </span>
        <span>Esta dimensão está descoberta: as propostas abaixo ajudam a fechar essa lacuna.</span>
      </div>
    )
  return (
    <details className="emuso" open={qs.length <= 5}>
      <summary>
        <span className="tag uso">Em uso · 2026.1</span>
        <b>
          {qs.length} pergunta{qs.length > 1 ? 's' : ''} que já usamos nesta dimensão
        </b>
        <span className="muted">— clique para {qs.length <= 5 ? 'recolher' : 'ver'}</span>
      </summary>
      <ul>
        {qs.map((q) => (
          <li key={q.id}>
            <span className="emuso-t">{q.text}</span>
            <span className="tag item">{q.item}</span>
            <span className="muted" style={{ fontSize: 12 }}>
              {q.modalidades.join(', ')}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

const TIPOS = ['Escala 1 a 5', 'Sim / Não', 'Múltipla escolha (única)', 'Múltipla escolha (várias)', 'Texto livre', 'NPS (0 a 10)']

function FormPergunta({ inicial, onSalvar, onCancelar }) {
  const [text, setText] = useState(inicial?.text || '')
  const [eixo, setEixo] = useState(inicial?.dim ? String(EIXO_DA_DIM[inicial.dim]) : '')
  const [dim, setDim] = useState(inicial?.dim ? String(inicial.dim) : '')
  const [tipo, setTipo] = useState(inicial?.tipo || 'Escala 1 a 5')
  const [nota, setNota] = useState(inicial?.nota || '')
  const dimsDoEixo = eixo ? eixoInfo(Number(eixo)).dims : []
  const pronto = text.trim() && dim
  return (
    <form
      className="nova-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (pronto) onSalvar({ text: text.trim(), dim: Number(dim), tipo, nota: nota.trim() })
      }}
    >
      <label className="fl" style={{ gridColumn: '1 / -1' }}>
        <span>Texto da pergunta</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Como você avalia…" autoFocus />
      </label>
      <label className="fl">
        <span>1. Eixo</span>
        <select
          className="select"
          value={eixo}
          onChange={(e) => {
            setEixo(e.target.value)
            const ds = e.target.value ? eixoInfo(Number(e.target.value)).dims : []
            setDim(ds.length === 1 ? String(ds[0]) : '')
          }}
        >
          <option value="">Escolha o eixo…</option>
          {EIXOS.map((x) => (
            <option key={x.n} value={x.n}>
              Eixo {x.n} — {x.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="fl">
        <span>2. Dimensão</span>
        <select className="select" value={dim} onChange={(e) => setDim(e.target.value)} disabled={!eixo}>
          <option value="">{eixo ? 'Escolha a dimensão…' : 'Escolha o eixo primeiro'}</option>
          {dimsDoEixo.map((d) => (
            <option key={d} value={d}>
              D{d} — {DIMENSOES[d]}
            </option>
          ))}
        </select>
      </label>
      <label className="fl">
        <span>3. Tipo de resposta</span>
        <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="fl" style={{ gridColumn: '1 / -1' }}>
        <span>Por que essa pergunta? (opcional)</span>
        <input className="select" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex.: cobre a Dimensão 10, que está sem pergunta" />
      </label>
      <div className="editor-f" style={{ gridColumn: '1 / -1' }}>
        <div style={{ flex: 1 }} />
        {onCancelar && (
          <button type="button" className="btn sm" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button className="btn primary sm" disabled={!pronto}>
          {inicial ? 'Salvar alterações' : 'Adicionar pergunta'}
        </button>
      </div>
    </form>
  )
}

function Sugestoes({ sugestoes, setSugestoes, abrir, setAbrir }) {
  const [editandoId, setEditandoId] = useState(null)
  return (
    <div className="card" id="criar" style={{ marginTop: 28 }}>
      <div className="card-h">
        <div>
          <h2>Perguntas criadas por você</h2>
          <div className="muted" style={{ fontSize: 13 }}>
            Teve uma ideia melhor? Crie a pergunta e diga em qual eixo e dimensão ela atua. Ela entra na sua cobertura
            e vai para o relatório como “Criada por você”.
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {!abrir && (
          <button className="btn primary" onClick={() => setAbrir(true)}>
            + Criar pergunta
          </button>
        )}
      </div>
      <div className="card-b">
        {abrir && (
          <FormPergunta
            onSalvar={(v) => {
              setSugestoes([...sugestoes, { id: 'u' + Date.now().toString(36), status: 'sim', ...v }])
              setAbrir(false)
            }}
            onCancelar={() => setAbrir(false)}
          />
        )}
        {sugestoes.length === 0 && !abrir && <div className="muted">Nenhuma pergunta criada ainda.</div>}
        {sugestoes.length > 0 && (
          <div className="qlist" style={{ marginTop: abrir ? 16 : 0 }}>
            {sugestoes.map((s) =>
              editandoId === s.id ? (
                <FormPergunta
                  key={s.id}
                  inicial={s}
                  onSalvar={(v) => {
                    setSugestoes(sugestoes.map((x) => (x.id === s.id ? { ...x, ...v } : x)))
                    setEditandoId(null)
                  }}
                  onCancelar={() => setEditandoId(null)}
                />
              ) : (
                <div key={s.id} className="card qcard d-sim" style={{ boxShadow: 'none' }}>
                  <div>
                    <div className="qt">{s.text}</div>
                    <div className="tags">
                      <EixoTag n={EIXO_DA_DIM[s.dim]} />
                      <DimTag n={s.dim} />
                      {s.tipo && <span className="tag">{s.tipo}</span>}
                      <span className="tag src">Criada por você</span>
                    </div>
                    {s.nota && (
                      <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                        {s.nota}
                      </div>
                    )}
                  </div>
                  <div className="decide">
                    <button className="btn sm" onClick={() => setEditandoId(s.id)}>
                      ✎ Editar
                    </button>
                    <button className="btn sm" onClick={() => setSugestoes(sugestoes.filter((x) => x.id !== s.id))}>
                      Remover
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}
