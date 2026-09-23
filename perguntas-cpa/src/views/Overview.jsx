import { EIXOS, DIMENSOES, STATUS } from '../lib/model.js'
import { StatusPill } from '../components/ui.jsx'

export function MapaSinaes({ cob, mostrarSel }) {
  const max = Math.max(...cob.map((c) => c.total), 1)
  return (
    <div className="eixos">
      {EIXOS.map((e) => (
        <div key={e.n} className="card eixo-card" style={{ '--c': e.cor }}>
          <div className="n">Eixo {e.n}</div>
          <h3>{e.nome}</h3>
          {e.dims.map((d) => {
            const c = cob.find((x) => x.dim === d)
            const wU = (c.emUso / max) * 100
            const wS = (c.sel / max) * 100
            return (
              <div className="dimrow" key={d}>
                <div className="t">
                  D{d} · {DIMENSOES[d]}
                </div>
                <div
                  className="bar"
                  title={`${c.emUso} em uso${mostrarSel ? ` + ${c.sel} escolhida(s)` : ''} · ${c.propostas} proposta(s) disponível(is)`}
                >
                  {c.emUso > 0 && <span className="u" style={{ width: `${wU}%` }} />}
                  {mostrarSel && c.sel > 0 && <span className="s" style={{ width: `${wS}%` }} />}
                </div>
                <div className="meta">
                  <StatusPill status={c.status} />
                  <span className="muted num" style={{ fontSize: 12 }}>
                    {c.emUso} em uso{mostrarSel && c.sel ? ` · +${c.sel} nova(s)` : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function Overview({ model, cobHoje, cobSel, nDecididas, ir }) {
  const coberta = (cob) => cob.filter((c) => c.total > 0).length
  const pend = cobHoje.filter((c) => c.status !== 'coberta')
  return (
    <>
      <section className="hero">
        <div className="deco" aria-hidden="true">
          <i className="a" />
          <i className="b" />
          <i className="c" />
        </div>
        <div className="eyebrow" style={{ color: '#8fd3b0' }}>
          Comissão Própria de Avaliação · 2026
        </div>
        <h1>Banco de Perguntas da CPA, organizado pelos eixos do SINAES</h1>
        <p>
          Veja o que o instrumento de 2026.1 já pergunta, onde estão as lacunas e escolha quais perguntas novas
          entram para cobrir os 5 eixos e as 10 dimensões.
        </p>
        <div className="actions">
          <button className="btn primary" onClick={() => ir('curadoria')}>
            Começar a montar a base →
          </button>
          <button className="btn" onClick={() => ir('banco')}>
            Ver perguntas de hoje
          </button>
        </div>
      </section>

      <div className="grid g4" style={{ marginBottom: 20 }}>
        <div className="card kpi">
          <div className="lbl">Perguntas em uso (2026.1)</div>
          <div className="val num">{model.atual.length}</div>
          <div className="sub">diferentes, sem repetir por modalidade</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Perguntas propostas</div>
          <div className="val num">{model.propostas.length}</div>
          <div className="sub">aba “Perguntas Propostas por Eixo”</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Dimensões com pergunta hoje</div>
          <div className="val num">
            {coberta(cobHoje)}
            <small>/10</small>
          </div>
          <div className="sub">
            {coberta(cobSel) > coberta(cobHoje)
              ? `${coberta(cobSel)}/10 com as suas escolhas`
              : 'faltam ' + (10 - coberta(cobHoje)) + ' dimensões'}
          </div>
        </div>
        <div className="card kpi">
          <div className="lbl">Suas decisões</div>
          <div className="val num">
            {nDecididas}
            <small>/{model.propostas.length}</small>
          </div>
          <div className="sub">propostas avaliadas por você</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-h">
          <div>
            <h2>Mapa SINAES — como estamos hoje</h2>
            <div className="muted" style={{ fontSize: 13 }}>
              Cada barra mostra quantas perguntas do instrumento 2026.1 caem na dimensão.
            </div>
          </div>
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
          <h2>O que falta hoje</h2>
        </div>
        <div className="card-b tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Dimensão</th>
                <th>Eixo</th>
                <th className="num">Em uso</th>
                <th className="num">Propostas disponíveis</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {pend
                .sort((a, b) => a.total - b.total || a.dim - b.dim)
                .map((c) => (
                  <tr key={c.dim}>
                    <td>
                      <b>D{c.dim}</b> · {DIMENSOES[c.dim]}
                    </td>
                    <td>Eixo {c.eixo}</td>
                    <td className="num">{c.emUso}</td>
                    <td className="num">{c.propostas}</td>
                    <td>
                      <StatusPill status={c.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Regra usada: {STATUS.pendente.rotulo} = nenhuma pergunta · {STATUS.fraca.rotulo} = 1 pergunta ·{' '}
            {STATUS.coberta.rotulo} = 2 ou mais. Perguntas com dimensão “a revisar” não entram na conta.
          </div>
        </div>
      </div>
    </>
  )
}
