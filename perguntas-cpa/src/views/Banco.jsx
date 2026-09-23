import { useMemo, useState } from 'react'
import { EIXOS, DIMENSOES } from '../lib/model.js'
import { EixoTag, DimTag } from '../components/ui.jsx'

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function Banco({ model }) {
  const [busca, setBusca] = useState('')
  const [eixo, setEixo] = useState('')
  const [item, setItem] = useState('')
  const [modo, setModo] = useState('eixo')

  const lista = useMemo(() => {
    const b = norm(busca)
    return model.atual.filter(
      (q) =>
        (!b || norm(q.text).includes(b)) &&
        (!eixo || String(q.eixo) === eixo) &&
        (!item || q.item === item),
    )
  }, [model, busca, eixo, item])

  const grupos = useMemo(() => {
    const g = new Map()
    if (modo === 'item') {
      for (const it of model.itens) g.set(it, [])
      for (const q of lista) g.get(q.item).push(q)
    } else {
      for (const e of EIXOS) for (const d of e.dims) g.set(`Eixo ${e.n} · D${d} — ${DIMENSOES[d]}`, [])
      g.set('Dimensão a revisar', [])
      for (const q of lista) {
        const k = q.dim ? `Eixo ${q.eixo} · D${q.dim} — ${DIMENSOES[q.dim]}` : 'Dimensão a revisar'
        g.get(k).push(q)
      }
    }
    return [...g.entries()]
  }, [lista, modo, model.itens])

  return (
    <>
      <div className="page-h">
        <div>
          <div className="eyebrow">Instrumento vigente</div>
          <h1>Perguntas de hoje (2026.1)</h1>
          <p>
            Tudo o que a CPA já pergunta, com o texto exatamente como está cadastrado. Estas perguntas continuam como
            estão — a base nova é montada a partir delas.
          </p>
        </div>
      </div>

      <div className="filters">
        <label className="search">
          <span aria-hidden="true">⌕</span>
          <input placeholder="Buscar no texto da pergunta" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <select className="select" value={eixo} onChange={(e) => setEixo(e.target.value)} aria-label="Eixo">
          <option value="">Todos os eixos</option>
          {EIXOS.map((e) => (
            <option key={e.n} value={e.n}>
              Eixo {e.n} — {e.nome}
            </option>
          ))}
        </select>
        <select className="select" value={item} onChange={(e) => setItem(e.target.value)} aria-label="Item">
          <option value="">Todos os itens</option>
          {model.itens.map((it) => (
            <option key={it}>{it}</option>
          ))}
        </select>
        <div className="seg" role="tablist" aria-label="Agrupar">
          <button className={modo === 'eixo' ? 'on' : ''} onClick={() => setModo('eixo')}>
            Por eixo / dimensão
          </button>
          <button className={modo === 'item' ? 'on' : ''} onClick={() => setModo('item')}>
            Por item da pesquisa
          </button>
        </div>
      </div>

      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: '46%' }}>Pergunta</th>
              <th>{modo === 'item' ? 'Eixo / Dimensão' : 'Item da pesquisa'}</th>
              <th>Modalidades</th>
              <th>Tipo</th>
              <th className="num">Linhas na planilha</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map(([g, qs]) =>
              qs.length || (modo === 'eixo' && !busca && !item && (!eixo || g.startsWith(`Eixo ${eixo}`))) ? (
                <GroupRows key={g} titulo={g} qs={qs} modo={modo} />
              ) : null,
            )}
          </tbody>
        </table>
        {!lista.length && <div className="empty">Nenhuma pergunta encontrada com esses filtros.</div>}
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
        {lista.length} de {model.atual.length} perguntas · aba “CPA Atual (por eixo)”
      </div>
    </>
  )
}

function GroupRows({ titulo, qs, modo }) {
  return (
    <>
      <tr className="grp">
        <td colSpan={5}>
          {titulo} <span className="muted" style={{ fontWeight: 500 }}>· {qs.length}</span>
        </td>
      </tr>
      {qs.length === 0 && (
        <tr>
          <td colSpan={5} className="muted" style={{ fontStyle: 'italic' }}>
            Nenhuma pergunta hoje nesta dimensão.
          </td>
        </tr>
      )}
      {qs.map((q) => (
        <tr key={q.id}>
          <td className="q">{q.text}</td>
          <td>
            {modo === 'item' ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <EixoTag n={q.eixo} />
                <DimTag n={q.dim} texto={q.dimTexto} />
              </div>
            ) : (
              <span className="tag item">{q.item}</span>
            )}
          </td>
          <td style={{ fontSize: 12.5 }}>{q.modalidades.join(', ')}</td>
          <td style={{ fontSize: 12.5 }}>{q.tipo}</td>
          <td className="num mono">{q.linhas.join(', ')}</td>
        </tr>
      ))}
    </>
  )
}
