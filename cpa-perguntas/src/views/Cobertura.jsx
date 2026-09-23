import { EIXOS, DIMENSOES } from '../lib/model.js'
import { StatusPill } from '../components/ui.jsx'
import { MapaSinaes } from './Overview.jsx'

export default function Cobertura({ cobHoje, cobSel, escolhidas, ir }) {
  const antes = cobHoje.filter((c) => c.status === 'pendente').length
  const depois = cobSel.filter((c) => c.status === 'pendente').length
  const fracas = cobSel.filter((c) => c.status === 'fraca').length
  const semDim = escolhidas.filter((q) => !q.dim)
  return (
    <>
      <div className="page-h">
        <div>
          <div className="eyebrow">Resultado das suas escolhas</div>
          <h1>Cobertura e pendências</h1>
          <p>
            Perguntas em uso + perguntas que você marcou como “Entra”. Veja se algum eixo ou dimensão ficou de fora.
          </p>
        </div>
        <div className="spacer" />
        <button className="btn dark" onClick={() => ir('relatorio')}>
          Gerar relatório para o T.I →
        </button>
      </div>

      <div className="grid g4" style={{ marginBottom: 20 }}>
        <div className="card kpi">
          <div className="lbl">Dimensões sem pergunta — hoje</div>
          <div className="val num">{antes}</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Dimensões sem pergunta — com suas escolhas</div>
          <div className="val num" style={{ color: depois ? 'var(--crit)' : 'var(--green)' }}>
            {depois}
          </div>
        </div>
        <div className="card kpi">
          <div className="lbl">Dimensões fracas (só 1 pergunta)</div>
          <div className="val num">{fracas}</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Perguntas novas escolhidas</div>
          <div className="val num">{escolhidas.length}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-h">
          <h2>Mapa SINAES com as suas escolhas</h2>
          <div style={{ flex: 1 }} />
          <div className="legend">
            <span>
              <i style={{ background: 'var(--navy-2)' }} />
              Em uso hoje
            </span>
            <span>
              <i style={{ background: 'var(--green)' }} />
              Escolhidas por você
            </span>
          </div>
        </div>
        <div className="card-b">
          <MapaSinaes cob={cobSel} mostrarSel />
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h2>Dimensão por dimensão</h2>
        </div>
        <div className="card-b tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Eixo</th>
                <th>Dimensão</th>
                <th className="num">Em uso</th>
                <th className="num">Novas</th>
                <th>Hoje</th>
                <th>Com suas escolhas</th>
                <th style={{ width: '38%' }}>Perguntas novas escolhidas</th>
              </tr>
            </thead>
            <tbody>
              {EIXOS.flatMap((e) =>
                e.dims.map((d) => {
                  const h = cobHoje.find((c) => c.dim === d)
                  const s = cobSel.find((c) => c.dim === d)
                  const qs = escolhidas.filter((q) => q.dim === d)
                  return (
                    <tr key={d}>
                      <td>
                        <span className="tag eixo">
                          <span className="sw" style={{ background: e.cor }} />
                          Eixo {e.n}
                        </span>
                      </td>
                      <td>
                        <b>D{d}</b> · {DIMENSOES[d]}
                      </td>
                      <td className="num">{h.emUso}</td>
                      <td className="num">{s.sel}</td>
                      <td>
                        <StatusPill status={h.status} />
                      </td>
                      <td>
                        <StatusPill status={s.status} />
                      </td>
                      <td className="q" style={{ fontSize: 13.5 }}>
                        {qs.length ? (
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {qs.map((q) => (
                              <li key={q.id}>{q.text}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                }),
              )}
            </tbody>
          </table>
          {semDim.length > 0 && (
            <div className="banner" style={{ marginTop: 14, marginBottom: 0 }}>
              {semDim.length} pergunta(s) marcada(s) como “Entra” nas outras abas não têm dimensão definida na
              planilha e não entram nesta conta. Elas aparecem no relatório como “dimensão a definir”.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
