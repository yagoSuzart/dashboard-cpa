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
// "Editar redação" guarda a versão da pessoa SEM alterar o texto original da planilha.
export function QuestionCard({ q, decisao, onDecide, cego, extra, emUso, verEmUso }) {
  const [abrirNota, setAbrirNota] = useState(Boolean(decisao?.nota))
  const [editando, setEditando] = useState(false)
  const status = decisao?.status || null
  const revelar = !cego || status
  const versao = decisao?.texto
  return (
    <article className={`card qcard ${status ? 'd-' + status : ''}`}>
      <div>
        {versao ? (
          <>
            <div className="qt">{versao}</div>
            <div className="orig">
              <span className="tag edit">✎ Sua versão</span> Original da planilha: <span>{q.text}</span>
            </div>
          </>
        ) : (
          <div className="qt">{q.text}</div>
        )}
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
        <DecisionButtons value={status} onChange={(s) => onDecide(q.id, { status: s })} />
        <div className="card-actions">
          <button type="button" className="btn ghost sm" onClick={() => setEditando((v) => !v)}>
            ✎ {versao ? 'Editar sua versão' : 'Editar redação'}
          </button>
          <button type="button" className="btn ghost sm" onClick={() => setAbrirNota((v) => !v)}>
            {abrirNota ? 'Ocultar comentário' : decisao?.nota ? 'Ver comentário' : '+ Comentário'}
          </button>
        </div>
      </div>
      {editando && (
        <EditorTexto
          original={q.text}
          atual={versao || q.text}
          onSalvar={(t) => {
            onDecide(q.id, { texto: t.trim() === q.text.trim() ? '' : t.trim() })
            setEditando(false)
          }}
          onCancelar={() => setEditando(false)}
          onRestaurar={
            versao
              ? () => {
                  onDecide(q.id, { texto: '' })
                  setEditando(false)
                }
              : null
          }
        />
      )}
      {revelar && q.dim && emUso != null && (
        <div className={`contexto ${emUso === 0 ? 'lacuna' : ''}`}>
          {emUso === 0 ? (
            <>
              <b>Lacuna:</b> hoje não usamos nenhuma pergunta da D{q.dim} — {DIMENSOES[q.dim]}.
            </>
          ) : (
            <>
              <b>Em uso hoje:</b> {emUso} pergunta{emUso > 1 ? 's' : ''} da D{q.dim} — {DIMENSOES[q.dim]}.
            </>
          )}
          {verEmUso && (
            <button type="button" className="link" onClick={verEmUso}>
              {emUso === 0 ? 'Ver a dimensão' : 'Ver quais são'} →
            </button>
          )}
        </div>
      )}
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
            placeholder="Por que entra ou não? Alguma observação sobre escala, público…"
            defaultValue={decisao?.nota || ''}
            onBlur={(e) => onDecide(q.id, { nota: e.target.value })}
          />
        </div>
      )}
    </article>
  )
}

function EditorTexto({ original, atual, onSalvar, onCancelar, onRestaurar }) {
  const [t, setT] = useState(atual)
  return (
    <div className="editor">
      <div className="editor-h">
        <b>Nova redação</b>
        <span className="muted">
          O texto original continua guardado na planilha. A sua versão vai para o relatório ao lado do original.
        </span>
      </div>
      <textarea value={t} onChange={(e) => setT(e.target.value)} autoFocus />
      <div className="editor-f">
        <span className="muted" style={{ fontSize: 12 }}>
          {t.length} caracteres
        </span>
        <div style={{ flex: 1 }} />
        {onRestaurar && (
          <button type="button" className="btn sm" onClick={onRestaurar}>
            Voltar ao original
          </button>
        )}
        <button type="button" className="btn sm" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="button" className="btn sm primary" disabled={!t.trim()} onClick={() => onSalvar(t)}>
          Salvar versão
        </button>
      </div>
      {t.trim() === original.trim() && <div className="muted" style={{ fontSize: 12 }}>Igual ao original.</div>}
    </div>
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
