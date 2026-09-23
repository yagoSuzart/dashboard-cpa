import { useEffect, useMemo, useRef, useState } from 'react'
import { EixoTag, DimTag } from './ui.jsx'

const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Busca rápida (Ctrl/⌘ + K) em todas as perguntas e telas
export default function Palette({ aberto, fechar, model, sel, rotas, ir }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (aberto) setTimeout(() => inputRef.current?.focus(), 0)
  }, [aberto])

  const todas = useMemo(
    () => [
      ...model.atual.map((x) => ({ ...x, onde: 'Em uso (2026.1)', rota: 'banco' })),
      ...model.propostas.map((x) => ({ ...x, onde: 'Proposta', rota: 'curadoria' })),
      ...model.outras.flatMap((o) => o.perguntas.map((x) => ({ ...x, onde: o.nome, rota: 'setores' }))),
      ...(sel?.sugestoes || []).map((x) => ({ ...x, eixo: null, onde: 'Criada por você', rota: 'curadoria' })),
    ],
    [model, sel],
  )

  const res = useMemo(() => {
    const t = norm(q.trim())
    const telas = rotas
      .filter((r) => !t || norm(r.rotulo).includes(t))
      .map((r) => ({ tipo: 'tela', id: 'r' + r.k, rotulo: r.rotulo, ico: r.ico, rota: r.k }))
    if (!t) return telas
    const perg = todas.filter((x) => norm(x.text).includes(t)).slice(0, 30).map((x) => ({ tipo: 'pergunta', ...x }))
    return [...telas, ...perg]
  }, [q, todas, rotas])

  if (!aberto) return null
  const escolher = (r) => {
    ir(r.rota)
    setQ('')
    fechar()
  }
  return (
    <div className="pal-bg" onMouseDown={fechar}>
      <div className="pal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Busca rápida">
        <div className="pal-in">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            value={q}
            placeholder="Buscar perguntas ou ir para uma tela…"
            onChange={(e) => {
              setQ(e.target.value)
              setI(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setI((v) => Math.min(v + 1, res.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setI((v) => Math.max(v - 1, 0))
              } else if (e.key === 'Enter' && res[i]) escolher(res[i])
              else if (e.key === 'Escape') fechar()
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="pal-list">
          {res.length === 0 && <div className="empty">Nada encontrado.</div>}
          {res.map((r, k) => (
            <button key={r.id + k} className={`pal-item ${k === i ? 'on' : ''}`} onMouseEnter={() => setI(k)} onClick={() => escolher(r)}>
              {r.tipo === 'tela' ? (
                <>
                  <span className="pal-ico">{r.ico}</span>
                  <span>Ir para {r.rotulo}</span>
                </>
              ) : (
                <>
                  <span className="pal-ico">?</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="pal-t">{r.text}</span>
                    <span className="pal-tags">
                      <span className="tag src">{r.onde}</span>
                      {r.eixo ? <EixoTag n={r.eixo} /> : null}
                      {r.dim ? <DimTag n={r.dim} /> : null}
                    </span>
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
        <div className="pal-foot">
          <span><kbd>↑</kbd> <kbd>↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
          <span>{todas.length} perguntas indexadas</span>
        </div>
      </div>
    </div>
  )
}
