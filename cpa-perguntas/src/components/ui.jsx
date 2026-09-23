import { useState } from 'react'
import { DIMENSOES, STATUS, eixoInfo } from '../lib/model.js'

export function EixoTag({ n }) {
  const e = eixoInfo(n)
  if (!e) return <span className="tag rev">Eixo a revisar</span>
  return (
    <span className="tag eixo" title={`Eixo ${e.n} — ${e.nome}`}>
      <span className="sw" style={{ background: e.cor }} />
      Eixo {e.n}
    </span>
  )
}

export function DimTag({ n, texto }) {
  if (!n) return <span className="tag rev" title={texto}>{texto ? 'Dimensão: revisar' : 'Sem dimensão'}</span>
  return (
    <span className="tag dim" title={`Dimensão ${n} — ${DIMENSOES[n]}`}>
      D{n} · {DIMENSOES[n]}
    </span>
  )
}

export function StatusPill({ status }) {
  const s = STATUS[status]
  return (
    <span className={`st ${s.cls}`}>
      <span className="i" aria-hidden="true">{s.icone}</span>
      {s.rotulo}
    </span>
  )
}

const DECISOES = [
  { k: 'sim', rotulo: 'Entra', icone: '✓' },
  { k: 'talvez', rotulo: 'Dúvida', icone: '?' },
  { k: 'nao', rotulo: 'Não entra', icone: '✕' },
]

export function DecisionButtons({ value, onChange }) {
  return (
    <div className="decide" role="group" aria-label="Decisão">
      {DECISOES.map((d) => (
        <button
          key={d.k}
          type="button"
          className={`dbtn ${d.k} ${value === d.k ? 'on' : ''}`}
          aria-pressed={value === d.k}
          onClick={() => onChange(value === d.k ? null : d.k)}
        >
          <span aria-hidden="true">{d.icone}</span> {d.rotulo}
        </button>
      ))}
    </div>
  )
}

const ROTULO_DECISAO = { sim: 'Entra', talvez: 'Dúvida', nao: 'Não entra' }

export function DecisionChip({ status }) {
  if (!status) return <span className="tag">—</span>
  const cls = status === 'sim' ? 'st-ok' : status === 'talvez' ? 'st-warn' : ''
  const ic = status === 'sim' ? '✓' : status === 'talvez' ? '?' : '✕'
  return (
    <span className={`st ${cls}`} style={status === 'nao' ? { background: '#eef0f4', color: '#5b6475' } : undefined}>
      <span className="i" style={status === 'nao' ? { background: '#8b93a3' } : undefined}>{ic}</span>
      {ROTULO_DECISAO[status]}
    </span>
  )
}

// Card de pergunta para decidir. Com "cego" ligado, eixo e dimensão só aparecem
// depois que a pessoa decide — assim a escolha é pela clareza da pergunta.
export function QuestionCard({ q, decisao, onDecide, cego, extra }) {
  const [abrirNota, setAbrirNota] = useState(Boolean(decisao?.nota))
  const status = decisao?.status || null
  const revelar = !cego || status
  return (
    <article className={`card qcard ${status ? 'd-' + status : ''}`}>
      <div>
        <div className="qt">{q.text}</div>
        <div className="tags">
          {revelar ? (
            <>
              <EixoTag n={q.eixo} />
              <DimTag n={q.dim} texto={q.dimTexto} />
            </>
          ) : (
            <span className="hidden-dim" title="Decida para revelar">
              <span className="blur">Eixo 0 · Dimensão 00</span> — decida para ver o eixo e a dimensão
            </span>
          )}
          {extra}
        </div>
      </div>
      <div>
        <DecisionButtons value={status} onChange={(s) => onDecide(q.id, s, decisao?.nota)} />
        <div style={{ textAlign: 'right', marginTop: 6 }}>
          <button type="button" className="btn ghost sm" onClick={() => setAbrirNota((v) => !v)}>
            {abrirNota ? 'Ocultar comentário' : decisao?.nota ? 'Ver comentário' : '+ Comentário'}
          </button>
        </div>
      </div>
      {revelar && (q.jaExiste || q.obs || q.opcoes) && (
        <div className="hint">
          {q.jaExiste && (
            <div>
              <b>Já perguntamos algo parecido?</b> {q.jaExiste}
            </div>
          )}
          {q.opcoes && (
            <div>
              <b>Opções de resposta:</b> {q.opcoes}
            </div>
          )}
          {q.obs && (
            <div>
              <b>Observação da planilha:</b> {q.obs}
            </div>
          )}
        </div>
      )}
      {abrirNota && (
        <div className="note">
          <textarea
            placeholder="Por que entra ou não? Sugestão de ajuste de texto, escala…"
            defaultValue={decisao?.nota || ''}
            onBlur={(e) => onDecide(q.id, status, e.target.value, true)}
          />
        </div>
      )}
    </article>
  )
}

export function Loading({ texto = 'Carregando…' }) {
  return (
    <div className="center-screen">
      <div>
        <div className="spinner" />
        <div className="muted">{texto}</div>
      </div>
    </div>
  )
}
