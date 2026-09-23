import { useEffect, useMemo, useState } from 'react'
import { carregarConsolidado } from '../lib/api.js'
import { decidiveis } from '../lib/escolhas.js'
import { EixoTag, DimTag, DecisionChip } from '../components/ui.jsx'

export default function Consolidado({ model, sessao }) {
  const [pessoas, setPessoas] = useState(null)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState('todas')

  useEffect(() => {
    carregarConsolidado(sessao)
      .then((d) => setPessoas(d.pessoas))
      .catch((e) => setErro(e.status === 403 ? 'Esta área é só para administradores.' : 'Não foi possível carregar.'))
  }, [sessao])

  const linhas = useMemo(() => {
    if (!pessoas) return []
    return decidiveis(model)
      .filter((q) => q.fonte === 'proposta' || pessoas.some((p) => p.decisoes?.[q.id]))
      .map((q) => {
        const st = pessoas.map((p) => p.decisoes?.[q.id]?.status || null)
        const dec = st.filter(Boolean)
        let acordo = 'aguardando'
        if (dec.length === pessoas.length && dec.every((s) => s === dec[0])) acordo = dec[0] === 'sim' ? 'entra' : dec[0] === 'nao' ? 'fora' : 'duvida'
        else if (new Set(dec).size > 1) acordo = 'divergencia'
        return { q, st, notas: pessoas.map((p) => p.decisoes?.[q.id]?.nota || ''), acordo }
      })
  }, [model, pessoas])

  if (erro) return <div className="card empty">{erro}</div>
  if (!pessoas) return <div className="card empty">Carregando…</div>

  const ACORDO = {
    entra: ['Consenso: entra', 'st-ok', '✓'],
    fora: ['Consenso: não entra', '', '✕'],
    duvida: ['Todas em dúvida', 'st-warn', '?'],
    divergencia: ['Divergência', 'st-crit', '≠'],
    aguardando: ['Aguardando', '', '…'],
  }
  const vis = linhas.filter((l) => filtro === 'todas' || l.acordo === filtro)
  const total = model.propostas.length

  return (
    <>
      <div className="page-h">
        <div>
          <div className="eyebrow">Administração</div>
          <h1>Visão consolidada</h1>
          <p>
            As escolhas de cada avaliadora, lado a lado. Cada pessoa só vê e edita as próprias escolhas; esta tela é
            só para quem administra.
          </p>
        </div>
      </div>

      {pessoas.length === 0 ? (
        <div className="card empty">Ninguém salvou escolhas ainda.</div>
      ) : (
        <>
          <div className="grid g4" style={{ marginBottom: 20 }}>
            {pessoas.map((p) => {
              const n = model.propostas.filter((q) => p.decisoes?.[q.id]?.status).length
              const s = Object.values(p.decisoes || {}).filter((d) => d.status === 'sim').length
              return (
                <div key={p.email} className="card kpi">
                  <div className="lbl">{p.nome || p.email}</div>
                  <div className="val num">
                    {n}
                    <small>/{total}</small>
                  </div>
                  <div className="sub">
                    avaliadas · {s} “Entra” · {(p.sugestoes || []).length} sugestão(ões)
                    <br />
                    {p.atualizadoEm ? 'atualizado em ' + new Date(p.atualizadoEm).toLocaleString('pt-BR') : ''}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="filters">
            <div className="seg">
              {[['todas', 'Todas'], ['entra', 'Consenso: entra'], ['divergencia', 'Divergência'], ['aguardando', 'Aguardando'], ['fora', 'Consenso: fora']].map(
                ([k, r]) => (
                  <button key={k} className={filtro === k ? 'on' : ''} onClick={() => setFiltro(k)}>
                    {r} · {k === 'todas' ? linhas.length : linhas.filter((l) => l.acordo === k).length}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="card tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Pergunta</th>
                  <th>Eixo / Dimensão</th>
                  {pessoas.map((p) => (
                    <th key={p.email}>{p.nome || p.email}</th>
                  ))}
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {vis.map(({ q, st, notas, acordo }) => (
                  <tr key={q.id}>
                    <td className="q">
                      {q.text}
                      {q.fonte === 'setor' && (
                        <div>
                          <span className="tag src" style={{ marginTop: 6 }}>
                            {q.aba}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <EixoTag n={q.eixo} />
                        <DimTag n={q.dim} texto={q.dimTexto} />
                      </div>
                    </td>
                    {st.map((s, i) => (
                      <td key={i}>
                        <DecisionChip status={s} />
                        {notas[i] && (
                          <div className="muted" style={{ fontSize: 12, marginTop: 6, maxWidth: 220 }}>
                            “{notas[i]}”
                          </div>
                        )}
                      </td>
                    ))}
                    <td>
                      <span className={`st ${ACORDO[acordo][1]}`} style={!ACORDO[acordo][1] ? { background: '#eef0f4', color: '#5b6475' } : undefined}>
                        <span className="i" style={!ACORDO[acordo][1] ? { background: '#8b93a3' } : undefined}>
                          {ACORDO[acordo][2]}
                        </span>
                        {ACORDO[acordo][0]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
